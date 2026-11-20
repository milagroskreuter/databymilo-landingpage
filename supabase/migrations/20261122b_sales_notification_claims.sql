-- Marcas para avisar cada venta / reembolso una sola vez, aunque Hotmart
-- mande varios avisos al mismo tiempo (el primero que marca, avisa).
alter table public.sales add column if not exists notified_sale_at timestamptz;
alter table public.sales add column if not exists notified_refund_at timestamptz;
update public.sales set notified_sale_at = coalesce(notified_sale_at, updated_at) where is_test;
update public.sales set notified_refund_at = coalesce(notified_refund_at, updated_at) where is_test and status in ('refunded','chargeback');
