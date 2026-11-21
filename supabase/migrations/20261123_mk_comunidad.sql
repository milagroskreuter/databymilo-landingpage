-- Marketing · Comunidad: testimonios, preguntas de la audiencia y menciones.
-- RLS activo y sin políticas: solo se leen/escriben con la service key.

-- Testimonios. Los manda la gente desde /testimonio (quedan 'pending')
-- o los carga la admin a mano. Solo los 'approved' con permiso se publican.
create table if not exists public.mk_community_testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  relation text,                         -- cómo me conoció / qué compró (lo que escribió la persona)
  text text not null,                    -- texto publicado (editable)
  original_text text not null,           -- lo que escribió la persona, sin tocar
  photo_path text,                       -- archivo en el bucket mk-community
  social_url text,
  consent boolean not null default false,
  consent_at timestamptz,
  products text[] not null default '{}', -- slugs de recursos (tabla resources)
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  featured boolean not null default false,
  source text not null default 'form',   -- form | manual
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mk_community_testimonials_status_idx
  on public.mk_community_testimonials (status, featured desc, created_at desc);
alter table public.mk_community_testimonials enable row level security;

-- Preguntas que llegan por DMs o comentarios.
create table if not exists public.mk_community_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  network text,                          -- ver lib/marketing/constants.js (+ 'email', 'otro')
  asked_on date not null default current_date,
  tags text[] not null default '{}',
  times int not null default 1,          -- cuántas veces se repitió
  notes text,
  used_at timestamptz,                   -- cuando se convirtió en idea
  content_id uuid references public.mk_content (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mk_community_questions_used_idx
  on public.mk_community_questions (used_at, times desc, asked_on desc);
alter table public.mk_community_questions enable row level security;

-- Menciones y contenido de la audiencia, para compartir después.
create table if not exists public.mk_community_mentions (
  id uuid primary key default gen_random_uuid(),
  url text,
  network text,
  author text,
  note text,
  screenshot_path text,                  -- archivo en el bucket mk-community-private
  mentioned_on date not null default current_date,
  shared boolean not null default false,
  shared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mk_community_mentions_shared_idx
  on public.mk_community_mentions (shared, mentioned_on desc);
alter table public.mk_community_mentions enable row level security;

-- Storage: fotos de testimonios (públicas, se muestran en el sitio; nombres al azar)
-- y capturas de menciones (privadas, el admin las ve con links firmados).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('mk-community', 'mk-community', true, 3145728, array['image/jpeg', 'image/png', 'image/webp']),
  ('mk-community-private', 'mk-community-private', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;
