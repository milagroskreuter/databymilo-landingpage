-- Hub de notificaciones del admin + lista "Edición Corpo" (avisos de notas nuevas)

-- 1) Notificaciones del hub de administración (la campanita)
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,                       -- subscribe | unsubscribe | post_notified
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists admin_notifications_created_idx
  on public.admin_notifications (created_at desc);
create index if not exists admin_notifications_unread_idx
  on public.admin_notifications (read, created_at desc);
alter table public.admin_notifications enable row level security;

-- 2) Suscriptoras a Edición Corpo (estado de baja independiente de La carta del domingo)
create table if not exists public.corpo_subscribers (
  email text primary key,
  first_name text,
  subscribed boolean not null default true,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
alter table public.corpo_subscribers enable row level security;

-- 3) Registro de notas ya avisadas (evita avisar dos veces la misma nota)
create table if not exists public.corpo_post_notifications (
  post_slug text primary key,
  sent_at timestamptz not null default now(),
  recipients integer not null default 0
);
alter table public.corpo_post_notifications enable row level security;

-- Las notas que ya están publicadas hoy NO se avisan: se marcan como ya enviadas.
insert into public.corpo_post_notifications (post_slug, recipients)
select slug, 0
from public.blog_posts
where published = true
   or (publish_at is not null and publish_at <= now())
on conflict (post_slug) do nothing;
