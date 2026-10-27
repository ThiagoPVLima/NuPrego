create table if not exists tarefas (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) > 0),
  estado text not null default 'inbox'
    check (estado in ('inbox', 'agora', 'em_breve', 'algum_dia', 'feito')),
  contexto text,
  data_limite date,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  concluido_em timestamptz
);

create index if not exists tarefas_user_estado_idx on tarefas (user_id, estado, ordem);

alter table tarefas enable row level security;

create policy "tarefas do dono" on tarefas
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
