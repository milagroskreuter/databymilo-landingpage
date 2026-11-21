-- Área Marca y diseño de la sección Marketing.
-- Tablas propias (mk_brand_*), bucket privado de archivos y valores iniciales
-- del sistema de marca en la tabla compartida mk_brand (sacados del sitio real:
-- app/globals.css, lib/og y los mails de lib/notify.js). Ver lib/marketing/brand/defaults.js.
-- RLS activo y sin políticas: solo se usa con la service key.

-- Biblioteca: cada archivo del bucket marketing-assets.
create table if not exists public.mk_brand_assets (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,           -- ruta dentro del bucket
  name text not null,
  mime text,
  size_bytes bigint,
  width int,
  height int,
  tags text[] not null default '{}',
  source text not null default 'upload', -- upload | template | unsplash | canva
  meta jsonb not null default '{}',    -- atribución de Unsplash, id de Canva, datos de la plantilla...
  created_at timestamptz not null default now()
);
create index if not exists mk_brand_assets_created_idx on public.mk_brand_assets (created_at desc);
create index if not exists mk_brand_assets_tags_idx on public.mk_brand_assets using gin (tags);
alter table public.mk_brand_assets enable row level security;

-- Frases guardadas: CTAs, bios, respuestas a DMs, "comentá X y te lo mando".
create table if not exists public.mk_brand_snippets (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'cta',    -- cta | bio | dm | comentario | hashtags | otro
  title text not null,
  body text not null,
  network text,                        -- opcional, ver lib/marketing/constants.js
  tags text[] not null default '{}',
  uses int not null default 0,         -- veces copiada
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mk_brand_snippets enable row level security;

-- Chequeos de coherencia hechos con Claude.
create table if not exists public.mk_brand_checks (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.mk_brand_assets (id) on delete set null,
  image_name text,
  notes text,
  score int,                           -- 0 a 100
  result jsonb not null default '{}',  -- { summary, score, items: [{ area, ok, detail, fix }] }
  model text,
  created_at timestamptz not null default now()
);
create index if not exists mk_brand_checks_created_idx on public.mk_brand_checks (created_at desc);
alter table public.mk_brand_checks enable row level security;

-- Integraciones con OAuth (Canva). Tokens solo accesibles con la service key.
create table if not exists public.mk_brand_integrations (
  provider text primary key,           -- canva
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  meta jsonb not null default '{}',    -- estado del OAuth pendiente (state, code_verifier), usuario
  updated_at timestamptz not null default now()
);
alter table public.mk_brand_integrations enable row level security;

-- Bucket privado (se lee con URLs firmadas). Hasta 50 MB por archivo.
insert into storage.buckets (id, name, public, file_size_limit)
values ('marketing-assets', 'marketing-assets', false, 52428800)
on conflict (id) do nothing;

-- Valores iniciales del sistema de marca (no pisa lo que ya esté guardado).
insert into public.mk_brand (key, value) values
  ('palette', $json${"colors":[{"name":"Vino","hex":"#8b1a4a","role":"principal","use":"Fondo de portadas y placas, botones, títulos sobre crema."},{"name":"Rosa","hex":"#d4447a","role":"acento","use":"Acentos, palabras destacadas, links. Nunca como fondo de texto largo."},{"name":"Crema","hex":"#fdf5ec","role":"fondo","use":"Fondo general y texto sobre vino."},{"name":"Tinta","hex":"#1a1a1a","role":"texto","use":"Texto de cuerpo sobre crema o blanco."},{"name":"Rosa suave","hex":"#f2b7d1","role":"suave","use":"Eyebrows y detalles sobre vino; fondos de tarjetas."},{"name":"Manteca","hex":"#fbe7a8","role":"destacado","use":"Resaltar un dato o una palabra. Poca superficie."},{"name":"Lavanda","hex":"#e8d9f0","role":"neutro","use":"Fondos alternativos suaves (degradés con rosa)."}],"notes":"Base cálida: crema + vino. El rosa y la manteca son acentos, no fondos."}$json$::jsonb),
  ('typography', $json${"fonts":[{"role":"titulos","family":"Playfair Display","weight":"700","style":"italic","use":"Títulos y frases grandes. Itálica bold, interlineado apretado (1.08)."},{"role":"cuerpo","family":"Montserrat","weight":"500–600","style":"normal","use":"Texto de cuerpo, datos, botones. Eyebrows en mayúsculas con espaciado 0.18–0.22em."},{"role":"acento","family":"Caveat","weight":"600","style":"normal","use":"Notas al margen escritas a mano. Una por pieza como mucho."}],"scale":"Título 64–96 px en placas 1080; cuerpo 30–40 px; eyebrow 22–26 px.","notes":"En mails se usa Georgia itálica para títulos y Arial para el cuerpo (no cargan fuentes web)."}$json$::jsonb),
  ('voice', $json${"tone":"Cercana, honesta y con humor. Como una amiga que trabaja en tech y te cuenta lo que nadie te dice: data, pero cute.","traits":["español rioplatense con vos","frases cortas","desde adentro (experiencia propia)","útil antes que viral"],"words_yes":["contado desde adentro","te dejo","guardalo","data","corpo","cuaderno","probá","spoiler"],"words_no":["tú / usted","sinergia","disruptivo","gurú","hackeá tu carrera","100% garantizado","¡Hola a todos!"],"examples_good":["la corpo no te lo cuenta, pero yo sí.","Una carta los domingos. Corta y útil.","Sin spam · cancelá cuando quieras","Ups, algo se enredó. Probá de nuevo."],"examples_bad":["¡¡Descubre los 10 secretos que los expertos no quieren que sepas!!","Estimado usuario, le informamos que…"],"notes":"Emojis con moderación (✦ ✧ ♥ en vez de caritas). Nada de mayúsculas sostenidas para gritar."}$json$::jsonb),
  ('rules', $json${"max_colors_per_piece":2,"max_words_per_slide":20,"max_fonts_per_piece":2,"items":["Máximo 2 colores protagonistas por pieza (más crema o tinta como base).","Texto máximo 20 palabras por placa o slide.","Títulos en Playfair itálica; cuerpo en Montserrat. No mezclar otras fuentes.","Siempre la firma data · by milo o @databymilo en la última slide.","Una sola idea por slide; el dato grande, la explicación chica.","Márgenes generosos: al menos 80 px en placas de 1080.","Fotos cálidas y con luz natural; nada de bancos de imágenes corporativos fríos."]}$json$::jsonb),
  ('bios', $json${"instagram":"Tech, data e IA contado desde adentro ✦\nla corpo no te lo cuenta, pero yo sí.\n↓ guías y carta de los domingos","linkedin":"Tech, data e IA contado desde adentro: lo que la corpo no te cuenta y nadie te explica en los cursos. Escribo una carta los domingos en databymilo.me","threads":"data, pero cute ✦ tech e IA contado desde adentro","youtube":"Tech, data e IA contado desde adentro. Tutoriales, carrera y lo que la corpo no te cuenta.","tiktok":"","newsletter":"Una carta los domingos. Corta y útil."}$json$::jsonb),
  ('moodboard', $json${"pinterest_url":"","notes":"Cálido, editorial y un poco coqueto: papel crema, cuaderno, washi tape, rosa y vino.","asset_ids":[]}$json$::jsonb),
  ('logo', $json${"wordmark":"data · by milo","description":"Wordmark en Playfair Display itálica bold; el punto del medio va en manteca (#fbe7a8) sobre vino o en rosa sobre crema.","handle":"@databymilo","site":"databymilo.me","asset_id":null,"usage":["Sobre vino: texto crema y punto manteca.","Sobre crema: texto vino y punto rosa.","No deformar, no sombras, no contornos."]}$json$::jsonb),
  ('references', $json${"design_system_url":"","notes":"Sistema de diseño en Claude Design armado desde el sitio real."}$json$::jsonb)
on conflict (key) do nothing;
