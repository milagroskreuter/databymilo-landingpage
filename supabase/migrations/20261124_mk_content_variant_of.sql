-- Versiones de una misma idea para distintas redes (ej. el reel de Instagram y su
-- versión para LinkedIn). Cada versión es su propia pieza (con su texto, fecha y
-- métricas) y apunta a la pieza original con variant_of.
alter table public.mk_content add column if not exists variant_of uuid references public.mk_content (id) on delete set null;
create index if not exists mk_content_variant_of_idx on public.mk_content (variant_of);
