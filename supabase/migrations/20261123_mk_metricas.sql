-- Área "Métricas de redes" de Marketing.
-- Los datos de cada red van en las tablas compartidas (mk_social_accounts,
-- mk_follower_snapshots, mk_post_metrics); acá solo lo propio del área.
-- RLS activo y sin políticas: solo se leen/escriben con la service key.

-- Meta mensual de seguidores por red (editable desde el admin).
create table if not exists public.mk_metrics_goals (
  network text not null,
  month date not null,                 -- primer día del mes
  target_followers int not null,
  updated_at timestamptz not null default now(),
  primary key (network, month)
);
alter table public.mk_metrics_goals enable row level security;

-- Historial de archivos importados (LinkedIn y, si hiciera falta, otras redes).
create table if not exists public.mk_metrics_imports (
  id uuid primary key default gen_random_uuid(),
  network text not null default 'linkedin',
  filename text,
  period_start date,
  period_end date,
  total_followers int,
  follower_days int not null default 0,
  posts int not null default 0,
  summary jsonb not null default '{}',
  imported_at timestamptz not null default now()
);
create index if not exists mk_metrics_imports_network_idx
  on public.mk_metrics_imports (network, imported_at desc);
alter table public.mk_metrics_imports enable row level security;

-- Problemas abiertos (lectura que falla, token por vencer). Sirve para no
-- repetir el aviso todos los días: se avisa al abrirse y, si sigue, cada 7 días.
-- Cuando el problema se resuelve, la fila se borra.
create table if not exists public.mk_metrics_alerts (
  key text primary key,                -- ej. "instagram:sync", "threads:token"
  network text not null,
  kind text not null,                  -- sync | token
  message text,
  first_seen_at timestamptz not null default now(),
  last_notified_at timestamptz
);
alter table public.mk_metrics_alerts enable row level security;

-- Resúmenes semanales enviados (uno por semana: evita mandarlo dos veces).
create table if not exists public.mk_metrics_weekly (
  week_start date primary key,         -- lunes de la semana resumida
  summary jsonb not null default '{}',
  sent_at timestamptz not null default now()
);
alter table public.mk_metrics_weekly enable row level security;
