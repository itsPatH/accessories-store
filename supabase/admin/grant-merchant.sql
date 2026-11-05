-- =====================================================================
-- Grants the merchant role to one account (admin only).
-- Run in the Supabase SQL Editor after the person has registered at
-- /register and confirmed the email. See .specs/03-auth-flow.md §3.5.
--
-- 1. Replace the two values below.
-- 2. Run. The last select must show role = merchant.
-- =====================================================================

do $$
declare
  v_email      text := 'cliente@example.com';   -- account to promote
  v_store_name text := 'Nombre de la tienda';   -- shown on the storefront, 2–80 chars
  v_user_id    uuid;
begin
  select id into v_user_id from auth.users where lower(email) = lower(trim(v_email));

  if v_user_id is null then
    raise exception 'No account with email %. Register it at /register first.', v_email;
  end if;

  update public.profiles
  set role = 'merchant',
      store_name = trim(v_store_name)
  where id = v_user_id;
end $$;

select u.email, p.role, p.store_name
from public.profiles as p
join auth.users as u on u.id = p.id
where p.role = 'merchant'
order by u.email;

-- ---------------------------------------------------------------------
-- Revoke (e.g. your own test account once QA is done): set the email,
-- uncomment and run. Its products are hidden (not deleted) because the
-- public catalog lists every active product regardless of role, and the
-- account can no longer create or edit them.
-- ---------------------------------------------------------------------
-- do $$
-- declare
--   v_user_id uuid := (select id from auth.users where lower(email) = lower('tu-cuenta-de-prueba@example.com'));
-- begin
--   update public.products set is_active = false where user_id = v_user_id;
--   update public.profiles set role = 'customer' where id = v_user_id;
-- end $$;
