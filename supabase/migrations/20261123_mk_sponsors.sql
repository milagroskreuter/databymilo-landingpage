-- Marketing · Sponsors: media kit, seguimiento de marcas (CRM), espacios
-- patrocinados, tarifas, reportes de campaña y colaboraciones con creadores.
-- RLS activo y sin políticas: solo se usan con la service key.

-- Ajustes del área (clave → jsonb). Clave usada: 'media_kit'.
create table if not exists public.mk_sponsors_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.mk_sponsors_settings enable row level security;

-- Marcas / acuerdos.
create table if not exists public.mk_sponsors_deals (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  stage text not null default 'prospecto', -- prospecto | contactada | negociando | cerrada | cobrada | perdida
  contact_name text,
  contact_email text,
  contact_role text,
  website text,
  amount numeric(12, 2),
  currency text not null default 'USD',
  notes text,
  next_step text,
  next_step_on date,
  closed_on date,
  paid_on date,
  lost_reason text,
  show_in_media_kit boolean not null default false, -- aparece en "marcas con las que trabajé"
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mk_sponsors_deals_stage_idx on public.mk_sponsors_deals (stage);
create index if not exists mk_sponsors_deals_next_idx on public.mk_sponsors_deals (next_step_on);
alter table public.mk_sponsors_deals enable row level security;

-- Historial de interacciones con cada marca.
create table if not exists public.mk_sponsors_interactions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.mk_sponsors_deals (id) on delete cascade,
  happened_on date not null default current_date,
  kind text not null default 'nota', -- email | llamada | reunion | mensaje | propuesta | nota
  summary text not null,
  created_at timestamptz not null default now()
);
create index if not exists mk_sponsors_interactions_deal_idx on public.mk_sponsors_interactions (deal_id, happened_on desc);
alter table public.mk_sponsors_interactions enable row level security;

-- Piezas de contenido (mk_content) asociadas a un acuerdo, para el reporte.
create table if not exists public.mk_sponsors_deal_content (
  deal_id uuid not null references public.mk_sponsors_deals (id) on delete cascade,
  content_id uuid not null references public.mk_content (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (deal_id, content_id)
);
alter table public.mk_sponsors_deal_content enable row level security;

-- Espacios patrocinados (slots del calendario).
create table if not exists public.mk_sponsors_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  channel text not null, -- linkedin | instagram | newsletter | blog
  format text,
  deal_id uuid references public.mk_sponsors_deals (id) on delete set null,
  brand text, -- texto libre si todavía no hay acuerdo cargado
  price numeric(12, 2),
  currency text not null default 'USD',
  status text not null default 'disponible', -- disponible | reservado | confirmado | publicado | cobrado | cancelado
  content_id uuid references public.mk_content (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mk_sponsors_slots_date_idx on public.mk_sponsors_slots (slot_date);
alter table public.mk_sponsors_slots enable row level security;

-- Tarifas por formato.
create table if not exists public.mk_sponsors_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text,
  description text,
  price numeric(12, 2),
  price_to numeric(12, 2), -- si es un rango
  currency text not null default 'USD',
  public boolean not null default true, -- se muestra en el media kit (si las tarifas están visibles)
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mk_sponsors_rates enable row level security;

-- Colaboraciones con otros creadores.
create table if not exists public.mk_sponsors_collabs (
  id uuid primary key default gen_random_uuid(),
  creator_name text not null,
  handle text,
  network text,
  idea text,
  status text not null default 'idea', -- idea | propuesta | aceptada | en_curso | publicada | descartada
  collab_on date,
  contact text,
  link text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mk_sponsors_collabs_date_idx on public.mk_sponsors_collabs (collab_on);
alter table public.mk_sponsors_collabs enable row level security;
