-- =====================================================================
-- RLS verification — automates .specs/02-database.md §6
-- Run in the Supabase SQL Editor AFTER supabase/schema.sql.
--
-- Creates 3 throwaway users, impersonates them (anon / authenticated JWT
-- claims), records PASS/FAIL per check and deletes the users at the end.
-- Storage probes run in rolled-back subtransactions, so no objects remain.
-- Expected output: every row says PASS.
-- =====================================================================

-- Test identities
--   A = merchant "RLS Test Store A"   aaaaaaaa-0000-4000-8000-000000000001
--   B = customer                       bbbbbbbb-0000-4000-8000-000000000002
--   C = merchant sign-up with A's store name (must fall back to customer)
--                                      cccccccc-0000-4000-8000-000000000003
-- Products of A
--   P1 active  dddddddd-0000-4000-8000-000000000001
--   P2 hidden  dddddddd-0000-4000-8000-000000000002

reset role;
select set_config('request.jwt.claims', '', false);
select set_config('rls.results', '', false);

delete from auth.users
where id in (
  'aaaaaaaa-0000-4000-8000-000000000001',
  'bbbbbbbb-0000-4000-8000-000000000002',
  'cccccccc-0000-4000-8000-000000000003'
);

-- Inserting into auth.users fires on_auth_user_created, exactly like a real sign-up.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rls-merchant-a@example.test', '', now(),
   '{}', '{"display_name": "Merchant A", "role": "merchant", "store_name": "RLS Test Store A"}', now(), now()),
  ('bbbbbbbb-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rls-customer-b@example.test', '', now(),
   '{}', '{"display_name": "Customer B", "role": "customer"}', now(), now()),
  ('cccccccc-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rls-merchant-c@example.test', '', now(),
   '{}', '{"display_name": "Merchant C", "role": "merchant", "store_name": "rls test store a"}', now(), now());

-- ---------------------------------------------------------------------
-- 01 Sign-up trigger (as postgres)
-- ---------------------------------------------------------------------
do $$
declare
  v_ok_a boolean;
  v_ok_b boolean;
  v_ok_c boolean;
begin
  select exists (select 1 from public.profiles
                 where id = 'aaaaaaaa-0000-4000-8000-000000000001'
                   and role = 'merchant' and store_name = 'RLS Test Store A') into v_ok_a;
  select exists (select 1 from public.profiles
                 where id = 'bbbbbbbb-0000-4000-8000-000000000002'
                   and role = 'customer') into v_ok_b;
  select exists (select 1 from public.profiles
                 where id = 'cccccccc-0000-4000-8000-000000000003'
                   and role = 'customer' and store_name is null) into v_ok_c;

  perform set_config('rls.results', current_setting('rls.results')
    || case when v_ok_a then 'PASS' else 'FAIL' end || '|01a trigger creates merchant profile|' || E'\n'
    || case when v_ok_b then 'PASS' else 'FAIL' end || '|01b trigger creates customer profile|' || E'\n'
    || case when v_ok_c then 'PASS' else 'FAIL' end || '|01c duplicate store name falls back to customer|' || E'\n', false);
end $$;

-- ---------------------------------------------------------------------
-- As customer B
-- ---------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "bbbbbbbb-0000-4000-8000-000000000002", "role": "authenticated"}', false);
set role authenticated;

do $$
begin
  insert into public.products (title, price) values ('Blocked product', 10);
  perform set_config('rls.results', current_setting('rls.results')
    || 'FAIL|02 customer cannot create products|insert succeeded' || E'\n', false);
exception when insufficient_privilege then
  perform set_config('rls.results', current_setting('rls.results')
    || 'PASS|02 customer cannot create products|' || sqlerrm || E'\n', false);
end $$;

reset role;

-- ---------------------------------------------------------------------
-- As merchant A
-- ---------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "aaaaaaaa-0000-4000-8000-000000000001", "role": "authenticated"}', false);
set role authenticated;

do $$
declare
  v_owner uuid;
begin
  insert into public.products (id, title, price, stock)
  values ('dddddddd-0000-4000-8000-000000000001', 'RLS active product', 1000, 5);
  insert into public.products (id, title, price, is_active)
  values ('dddddddd-0000-4000-8000-000000000002', 'RLS hidden product', 2000, false);

  select user_id into v_owner from public.products where id = 'dddddddd-0000-4000-8000-000000000001';
  perform set_config('rls.results', current_setting('rls.results')
    || case when v_owner = 'aaaaaaaa-0000-4000-8000-000000000001' then 'PASS' else 'FAIL' end
    || '|03 merchant creates own products (user_id defaults to auth.uid())|' || E'\n', false);
exception when others then
  perform set_config('rls.results', current_setting('rls.results')
    || 'FAIL|03 merchant creates own products (user_id defaults to auth.uid())|' || sqlstate || ' ' || sqlerrm || E'\n', false);
end $$;

do $$
begin
  insert into public.products (title, price, images)
  values ('Foreign image product', 10,
          array['bbbbbbbb-0000-4000-8000-000000000002/eeeeeeee-0000-4000-8000-000000000001.webp']);
  perform set_config('rls.results', current_setting('rls.results')
    || 'FAIL|04 image paths outside own folder are rejected|insert succeeded' || E'\n', false);
exception
  when sqlstate '22023' then
    perform set_config('rls.results', current_setting('rls.results')
      || 'PASS|04 image paths outside own folder are rejected|' || sqlerrm || E'\n', false);
  when others then
    perform set_config('rls.results', current_setting('rls.results')
      || 'FAIL|04 image paths outside own folder are rejected|unexpected ' || sqlstate || E'\n', false);
end $$;

do $$
begin
  update public.products
  set user_id = 'bbbbbbbb-0000-4000-8000-000000000002'
  where id = 'dddddddd-0000-4000-8000-000000000001';
  perform set_config('rls.results', current_setting('rls.results')
    || 'FAIL|05 merchant cannot transfer product ownership|update succeeded' || E'\n', false);
exception when insufficient_privilege then
  perform set_config('rls.results', current_setting('rls.results')
    || 'PASS|05 merchant cannot transfer product ownership|' || sqlerrm || E'\n', false);
end $$;

do $$
begin
  update public.profiles set role = 'customer' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
  perform set_config('rls.results', current_setting('rls.results')
    || 'FAIL|06 users cannot change their own role|update succeeded' || E'\n', false);
exception when insufficient_privilege then
  perform set_config('rls.results', current_setting('rls.results')
    || 'PASS|06 users cannot change their own role|' || sqlerrm || E'\n', false);
end $$;

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.products where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
  perform set_config('rls.results', current_setting('rls.results')
    || case when v_count = 2 then 'PASS' else 'FAIL' end
    || '|07 merchant sees own inactive products|visible rows: ' || v_count || E'\n', false);
end $$;

-- Storage: own folder allowed, foreign folder denied. Probes are rolled back.
do $$
begin
  insert into storage.objects (bucket_id, name)
  values ('product-images', 'aaaaaaaa-0000-4000-8000-000000000001/rls-probe.webp');
  raise exception 'rollback probe' using errcode = 'P0001';
exception
  when sqlstate 'P0001' then
    perform set_config('rls.results', current_setting('rls.results')
      || 'PASS|08 merchant can upload to own storage folder|' || E'\n', false);
  when others then
    perform set_config('rls.results', current_setting('rls.results')
      || 'FAIL|08 merchant can upload to own storage folder|' || sqlstate || ' ' || sqlerrm || E'\n', false);
end $$;

do $$
begin
  insert into storage.objects (bucket_id, name)
  values ('product-images', 'bbbbbbbb-0000-4000-8000-000000000002/rls-probe.webp');
  raise exception 'rollback probe' using errcode = 'P0001';
exception
  when insufficient_privilege then
    perform set_config('rls.results', current_setting('rls.results')
      || 'PASS|09 merchant cannot upload to another folder|' || sqlerrm || E'\n', false);
  when others then
    perform set_config('rls.results', current_setting('rls.results')
      || 'FAIL|09 merchant cannot upload to another folder|' || sqlstate || ' ' || sqlerrm || E'\n', false);
end $$;

reset role;

-- ---------------------------------------------------------------------
-- As customer B (against A's products)
-- ---------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "bbbbbbbb-0000-4000-8000-000000000002", "role": "authenticated"}', false);
set role authenticated;

do $$
declare
  v_updated integer;
  v_deleted integer;
  v_visible integer;
begin
  update public.products set price = 0 where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
  get diagnostics v_updated = row_count;
  delete from public.products where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
  get diagnostics v_deleted = row_count;
  select count(*) into v_visible from public.products where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';

  perform set_config('rls.results', current_setting('rls.results')
    || case when v_updated = 0 then 'PASS' else 'FAIL' end
    || '|10 others cannot update a merchant''s products|rows updated: ' || v_updated || E'\n'
    || case when v_deleted = 0 then 'PASS' else 'FAIL' end
    || '|11 others cannot delete a merchant''s products|rows deleted: ' || v_deleted || E'\n'
    || case when v_visible = 1 then 'PASS' else 'FAIL' end
    || '|12 others only see active products|visible rows: ' || v_visible || E'\n', false);
end $$;

do $$
begin
  perform public.become_merchant('rls test store a');
  perform set_config('rls.results', current_setting('rls.results')
    || 'FAIL|13 become_merchant rejects a taken store name|call succeeded' || E'\n', false);
exception when unique_violation then
  perform set_config('rls.results', current_setting('rls.results')
    || 'PASS|13 become_merchant rejects a taken store name|' || sqlerrm || E'\n', false);
end $$;

do $$
declare
  v_role text;
begin
  perform public.become_merchant('RLS Test Store B');
  select role into v_role from public.profiles where id = 'bbbbbbbb-0000-4000-8000-000000000002';
  perform set_config('rls.results', current_setting('rls.results')
    || case when v_role = 'merchant' then 'PASS' else 'FAIL' end
    || '|14 become_merchant upgrades the caller|role: ' || coalesce(v_role, 'null') || E'\n', false);
exception when others then
  perform set_config('rls.results', current_setting('rls.results')
    || 'FAIL|14 become_merchant upgrades the caller|' || sqlstate || ' ' || sqlerrm || E'\n', false);
end $$;

reset role;

-- ---------------------------------------------------------------------
-- As anonymous visitor
-- ---------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role": "anon"}', false);
set role anon;

do $$
declare
  v_products integer;
  v_customer_profiles integer;
  v_merchant_profiles integer;
begin
  select count(*) into v_products from public.products
  where id in ('dddddddd-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000002');
  select count(*) into v_customer_profiles from public.profiles
  where id = 'cccccccc-0000-4000-8000-000000000003';
  select count(*) into v_merchant_profiles from public.profiles
  where id = 'aaaaaaaa-0000-4000-8000-000000000001';

  perform set_config('rls.results', current_setting('rls.results')
    || case when v_products = 1 then 'PASS' else 'FAIL' end
    || '|15 anon only sees active products|visible rows: ' || v_products || E'\n'
    || case when v_customer_profiles = 0 then 'PASS' else 'FAIL' end
    || '|16 anon cannot read customer profiles|visible rows: ' || v_customer_profiles || E'\n'
    || case when v_merchant_profiles = 1 then 'PASS' else 'FAIL' end
    || '|17 anon can read merchant profiles|visible rows: ' || v_merchant_profiles || E'\n', false);
end $$;

do $$
begin
  insert into public.products (user_id, title, price)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'Anon product', 10);
  perform set_config('rls.results', current_setting('rls.results')
    || 'FAIL|18 anon cannot create products|insert succeeded' || E'\n', false);
exception when insufficient_privilege then
  perform set_config('rls.results', current_setting('rls.results')
    || 'PASS|18 anon cannot create products|' || sqlerrm || E'\n', false);
end $$;

reset role;

-- ---------------------------------------------------------------------
-- Cleanup (cascades to profiles and products) and report
-- ---------------------------------------------------------------------
select set_config('request.jwt.claims', '', false);

delete from auth.users
where id in (
  'aaaaaaaa-0000-4000-8000-000000000001',
  'bbbbbbbb-0000-4000-8000-000000000002',
  'cccccccc-0000-4000-8000-000000000003'
);

select
  split_part(line, '|', 1) as result,
  split_part(line, '|', 2) as check_name,
  split_part(line, '|', 3) as detail
from regexp_split_to_table(rtrim(current_setting('rls.results'), E'\n'), E'\n') as line;
