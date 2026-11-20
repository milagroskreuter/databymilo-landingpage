-- Listas de mail (sistema + personalizadas) y sus suscriptoras.
create table if not exists public.mail_lists (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 40),
  name text not null check (length(name) between 1 and 80),
  description text,
  button_label text,
  kind text not null default 'custom' check (kind in ('system', 'custom')),
  source text not null default 'supabase' check (source in ('supabase', 'resend')),
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
alter table public.mail_lists enable row level security;

create table if not exists public.list_subscribers (
  list_slug text not null references public.mail_lists(slug) on delete cascade on update cascade,
  email text not null,
  first_name text,
  subscribed boolean not null default true,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  primary key (list_slug, email)
);
create index if not exists list_subscribers_email_idx on public.list_subscribers (email);
alter table public.list_subscribers enable row level security;

-- Listas del sistema. La carta del domingo sigue viviendo en Resend (source = resend).
insert into public.mail_lists (slug, name, description, kind, source, sort_order) values
  ('carta', 'La carta del domingo', 'Una carta los domingos a las 9. Corta y útil.', 'system', 'resend', 0),
  ('corpo', 'Edición Corpo', 'Un mail cortito por cada nota nueva del blog, solo cuando publico.', 'system', 'supabase', 1)
on conflict (slug) do nothing;

-- Pasar las suscriptoras actuales de Edición Corpo a la tabla genérica.
insert into public.list_subscribers (list_slug, email, first_name, subscribed, created_at, unsubscribed_at)
select 'corpo', email, first_name, subscribed, created_at, unsubscribed_at
from public.corpo_subscribers
on conflict (list_slug, email) do nothing;
