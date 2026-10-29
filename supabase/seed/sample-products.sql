-- =====================================================================
-- Sample products seed + load checks
-- Run in the Supabase SQL Editor AFTER supabase/schema.sql.
-- Idempotent: re-running deletes and recreates the demo data.
-- Remove it with supabase/seed/sample-products-cleanup.sql.
--
-- Creates 2 demo merchants (no password, they cannot sign in) and 14
-- products covering every category, one out of stock and one hidden.
-- Images are left empty: Storage files can only be uploaded through the
-- app's upload pipeline, so the storefront shows the placeholder icon.
-- Expected output: every row says PASS.
-- =====================================================================

-- Demo identities
--   M1 = "Tienda Demo Norte"  5eed0000-0000-4000-8000-000000000001  (10 products, 1 hidden)
--   M2 = "Tienda Demo Sur"    5eed0000-0000-4000-8000-000000000002  (4 products)
-- Products use ids 5eed1000-0000-4000-8000-0000000000NN

reset role;
select set_config('request.jwt.claims', '', false);
select set_config('seed.results', '', false);

-- Cascades to profiles and products.
delete from auth.users
where id in (
  '5eed0000-0000-4000-8000-000000000001',
  '5eed0000-0000-4000-8000-000000000002'
);

-- Inserting into auth.users fires on_auth_user_created, exactly like a real sign-up.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('5eed0000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'demo-norte@example.test', '', now(),
   '{}', '{"display_name": "Demo Norte", "role": "merchant", "store_name": "Tienda Demo Norte"}', now(), now()),
  ('5eed0000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'demo-sur@example.test', '', now(),
   '{}', '{"display_name": "Demo Sur", "role": "merchant", "store_name": "Tienda Demo Sur"}', now(), now());

-- Staggered created_at keeps the storefront order (created_at desc) deterministic.
insert into public.products (id, user_id, title, description, category, price, stock, is_active, created_at)
values
  ('5eed1000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000001',
   'Funda de silicona iPhone 16', 'Silicona suave al tacto con interior de microfibra. Protege bordes y cámara.',
   'case', 12990, 25, true, now() - interval '1 minute'),
  ('5eed1000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000001',
   'Funda transparente antigolpes Galaxy S25', 'Esquinas reforzadas y compatible con carga inalámbrica.',
   'case', 9990, 40, true, now() - interval '2 minutes'),
  ('5eed1000-0000-4000-8000-000000000003', '5eed0000-0000-4000-8000-000000000001',
   'Lámina de vidrio templado 9H iPhone 16', 'Pack de 2 láminas con marco de instalación.',
   'screen_protector', 7990, 60, true, now() - interval '3 minutes'),
  ('5eed1000-0000-4000-8000-000000000004', '5eed0000-0000-4000-8000-000000000001',
   'Cargador USB-C 30W GaN', 'Compacto, compatible con carga rápida PD 3.0.',
   'charger', 19990, 15, true, now() - interval '4 minutes'),
  ('5eed1000-0000-4000-8000-000000000005', '5eed0000-0000-4000-8000-000000000001',
   'Cable USB-C a USB-C trenzado 2 m', 'Soporta 60W y transferencia USB 2.0.',
   'cable', 6990, 80, true, now() - interval '5 minutes'),
  ('5eed1000-0000-4000-8000-000000000006', '5eed0000-0000-4000-8000-000000000001',
   'Cable Lightning 1 m', 'Para iPhone 14 y anteriores.',
   'cable', 5990, 0, true, now() - interval '6 minutes'),
  ('5eed1000-0000-4000-8000-000000000007', '5eed0000-0000-4000-8000-000000000001',
   'Audífonos inalámbricos con estuche de carga', 'Bluetooth 5.3, hasta 24 horas con el estuche.',
   'headphones', 29990, 10, true, now() - interval '7 minutes'),
  ('5eed1000-0000-4000-8000-000000000008', '5eed0000-0000-4000-8000-000000000001',
   'Batería externa 10.000 mAh', 'Dos salidas, una USB-C PD de 20W.',
   'power_bank', 17990, 20, true, now() - interval '8 minutes'),
  ('5eed1000-0000-4000-8000-000000000009', '5eed0000-0000-4000-8000-000000000001',
   'Soporte magnético para auto', 'Se fija a la rejilla de ventilación.',
   'mount', 8990, 30, true, now() - interval '9 minutes'),
  ('5eed1000-0000-4000-8000-000000000010', '5eed0000-0000-4000-8000-000000000001',
   'Funda edición limitada (borrador)', 'Producto oculto: no debe aparecer en la tienda pública.',
   'case', 15990, 5, false, now() - interval '10 minutes'),
  ('5eed1000-0000-4000-8000-000000000011', '5eed0000-0000-4000-8000-000000000002',
   'Hidrogel mate Pixel 9', 'Lámina flexible antihuellas.',
   'screen_protector', 4990, 50, true, now() - interval '11 minutes'),
  ('5eed1000-0000-4000-8000-000000000012', '5eed0000-0000-4000-8000-000000000002',
   'Cargador de auto doble USB-C 45W', 'Carga dos teléfonos a la vez.',
   'charger', 14990, 12, true, now() - interval '12 minutes'),
  ('5eed1000-0000-4000-8000-000000000013', '5eed0000-0000-4000-8000-000000000002',
   'Batería MagSafe 5.000 mAh', 'Se adhiere magnéticamente a la parte trasera del iPhone.',
   'power_bank', 24990, 8, true, now() - interval '13 minutes'),
  ('5eed1000-0000-4000-8000-000000000014', '5eed0000-0000-4000-8000-000000000002',
   'Anillo soporte para teléfono', 'Rotación de 360° y uso como atril.',
   'other', 3990, 100, true, now() - interval '14 minutes');

-- ---------------------------------------------------------------------
-- S1–S3 Data loaded (as postgres)
-- ---------------------------------------------------------------------
do $$
declare
  v_merchants int;
  v_products  int;
  v_categories int;
begin
  select count(*) from public.profiles
  where id in ('5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000002')
    and role = 'merchant'
  into v_merchants;

  select count(*) from public.products
  where user_id in ('5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000002')
  into v_products;

  select count(distinct category) from public.products
  where user_id in ('5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000002')
    and is_active
  into v_categories;

  perform set_config('seed.results', current_setting('seed.results')
    || case when v_merchants = 2 then 'PASS' else 'FAIL' end || '|S1 demo merchant profiles created|' || v_merchants || ' of 2' || E'\n'
    || case when v_products = 14 then 'PASS' else 'FAIL' end || '|S2 sample products inserted|' || v_products || ' of 14' || E'\n'
    || case when v_categories = 8 then 'PASS' else 'FAIL' end || '|S3 active products cover every category|' || v_categories || ' of 8' || E'\n', false);
end $$;

-- ---------------------------------------------------------------------
-- S4–S7 Public storefront view (as anon)
-- ---------------------------------------------------------------------
set role anon;

do $$
declare
  v_visible     int;
  v_hidden      int;
  v_stores      int;
  v_out_of_stock int;
begin
  select count(*) from public.products
  where user_id in ('5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000002')
  into v_visible;

  select count(*) from public.products
  where id = '5eed1000-0000-4000-8000-000000000010'
  into v_hidden;

  select count(*) from public.profiles
  where id in ('5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000002')
  into v_stores;

  select count(*) from public.products
  where id = '5eed1000-0000-4000-8000-000000000006' and stock = 0
  into v_out_of_stock;

  perform set_config('seed.results', current_setting('seed.results')
    || case when v_visible = 13 then 'PASS' else 'FAIL' end || '|S4 anon sees only active products|' || v_visible || ' of 13' || E'\n'
    || case when v_hidden = 0 then 'PASS' else 'FAIL' end || '|S5 hidden product not public|' || E'\n'
    || case when v_stores = 2 then 'PASS' else 'FAIL' end || '|S6 anon can read demo stores|' || v_stores || ' of 2' || E'\n'
    || case when v_out_of_stock = 1 then 'PASS' else 'FAIL' end || '|S7 out-of-stock product stays public|' || E'\n', false);
end $$;

reset role;

-- ---------------------------------------------------------------------
-- S8 Owner sees their hidden product (as M1)
-- ---------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "5eed0000-0000-4000-8000-000000000001", "role": "authenticated"}', false);
set role authenticated;

do $$
declare
  v_own int;
begin
  select count(*) from public.products
  where user_id in ('5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000002')
  into v_own;

  perform set_config('seed.results', current_setting('seed.results')
    || case when v_own = 10 + 4 then 'PASS' else 'FAIL' end || '|S8 owner sees own hidden product|' || v_own || ' rows (10 own + 4 public of M2)' || E'\n', false);
end $$;

reset role;

-- ---------------------------------------------------------------------
-- S9–S10 Tenant isolation (as M2)
-- ---------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub": "5eed0000-0000-4000-8000-000000000002", "role": "authenticated"}', false);
set role authenticated;

do $$
declare
  v_hidden  int;
  v_updated int;
begin
  select count(*) from public.products
  where id = '5eed1000-0000-4000-8000-000000000010'
  into v_hidden;

  update public.products set price = 1
  where id = '5eed1000-0000-4000-8000-000000000001';
  get diagnostics v_updated = row_count;

  perform set_config('seed.results', current_setting('seed.results')
    || case when v_hidden = 0 then 'PASS' else 'FAIL' end || '|S9 other merchant cannot see hidden product|' || E'\n'
    || case when v_updated = 0 then 'PASS' else 'FAIL' end || '|S10 other merchant cannot edit product|' || v_updated || ' rows updated' || E'\n', false);
end $$;

reset role;
select set_config('request.jwt.claims', '', false);

select
  split_part(line, '|', 1) as result,
  split_part(line, '|', 2) as check_name,
  split_part(line, '|', 3) as detail
from regexp_split_to_table(rtrim(current_setting('seed.results'), E'\n'), E'\n') as line;
