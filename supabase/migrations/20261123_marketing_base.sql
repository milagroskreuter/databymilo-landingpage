-- Sección Marketing del hub: tablas compartidas por todas las áreas
-- (calendario, chat IA, métricas, marca, lanzamientos, sponsors).
-- Cada área agrega sus propias tablas en su propia migración (mk_<area>_*).
-- Todas con RLS activo y sin políticas: solo se leen/escriben con la service key.

-- Pilares de contenido (educativo, personal, venta, comunidad...).
create table if not exists public.mk_pillars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text not null default '#8b1a4a',
  target_pct int,                      -- % ideal del total de piezas
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.mk_pillars enable row level security;

-- Series o formatos recurrentes ("Dato del lunes").
create table if not exists public.mk_series (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  pillar_id uuid references public.mk_pillars (id) on delete set null,
  network text,                        -- ver lib/marketing/constants.js
  format text,
  cadence jsonb not null default '{}', -- ej. {"freq":"weekly","weekday":1,"time":"10:00"}
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.mk_series enable row level security;

-- Lanzamientos (un ebook nuevo, una campaña). El área de lanzamientos
-- puede sumar columnas en su propia migración.
create table if not exists public.mk_launches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  resource_slug text,                  -- recurso del sitio, si aplica
  status text not null default 'planning', -- planning | active | done | canceled
  starts_on date,
  launch_on date,
  ends_on date,
  checklist jsonb not null default '[]',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mk_launches enable row level security;

-- Cada pieza de contenido: desde la idea hasta publicada.
-- Una idea es una pieza con status 'idea' y sin fecha.
create table if not exists public.mk_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'idea', -- idea | guion | grabado | editado | programado | publicado | descartado
  network text,                        -- instagram | linkedin | threads | youtube | tiktok | newsletter | blog
  format text,                         -- reel | carrusel | post | historia | video | short | articulo | email
  pillar_id uuid references public.mk_pillars (id) on delete set null,
  series_id uuid references public.mk_series (id) on delete set null,
  launch_id uuid references public.mk_launches (id) on delete set null,
  scheduled_at timestamptz,
  published_at timestamptz,
  hook text,
  script text,
  caption text,
  cta text,
  notes text,
  tags text[] not null default '{}',
  source text not null default 'manual', -- manual | chat | repurpose | audiencia | serie
  blog_slug text,                      -- si viene de un post del blog
  permalink text,                      -- link a la publicación real
  external_id text,                    -- id del post en la red (para cruzar métricas)
  score int,                           -- potencial de la idea, 1 a 5
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mk_content_scheduled_idx on public.mk_content (scheduled_at);
create index if not exists mk_content_status_idx on public.mk_content (status);
create index if not exists mk_content_network_external_idx on public.mk_content (network, external_id);
alter table public.mk_content enable row level security;

-- Cuentas de redes conectadas (tokens solo accesibles con la service key).
create table if not exists public.mk_social_accounts (
  network text primary key,
  handle text,
  external_id text,
  access_token text,
  token_expires_at timestamptz,
  meta jsonb not null default '{}',
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.mk_social_accounts enable row level security;

-- Seguidores por red y por día.
create table if not exists public.mk_follower_snapshots (
  network text not null,
  day date not null,
  followers int not null,
  extra jsonb not null default '{}',
  source text not null default 'api',  -- api | import | manual
  created_at timestamptz not null default now(),
  primary key (network, day)
);
alter table public.mk_follower_snapshots enable row level security;

-- Métricas por publicación (última lectura; se actualiza la misma fila).
create table if not exists public.mk_post_metrics (
  id uuid primary key default gen_random_uuid(),
  network text not null,
  external_id text not null,
  content_id uuid references public.mk_content (id) on delete set null,
  permalink text,
  caption text,
  media_type text,
  posted_at timestamptz,
  reach int,
  impressions int,
  views int,
  likes int,
  comments int,
  saves int,
  shares int,
  clicks int,
  extra jsonb not null default '{}',
  source text not null default 'api',  -- api | import | manual
  captured_at timestamptz not null default now(),
  unique (network, external_id)
);
create index if not exists mk_post_metrics_posted_idx on public.mk_post_metrics (posted_at desc);
alter table public.mk_post_metrics enable row level security;

-- Sistema de marca: clave → valor (paleta, tipografías, reglas, voz, bios...).
create table if not exists public.mk_brand (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.mk_brand enable row level security;

-- Pilares iniciales (editables desde el admin).
insert into public.mk_pillars (name, description, color, target_pct, sort_order)
select * from (values
  ('Educativo', 'Enseñar datos, análisis y herramientas.', '#8b1a4a', 50, 1),
  ('Personal', 'Detrás de escena, historia y opiniones.', '#c2577f', 20, 2),
  ('Comunidad', 'Preguntas, respuestas y casos de la audiencia.', '#d99a3e', 15, 3),
  ('Venta', 'Ebooks, recursos y lanzamientos.', '#17663e', 15, 4)
) as v(name, description, color, target_pct, sort_order)
where not exists (select 1 from public.mk_pillars);
