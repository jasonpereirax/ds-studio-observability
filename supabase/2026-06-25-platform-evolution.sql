-- DS Studio Observability platform evolution
-- Adds current-state pages, component inventory, normalized findings and registry metadata.

create extension if not exists pgcrypto;

alter table public.observability_component_registry
  add column if not exists owner text,
  add column if not exists maturity text default 'stable';

create table if not exists public.observability_pages (
  id uuid primary key default gen_random_uuid(),
  system_id text not null references public.observability_systems(id) on delete cascade,
  path text not null,
  url text not null,
  title text,
  display_title text,
  journey text,
  hostname text,
  origin text,
  environment text default 'production',
  page_title text,
  document_title text,
  h1 text,
  canonical_url text,
  meta_description text,
  language text,
  script_version text,
  heading_count integer default 0,
  button_count integer default 0,
  link_count integer default 0,
  form_count integer default 0,
  image_count integer default 0,
  section_count integer default 0,
  input_count integer default 0,
  ds_component_count integer default 0,
  tracked_component_count integer default 0,
  untracked_button_count integer default 0,
  untracked_form_count integer default 0,
  ds_readiness text default 'low',
  readiness_score integer default 0,
  confidence_score integer default 0,
  viewport_width integer,
  viewport_height integer,
  device_type text,
  load_time_ms integer,
  dom_ready_time_ms integer,
  navigation_type text,
  last_event_id uuid references public.observability_page_events(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(system_id, path, environment)
);

create table if not exists public.observability_component_inventory (
  id uuid primary key default gen_random_uuid(),
  system_id text not null references public.observability_systems(id) on delete cascade,
  page_path text not null,
  page_url text not null,
  environment text default 'production',
  journey text,
  component_name text not null,
  component_version text,
  component_variant text,
  component_token text,
  count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(system_id, page_path, environment, component_name, component_version, component_variant, component_token)
);

create table if not exists public.observability_findings (
  id uuid primary key default gen_random_uuid(),
  system_id text not null references public.observability_systems(id) on delete cascade,
  page_path text not null,
  environment text default 'production',
  type text not null,
  severity text not null default 'medium',
  title text not null,
  description text,
  value integer default 0,
  active boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_event_id uuid references public.observability_page_events(id) on delete set null,
  unique(system_id, page_path, environment, type)
);

create index if not exists idx_observability_pages_system_id
  on public.observability_pages(system_id);

create index if not exists idx_observability_pages_readiness
  on public.observability_pages(ds_readiness);

create index if not exists idx_observability_component_inventory_system_id
  on public.observability_component_inventory(system_id);

create index if not exists idx_observability_component_inventory_component_name
  on public.observability_component_inventory(component_name);

create index if not exists idx_observability_findings_system_id
  on public.observability_findings(system_id);

create index if not exists idx_observability_findings_active
  on public.observability_findings(active);

create index if not exists idx_observability_findings_type
  on public.observability_findings(type);

notify pgrst, 'reload schema';
