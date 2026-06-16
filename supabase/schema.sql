create table if not exists public.observability_systems (
  id text primary key,
  name text not null,
  public_key text,
  connected boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.observability_page_events (
  id uuid primary key default gen_random_uuid(),
  system_id text not null references public.observability_systems(id) on delete cascade,
  path text not null,
  url text not null,
  title text,
  journey text,
  referrer text,
  session_id text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_observability_page_events_system_id on public.observability_page_events(system_id);
create index if not exists idx_observability_page_events_created_at on public.observability_page_events(created_at desc);
create index if not exists idx_observability_page_events_path on public.observability_page_events(path);
