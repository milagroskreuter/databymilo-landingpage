-- Área Chat IA de Marketing: conversaciones con Claude y su historial.
-- RLS activo y sin políticas: solo se leen/escriben con la service key.

-- Una conversación.
create table if not exists public.mk_chat_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Nueva conversación',
  -- Herramientas que esperan confirmación de la usuaria antes de ejecutarse
  -- (borrar o cambiar muchas piezas, guardar borradores). null si no hay nada pendiente.
  -- Forma: {"calls":[{"id","name","input","summary"}], "results":[tool_result ya resuelto]}
  pending jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mk_chat_threads_updated_idx on public.mk_chat_threads (updated_at desc);
alter table public.mk_chat_threads enable row level security;

-- Cada mensaje tal como se manda a la API de Claude (role + content en formato API).
-- Los mensajes del asistente se guardan completos (bloques de thinking y tool_use incluidos)
-- porque el historial se reenvía sin modificar en cada turno.
create table if not exists public.mk_chat_messages (
  id bigint generated always as identity primary key,
  thread_id uuid not null references public.mk_chat_threads (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content jsonb not null,
  usage jsonb,                         -- tokens del turno (solo asistente)
  created_at timestamptz not null default now()
);
create index if not exists mk_chat_messages_thread_idx on public.mk_chat_messages (thread_id, id);
alter table public.mk_chat_messages enable row level security;
