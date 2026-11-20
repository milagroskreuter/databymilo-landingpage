-- Tablas del sitio que estaban abiertas a cualquiera con la clave pública (anon).
-- El sitio las usa solo desde el servidor con la service key, que ignora RLS.
alter table public.contact_tags enable row level security;
alter table public.activity_log enable row level security;
alter table public.post_versions enable row level security;
alter table public.resources enable row level security;

-- resources es el catálogo público de recursos: se deja solo lectura para anon
-- (igual que blog_posts con public_read). Escribir sigue siendo solo del servidor.
drop policy if exists public_read on public.resources;
create policy public_read on public.resources for select to anon, authenticated using (true);
