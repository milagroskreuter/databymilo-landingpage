-- Ventas de Hotmart (las carga el webhook /api/webhooks/hotmart).
-- Una fila por transacción: si la compra cambia de estado (reembolso,
-- contracargo, etc.) se actualiza la misma fila.
create table if not exists public.sales (
  transaction text primary key,
  status text not null,                 -- approved | completed | refunded | chargeback | canceled | ...
  last_event text not null,             -- último evento de Hotmart (PURCHASE_APPROVED, ...)
  product_id text,
  product_name text,
  resource_slug text,                   -- recurso del sitio, si se pudo asociar
  buyer_email text,
  buyer_name text,
  price numeric(12, 2),                 -- lo que pagó la compradora
  currency text,
  net_amount numeric(12, 2),            -- lo que te queda (comisión de productora), si Hotmart lo informa
  net_currency text,
  payment_type text,
  is_test boolean not null default false,
  purchased_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sales_approved_at_idx on public.sales (approved_at desc);
create index if not exists sales_buyer_email_idx on public.sales (buyer_email);
alter table public.sales enable row level security;

-- Registro crudo de cada aviso que manda Hotmart (para revisar el formato y depurar).
create table if not exists public.hotmart_webhook_log (
  id bigint generated always as identity primary key,
  event text,
  transaction text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists hotmart_webhook_log_created_idx on public.hotmart_webhook_log (created_at desc);
alter table public.hotmart_webhook_log enable row level security;

-- Lista de compradoras: se llena sola con cada compra aprobada.
-- Inactiva para que nadie pueda sumarse desde el sitio público.
insert into public.mail_lists (slug, name, description, kind, source, active, sort_order) values
  ('compradoras', 'Compradoras', 'Se llena sola con cada compra aprobada en Hotmart.', 'system', 'supabase', false, 2)
on conflict (slug) do nothing;
