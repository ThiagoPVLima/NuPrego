create table if not exists push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "subscriptions do dono" on push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
