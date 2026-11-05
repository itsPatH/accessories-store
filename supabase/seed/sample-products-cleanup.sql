-- =====================================================================
-- Removes the demo data created by supabase/seed/sample-products.sql.
-- Deleting the auth users cascades to their profiles and products.
-- =====================================================================

reset role;

delete from auth.users
where id in (
  '5eed0000-0000-4000-8000-000000000001',
  '5eed0000-0000-4000-8000-000000000002'
);

select count(*) as remaining_demo_products
from public.products
where id::text like '5eed1000-%';
