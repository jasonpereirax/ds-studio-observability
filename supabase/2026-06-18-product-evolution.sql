-- DS Studio Observability product evolution
-- Run this against an existing MVP database created from the old schema.

create extension if not exists pgcrypto;

create table if not exists public.observability_component_registry (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default 'uncategorized',
  status text default 'active',
  version text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name)
);

alter table public.observability_component_registry
  add column if not exists owner text,
  add column if not exists maturity text default 'stable';

create table if not exists public.observability_component_usage (
  id uuid primary key default gen_random_uuid(),
  system_id text not null references public.observability_systems(id) on delete cascade,
  page_event_id uuid references public.observability_page_events(id) on delete cascade,
  page_path text not null,
  page_url text not null,
  journey text,
  component_name text not null,
  component_version text,
  component_variant text,
  component_token text,
  count integer not null default 1,
  created_at timestamptz not null default now()
);

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

create table if not exists public.observability_design_debt (
  id uuid primary key default gen_random_uuid(),
  system_id text not null references public.observability_systems(id) on delete cascade,
  page_event_id uuid references public.observability_page_events(id) on delete cascade,
  page_path text not null,
  type text not null,
  severity text not null default 'medium',
  title text not null,
  description text,
  value integer default 0,
  created_at timestamptz not null default now()
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

create table if not exists public.observability_journey_rules (
  id uuid primary key default gen_random_uuid(),
  system_id text references public.observability_systems(id) on delete cascade,
  name text not null,
  path_pattern text not null,
  priority integer not null default 10,
  created_at timestamptz not null default now()
);

alter table public.observability_page_events
  add column if not exists hostname text,
  add column if not exists origin text,
  add column if not exists page_title text,
  add column if not exists document_title text,
  add column if not exists meta_title text,
  add column if not exists og_title text,
  add column if not exists twitter_title text,
  add column if not exists h1 text,
  add column if not exists canonical_url text,
  add column if not exists meta_description text,
  add column if not exists og_type text,
  add column if not exists language text,
  add column if not exists script_version text,
  add column if not exists environment text default 'production',
  add column if not exists heading_count integer default 0,
  add column if not exists button_count integer default 0,
  add column if not exists link_count integer default 0,
  add column if not exists form_count integer default 0,
  add column if not exists image_count integer default 0,
  add column if not exists section_count integer default 0,
  add column if not exists input_count integer default 0,
  add column if not exists ds_component_count integer default 0,
  add column if not exists tracked_component_count integer default 0,
  add column if not exists untracked_button_count integer default 0,
  add column if not exists untracked_form_count integer default 0,
  add column if not exists ds_readiness text default 'low',
  add column if not exists viewport_width integer,
  add column if not exists viewport_height integer,
  add column if not exists device_type text,
  add column if not exists load_time_ms integer,
  add column if not exists dom_ready_time_ms integer,
  add column if not exists navigation_type text;

create index if not exists idx_observability_component_usage_system_id
  on public.observability_component_usage(system_id);

create index if not exists idx_observability_component_usage_component_name
  on public.observability_component_usage(component_name);

create index if not exists idx_observability_component_usage_page_path
  on public.observability_component_usage(page_path);

create index if not exists idx_observability_pages_system_id
  on public.observability_pages(system_id);

create index if not exists idx_observability_pages_readiness
  on public.observability_pages(ds_readiness);

create index if not exists idx_observability_component_inventory_system_id
  on public.observability_component_inventory(system_id);

create index if not exists idx_observability_component_inventory_component_name
  on public.observability_component_inventory(component_name);

create index if not exists idx_observability_design_debt_system_id
  on public.observability_design_debt(system_id);

create index if not exists idx_observability_design_debt_type
  on public.observability_design_debt(type);

create index if not exists idx_observability_findings_system_id
  on public.observability_findings(system_id);

create index if not exists idx_observability_findings_active
  on public.observability_findings(active);

create index if not exists idx_observability_findings_type
  on public.observability_findings(type);

create index if not exists idx_observability_page_events_hostname
  on public.observability_page_events(hostname);

create index if not exists idx_observability_page_events_ds_readiness
  on public.observability_page_events(ds_readiness);

insert into public.observability_component_registry (name, category, status, version, description)
values
  ('Button', 'Actions', 'active', '1.0.0', 'Primary user action component'),
  ('Input', 'Forms', 'active', '1.0.0', 'Text input component'),
  ('Select', 'Forms', 'active', '1.0.0', 'Select/dropdown component'),
  ('Card', 'Layout', 'active', '1.0.0', 'Content container component'),
  ('Badge', 'Feedback', 'active', '1.0.0', 'Status and label component'),
  ('Modal', 'Overlay', 'active', '1.0.0', 'Dialog and overlay component'),
  ('Table', 'Data Display', 'active', '1.0.0', 'Structured data display'),
  ('Tabs', 'Navigation', 'active', '1.0.0', 'Content navigation component'),
  ('Header', 'Navigation', 'active', '1.0.0', 'Page or application header'),
  ('ProductCard', 'Commerce', 'active', '1.0.0', 'Commerce product listing component')
on conflict (name) do nothing;

notify pgrst, 'reload schema';
