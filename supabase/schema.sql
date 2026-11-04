-- =====================================================================
-- Phone Accessories Marketplace — Supabase schema
-- Spec: .specs/02-database.md
-- Idempotent: safe to re-run in the Supabase SQL Editor.
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- =====================================================================
-- 1. TABLES
-- =====================================================================

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         text not null default 'customer'
               check (role in ('customer', 'merchant')),
  display_name text check (char_length(display_name) between 1 and 80),
  store_name   text check (char_length(store_name) between 2 and 80),
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint profiles_merchant_requires_store_name
    check (role <> 'merchant' or store_name is not null)
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
              references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 5000),
  category    text not null default 'other'
              check (category in (
                'case', 'screen_protector', 'charger', 'cable',
                'headphones', 'power_bank', 'mount', 'other'
              )),
  price       numeric(12, 2) not null check (price >= 0),
  stock       integer not null default 0 check (stock >= 0),
  images      text[] not null default '{}'
              check (cardinality(images) <= 8 and array_position(images, null) is null),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- 2. INDEXES
-- =====================================================================

create unique index if not exists profiles_store_name_unique_idx
  on public.profiles (lower(store_name))
  where store_name is not null;

create index if not exists products_user_id_created_at_idx
  on public.products (user_id, created_at desc);

create index if not exists products_active_created_at_idx
  on public.products (created_at desc)
  where is_active;

create index if not exists products_active_category_idx
  on public.products (category, created_at desc)
  where is_active;

create index if not exists products_active_title_trgm_idx
  on public.products using gin (title extensions.gin_trgm_ops)
  where is_active;

-- =====================================================================
-- 3. FUNCTIONS
-- =====================================================================

-- Keeps updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Creates the profile right after Supabase Auth inserts the user.
-- Every account starts as customer: metadata is user-controlled, so any
-- role or store_name in it is ignored. The merchant role is granted by the
-- admin with supabase/admin/grant-merchant.sql.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'customer',
    nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 80), '')
  );

  return new;
end;
$$;

-- True when the current user is a merchant. Used inside RLS policies.
create or replace function public.is_merchant()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'merchant'
  );
$$;

-- Removed: in a single-seller deployment users cannot promote themselves.
drop function if exists public.become_merchant(text);

-- Image paths must live inside the owner's storage folder: "{user_id}/..."
create or replace function public.validate_product_images()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from unnest(new.images) as image_path
    where image_path not like new.user_id::text || '/%'
       or image_path like '%..%'
  ) then
    raise exception 'Image paths must be inside the owner folder' using errcode = '22023';
  end if;

  return new;
end;
$$;

-- =====================================================================
-- 4. TRIGGERS
-- =====================================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists products_validate_images on public.products;
create trigger products_validate_images
  before insert or update of images, user_id on public.products
  for each row execute function public.validate_product_images();

-- =====================================================================
-- 5. PRIVILEGES (defense in depth on top of RLS)
-- =====================================================================

-- Profiles are created by the trigger and removed by cascade.
-- Users may only update their public fields — never `role`.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, store_name, avatar_url) on public.profiles to authenticated;

revoke insert, update, delete on public.products from anon;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- =====================================================================
-- 6. ROW LEVEL SECURITY — profiles
-- =====================================================================

alter table public.profiles enable row level security;

drop policy if exists "Profiles: owner can read own profile" on public.profiles;
create policy "Profiles: owner can read own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Profiles: merchant profiles are public" on public.profiles;
create policy "Profiles: merchant profiles are public"
  on public.profiles for select
  to anon, authenticated
  using (role = 'merchant');

drop policy if exists "Profiles: owner can update own profile" on public.profiles;
create policy "Profiles: owner can update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- =====================================================================
-- 7. ROW LEVEL SECURITY — products
-- =====================================================================

alter table public.products enable row level security;

drop policy if exists "Products: active products are public" on public.products;
create policy "Products: active products are public"
  on public.products for select
  to anon, authenticated
  using (is_active);

drop policy if exists "Products: owner can read all own products" on public.products;
create policy "Products: owner can read all own products"
  on public.products for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Products: merchants can create own products" on public.products;
create policy "Products: merchants can create own products"
  on public.products for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.is_merchant())
  );

drop policy if exists "Products: owner can update own products" on public.products;
create policy "Products: owner can update own products"
  on public.products for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Products: owner can delete own products" on public.products;
create policy "Products: owner can delete own products"
  on public.products for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- =====================================================================
-- 8. STORAGE — bucket product-images ({user_id}/{uuid}.webp)
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Needed by the Storage API for upsert/remove. Public reads use the CDN URL.
drop policy if exists "Product images: merchants can read own folder" on storage.objects;
create policy "Product images: merchants can read own folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Product images: merchants can upload to own folder" on storage.objects;
create policy "Product images: merchants can upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_merchant())
  );

drop policy if exists "Product images: merchants can update own files" on storage.objects;
create policy "Product images: merchants can update own files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_merchant())
  );

drop policy if exists "Product images: merchants can delete own files" on storage.objects;
create policy "Product images: merchants can delete own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
