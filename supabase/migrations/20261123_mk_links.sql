-- Marketing · Links y embudo.
-- Links cortos (databymilo.me/go/<slug>), botones de la página de bio (/links),
-- registro de clicks y ajustes de la página de bio.
-- RLS activo y sin políticas: solo se leen/escriben con la service key.

-- Cada link corto. Los botones de /links también son links cortos (in_bio = true),
-- así todos los clicks pasan por el mismo tracking.
create table if not exists public.mk_links_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60),
  title text not null check (length(title) between 1 and 120),
  dest_type text not null default 'url'
    check (dest_type in ('url', 'resource', 'resource_checkout', 'list')),
  url text,                             -- destino si dest_type = 'url'
  resource_slug text,                   -- recurso (resources.slug) si dest_type = 'resource' o 'resource_checkout'
  list_slug text,                       -- lista (mail_lists.slug) si dest_type = 'list'
  campaign text,                        -- utm_campaign
  network text,                         -- red de origen (lib/marketing/constants.js) → utm_source
  keyword text,                         -- palabra del "comentá PALABRA y te mando el link"
  content_id uuid references public.mk_content (id) on delete set null, -- publicación donde se usa
  notes text,
  add_utm boolean not null default true, -- agregar UTM si el destino es el propio sitio
  active boolean not null default true,
  in_bio boolean not null default false, -- aparece como botón en /links
  bio_order int not null default 0,
  icon text,                            -- id de ícono (lib/marketing/links/icons.js)
  featured boolean not null default false, -- botón destacado en /links
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mk_links_links_bio_idx on public.mk_links_links (in_bio, bio_order);
alter table public.mk_links_links enable row level security;

-- Un click por fila. Sin IP: solo un hash diario (ip + navegador + día + sal)
-- para poder contar personas únicas por día.
create table if not exists public.mk_links_clicks (
  id bigint generated always as identity primary key,
  link_id uuid references public.mk_links_links (id) on delete set null,
  slug text not null,
  clicked_at timestamptz not null default now(),
  via text not null default 'direct',   -- direct | bio
  network text,                         -- red atribuida (la del link, o ?from=, o el referer)
  campaign text,
  referer_host text,
  referer_network text,
  country text,                         -- header x-vercel-ip-country
  device text,                          -- mobile | tablet | desktop | bot
  is_bot boolean not null default false,
  visitor_hash text
);
create index if not exists mk_links_clicks_time_idx on public.mk_links_clicks (clicked_at desc);
create index if not exists mk_links_clicks_link_idx on public.mk_links_clicks (link_id, clicked_at desc);
alter table public.mk_links_clicks enable row level security;

-- Ajustes de la página /links (clave → jsonb). Clave 'page': nombre, bio, foto, redes.
create table if not exists public.mk_links_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.mk_links_settings enable row level security;

-- Totales por link (sin bots) para la lista del admin.
create or replace view public.mk_links_click_totals with (security_invoker = on) as
select
  link_id,
  count(*)::int as total,
  (count(*) filter (where clicked_at > now() - interval '30 days'))::int as last_30d,
  max(clicked_at) as last_click
from public.mk_links_clicks
where not is_bot and link_id is not null
group by link_id;
