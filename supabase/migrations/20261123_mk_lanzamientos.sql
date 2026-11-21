-- Área Lanzamientos y fechas clave de la sección Marketing.
-- Usa la tabla compartida mk_launches (con dos columnas nuevas, nullable) y suma:
--   mk_launches_templates  plantillas editables de tareas (pre / día / post)
--   mk_launches_tasks      checklist de cada lanzamiento
--   mk_launches_keydates   fechas comerciales y de contenido (AR / LatAm / global)
-- RLS activo sin políticas: solo se leen/escriben con la service key.

-- Columnas nuevas en la tabla compartida (nullable).
alter table public.mk_launches add column if not exists keydate_id uuid;
alter table public.mk_launches add column if not exists goal_sales int;

-- Plantillas de tareas. offset_days es relativo a la fecha de lanzamiento
-- (anchor 'launch') o a la de cierre (anchor 'end'); negativo = antes.
create table if not exists public.mk_launches_templates (
  id uuid primary key default gen_random_uuid(),
  phase text not null,                 -- pre | launch | post
  title text not null,
  description text,
  anchor text not null default 'launch', -- launch | end
  offset_days int not null default 0,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.mk_launches_templates enable row level security;

-- Checklist de cada lanzamiento.
create table if not exists public.mk_launches_tasks (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.mk_launches (id) on delete cascade,
  template_id uuid references public.mk_launches_templates (id) on delete set null,
  phase text not null default 'pre',   -- pre | launch | post
  title text not null,
  description text,
  anchor text,                         -- launch | end (null = fecha fija o sin fecha)
  offset_days int,
  due_on date,
  done boolean not null default false,
  done_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists mk_launches_tasks_launch_idx on public.mk_launches_tasks (launch_id);
alter table public.mk_launches_tasks enable row level security;

-- Fechas clave.
create table if not exists public.mk_launches_keydates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_on date not null,
  ends_on date,                        -- si dura más de un día
  kind text not null default 'comercial', -- comercial | contenido | efemeride | personal
  region text not null default 'AR',   -- AR | LatAm | Global
  approximate boolean not null default false, -- fecha estimada, sin confirmación oficial
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, starts_on)
);
create index if not exists mk_launches_keydates_starts_idx on public.mk_launches_keydates (starts_on);
alter table public.mk_launches_keydates enable row level security;

alter table public.mk_launches
  drop constraint if exists mk_launches_keydate_fk;
alter table public.mk_launches
  add constraint mk_launches_keydate_fk foreign key (keydate_id)
  references public.mk_launches_keydates (id) on delete set null;

-- Plantillas iniciales (pensadas para lanzar un ebook en Hotmart, sin promos ni cupones).
insert into public.mk_launches_templates (phase, title, description, anchor, offset_days, sort_order)
select * from (values
  ('pre', 'Definir fecha de apertura, cierre y objetivo de ventas', null, 'launch', -30, 1),
  ('pre', 'Revisar el ebook final y el producto en Hotmart', 'Archivo final, portada, página de pago y email de entrega.', 'launch', -28, 2),
  ('pre', 'Armar o actualizar la página del recurso en el sitio', 'Descripción, para quién es, qué incluye y link de compra.', 'launch', -25, 3),
  ('pre', 'Abrir la lista de espera', 'Formulario o lista en el hub + link en bio.', 'launch', -21, 4),
  ('pre', 'Preparar mockups e imágenes del ebook en Canva', null, 'launch', -21, 5),
  ('pre', 'Pedir testimonios a lectoras beta', 'Mandar el borrador a 3-5 personas y pedirles una frase.', 'launch', -18, 6),
  ('pre', 'Publicar carruseles de expectativa', 'El problema que resuelve, un error común, detrás de escena.', 'launch', -14, 7),
  ('pre', 'Escribir la secuencia de emails para la carta', 'Anuncio, apertura, preguntas frecuentes, recordatorio y cierre.', 'launch', -10, 8),
  ('pre', 'Anunciar la fecha en redes y en la carta', null, 'launch', -7, 9),
  ('pre', 'Programar las piezas de la semana de lanzamiento', null, 'launch', -5, 10),
  ('pre', 'Hacer una compra de prueba en Hotmart', 'Chequear checkout, email de entrega y que llegue el aviso al hub.', 'launch', -3, 11),
  ('pre', 'Actualizar link en bio y banner de LinkedIn', null, 'launch', -2, 12),
  ('pre', 'Email a la lista de espera: "mañana abre"', null, 'launch', -1, 13),
  ('launch', 'Email a la carta y a la lista de espera: ya está disponible', null, 'launch', 0, 20),
  ('launch', 'Publicar el anuncio en LinkedIn e Instagram', null, 'launch', 0, 21),
  ('launch', 'Historias con link durante el día', null, 'launch', 0, 22),
  ('launch', 'Fijar la publicación del lanzamiento en los perfiles', null, 'launch', 0, 23),
  ('launch', 'Responder comentarios y mensajes', null, 'launch', 0, 24),
  ('launch', 'Compartir las primeras reacciones y testimonios', null, 'launch', 2, 25),
  ('launch', 'Responder preguntas frecuentes (post + historias)', null, 'launch', 3, 26),
  ('launch', 'Recordatorio de cierre (email + historias)', null, 'end', -1, 27),
  ('launch', 'Último aviso: cierra hoy', null, 'end', 0, 28),
  ('post', 'Email de agradecimiento a las compradoras', null, 'end', 2, 30),
  ('post', 'Pedir reseñas y testimonios a las compradoras', null, 'end', 5, 31),
  ('post', 'Volver el link en bio y el banner a lo habitual', null, 'end', 1, 32),
  ('post', 'Revisar resultados y anotar aprendizajes', 'Ventas vs. período anterior, piezas que mejor funcionaron.', 'end', 7, 33),
  ('post', 'Reutilizar el mejor contenido del lanzamiento', 'Convertir las piezas que mejor anduvieron en contenido evergreen.', 'end', 14, 34)
) as v(phase, title, description, anchor, offset_days, sort_order)
where not exists (select 1 from public.mk_launches_templates);

-- Fechas clave 2026-2027. approximate = todavía sin fecha oficial confirmada.
insert into public.mk_launches_keydates (name, starts_on, ends_on, kind, region, approximate, notes) values
  ('CyberMonday Argentina 2026', '2026-11-02', '2026-11-04', 'comercial', 'AR', true, 'Evento de la CACE; confirmar la fecha oficial.'),
  ('Black Friday', '2026-11-27', null, 'comercial', 'Global', false, null),
  ('Cyber Monday', '2026-11-30', null, 'comercial', 'Global', false, null),
  ('Giving Tuesday', '2026-12-01', null, 'contenido', 'Global', false, 'Buen día para contenido de comunidad o algo gratis.'),
  ('Resumen del año en redes', '2026-12-14', null, 'contenido', 'Global', false, 'Época de "wrapped" y balances: contenido de datos del año.'),
  ('Aguinaldo (fecha límite de pago)', '2026-12-18', null, 'comercial', 'AR', false, 'Segunda cuota del SAC: más poder de compra.'),
  ('Nochebuena', '2026-12-24', null, 'efemeride', 'Global', false, null),
  ('Navidad', '2026-12-25', null, 'comercial', 'Global', false, null),
  ('Fin de año', '2026-12-31', null, 'efemeride', 'Global', false, null),
  ('Año Nuevo', '2027-01-01', null, 'efemeride', 'Global', false, null),
  ('Propósitos de año nuevo / vuelta a la rutina', '2027-01-04', null, 'contenido', 'Global', false, 'Primer lunes hábil: aprender algo nuevo, organizarse.'),
  ('Día de Reyes', '2027-01-06', null, 'efemeride', 'LatAm', false, null),
  ('Día Internacional de la Educación', '2027-01-24', null, 'contenido', 'Global', false, null),
  ('Día de la Protección de Datos', '2027-01-28', null, 'contenido', 'Global', false, 'Data Privacy Day.'),
  ('Carnaval (fin de semana largo)', '2027-02-08', '2027-02-09', 'efemeride', 'AR', false, 'Feriado: suele bajar el alcance.'),
  ('Día de la Mujer y la Niña en la Ciencia', '2027-02-11', null, 'contenido', 'Global', false, null),
  ('San Valentín', '2027-02-14', null, 'comercial', 'Global', false, null),
  ('Vuelta a clases', '2027-03-01', null, 'comercial', 'AR', true, 'El inicio varía por provincia; confirmar calendario escolar.'),
  ('Día Internacional de la Mujer', '2027-03-08', null, 'contenido', 'Global', false, null),
  ('Día de Pi', '2027-03-14', null, 'contenido', 'Global', false, 'Excusa perfecta para contenido de números y datos.'),
  ('Semana Santa (fin de semana largo)', '2027-03-25', '2027-03-28', 'efemeride', 'AR', false, 'Pascua el 28/3.'),
  ('Día del Libro', '2027-04-23', null, 'comercial', 'Global', false, 'Ideal para ebooks.'),
  ('Feria del Libro de Buenos Aires', '2027-04-22', '2027-05-10', 'contenido', 'AR', true, 'Confirmar fechas oficiales.'),
  ('Día del Trabajador', '2027-05-01', null, 'efemeride', 'Global', false, null),
  ('Hot Sale Argentina', '2027-05-10', '2027-05-12', 'comercial', 'AR', true, 'Evento de la CACE; suele ser a mediados de mayo.'),
  ('Día de Internet', '2027-05-17', null, 'contenido', 'Global', false, null),
  ('Hot Sale México', '2027-05-31', '2027-06-08', 'comercial', 'LatAm', true, 'Confirmar fechas de la AMVO.'),
  ('CyberDay Chile', '2027-06-07', '2027-06-09', 'comercial', 'LatAm', true, 'Confirmar fechas de la CCS.'),
  ('Día del Padre', '2027-06-20', null, 'comercial', 'AR', false, 'Tercer domingo de junio.'),
  ('Día Internacional de la Mujer en la Ingeniería', '2027-06-23', null, 'contenido', 'Global', false, null),
  ('Aguinaldo (fecha límite de pago)', '2027-06-30', null, 'comercial', 'AR', false, 'Primera cuota del SAC.'),
  ('Vacaciones de invierno', '2027-07-12', '2027-07-30', 'contenido', 'AR', true, 'Varía por provincia: buen momento para cursos y aprender.'),
  ('Día del Amigo', '2027-07-20', null, 'comercial', 'AR', false, null),
  ('Día de las Infancias', '2027-08-15', null, 'comercial', 'AR', false, 'Tercer domingo de agosto.'),
  ('Día del Programador', '2027-09-13', null, 'contenido', 'Global', false, 'Día 256 del año.'),
  ('Día de Ada Lovelace', '2027-10-12', null, 'contenido', 'Global', false, 'Segundo martes de octubre: mujeres en tecnología.'),
  ('Día de la Madre', '2027-10-17', null, 'comercial', 'AR', false, 'Tercer domingo de octubre.'),
  ('CyberMonday Argentina 2027', '2027-11-01', '2027-11-03', 'comercial', 'AR', true, 'Evento de la CACE; confirmar la fecha oficial.'),
  ('El Buen Fin', '2027-11-12', '2027-11-15', 'comercial', 'LatAm', true, 'México; confirmar fechas.'),
  ('Black Friday', '2027-11-26', null, 'comercial', 'Global', false, null),
  ('Cyber Monday', '2027-11-29', null, 'comercial', 'Global', false, null),
  ('Resumen del año en redes', '2027-12-13', null, 'contenido', 'Global', false, null),
  ('Aguinaldo (fecha límite de pago)', '2027-12-18', null, 'comercial', 'AR', false, null),
  ('Navidad', '2027-12-25', null, 'comercial', 'Global', false, null),
  ('Fin de año', '2027-12-31', null, 'efemeride', 'Global', false, null)
on conflict (name, starts_on) do nothing;
