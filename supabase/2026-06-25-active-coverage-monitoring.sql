-- DS Studio Observability active coverage monitoring
-- Adds monitored URLs, coverage checks and coverage status fields.

create extension if not exists pgcrypto;

alter table public.observability_pages
  add column if not exists last_signal_source text default 'runtime',
  add column if not exists coverage_status text default 'unknown',
  add column if not exists coverage_checked_at timestamptz,
  add column if not exists snippet_detected boolean,
  add column if not exists monitored_url_id uuid;

create table if not exists public.observability_monitored_urls (
  id uuid primary key default gen_random_uuid(),
  system_id text not null references public.observability_systems(id) on delete cascade,
  url text not null,
  environment text default 'production',
  active boolean not null default true,
  frequency_minutes integer not null default 1440,
  first_seen_at timestamptz not null default now(),
  last_checked_at timestamptz,
  last_status text default 'pending',
  last_error text,
  unique(system_id, url, environment)
);

create table if not exists public.observability_coverage_checks (
  id uuid primary key default gen_random_uuid(),
  monitored_url_id uuid references public.observability_monitored_urls(id) on delete set null,
  system_id text not null references public.observability_systems(id) on delete cascade,
  url text not null,
  path text not null,
  environment text default 'production',
  status text not null,
  http_status integer,
  snippet_detected boolean not null default false,
  tracker_detected boolean not null default false,
  snippet_version text,
  component_count integer not null default 0,
  readiness_score integer default 0,
  confidence_score integer default 0,
  error text,
  checked_at timestamptz not null default now()
);

alter table public.observability_component_inventory
  add column if not exists last_signal_source text default 'runtime';

create index if not exists idx_observability_pages_coverage_status
  on public.observability_pages(coverage_status);

create index if not exists idx_observability_monitored_urls_system_id
  on public.observability_monitored_urls(system_id);

create index if not exists idx_observability_monitored_urls_active
  on public.observability_monitored_urls(active);

create index if not exists idx_observability_coverage_checks_system_id
  on public.observability_coverage_checks(system_id);

create index if not exists idx_observability_coverage_checks_checked_at
  on public.observability_coverage_checks(checked_at desc);

notify pgrst, 'reload schema';
