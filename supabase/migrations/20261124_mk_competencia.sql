-- Área "Espía de competencia" de Marketing.
-- Cuentas de referencia (Instagram por Business Discovery; LinkedIn a mano más adelante),
-- la historia de sus seguidores y sus publicaciones con likes y comentarios.
-- RLS activo y sin políticas: solo se leen/escriben con la service key.

create table if not exists public.mk_competitors (
  id uuid primary key default gen_random_uuid(),
  network text not null default 'instagram',  -- instagram | linkedin
  username text not null,                     -- sin @, en minúsculas
  display_name text,
  bio text,
  avatar_url text,
  followers int,
  media_count int,
  notes text,
  active boolean not null default true,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (network, username)
);
alter table public.mk_competitors enable row level security;

create table if not exists public.mk_competitor_snapshots (
  competitor_id uuid not null references public.mk_competitors (id) on delete cascade,
  day date not null,
  followers int,
  media_count int,
  primary key (competitor_id, day)
);
alter table public.mk_competitor_snapshots enable row level security;

create table if not exists public.mk_competitor_posts (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.mk_competitors (id) on delete cascade,
  external_id text not null,                  -- id del post en la red (o el link si se cargó a mano)
  permalink text,
  caption text,
  format text,                                -- reel | carrusel | post | video
  posted_at timestamptz,
  likes int,                                  -- null si la cuenta oculta los likes
  comments int,
  views int,
  extra jsonb not null default '{}',
  starred boolean not null default false,     -- marcado como inspiración
  content_id uuid references public.mk_content (id) on delete set null, -- idea creada a partir de este post
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competitor_id, external_id)
);
create index if not exists mk_competitor_posts_posted_idx on public.mk_competitor_posts (competitor_id, posted_at desc);
alter table public.mk_competitor_posts enable row level security;
