-- ============================================================
-- STALSON PLATFORM — Initial Schema
-- Supabase / PostgreSQL
-- Run in Supabase SQL Editor > New Query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('owner', 'farm_manager', 'finance');
create type season_status as enum ('draft', 'active', 'closed');
create type log_type as enum ('harvest', 'input_use', 'labor', 'energy_reading');
create type unit_type as enum ('kg', 'g', 'litre', 'heure', 'kwh', 'unite');
create type budget_category as enum (
  'semences', 'plants', 'engrais', 'phytos', 'insectes',
  'energie', 'main_oeuvre_directe', 'main_oeuvre_admin',
  'transport', 'loyer', 'entretien', 'honoraires',
  'ruches', 'autres_intrants', 'autres_frais'
);
create type alert_severity as enum ('info', 'warning', 'critical');
create type market_type as enum ('export', 'local');

-- ============================================================
-- ORGANIZATIONS (multi-tenant ready)
-- ============================================================

create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  country     text not null default 'MA',
  currency    text not null default 'MAD',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references organizations(id),
  full_name   text not null,
  role        user_role not null default 'farm_manager',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- FARMS (Domaines)
-- ============================================================

create table farms (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references organizations(id),
  code                  text not null,                   -- e.g. "D104", "D105"
  name                  text not null,
  surface_total_ha      numeric(8,3) not null,
  surface_productive_ha numeric(8,3) not null,
  location_lat          numeric(10,7),
  location_lng          numeric(10,7),
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  unique(org_id, code)
);

-- ============================================================
-- SEASONS
-- ============================================================

create table seasons (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references farms(id),
  label         text not null,                          -- e.g. "25/26"
  crop_variety  text not null,                          -- e.g. "Tomate Cerise"
  start_date    date not null,
  end_date      date not null,
  status        season_status not null default 'draft',
  created_at    timestamptz not null default now()
);

-- ============================================================
-- BUDGET LINES
-- Each line = one category × one month
-- ============================================================

create table budget_lines (
  id            uuid primary key default gen_random_uuid(),
  season_id     uuid not null references seasons(id) on delete cascade,
  category      budget_category not null,
  month         smallint not null check (month between 1 and 12),
  year          smallint not null,
  amount_mad    numeric(14,2) not null default 0,
  unit_volume   numeric(14,3),
  unit_type     unit_type,
  unit_price_mad numeric(12,4),
  market        market_type,
  notes         text,
  validated     boolean not null default false,
  zero_justification text,                              -- required if amount=0 for mandatory categories
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(season_id, category, month, year)
);

-- ============================================================
-- OPERATION LOGS (daily farm entries)
-- ============================================================

create table operation_logs (
  id              uuid primary key default gen_random_uuid(),
  season_id       uuid not null references seasons(id),
  farm_id         uuid not null references farms(id),
  logged_date     date not null,
  log_type        log_type not null,
  category        budget_category,
  quantity        numeric(14,3) not null,
  unit            unit_type not null,
  unit_price_mad  numeric(12,4),
  total_mad       numeric(14,2) generated always as (quantity * coalesce(unit_price_mad, 0)) stored,
  market          market_type,                         -- for harvest: export or local
  notes           text,
  logged_by       uuid references profiles(id),
  gps_lat         numeric(10,7),
  gps_lng         numeric(10,7),
  synced_at       timestamptz,                         -- null = pending offline sync
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ACTUALS VIEW (aggregated from operation_logs)
-- ============================================================

create view actuals_by_month as
  select
    o.season_id,
    o.farm_id,
    o.category,
    o.market,
    extract(month from o.logged_date)::smallint as month,
    extract(year  from o.logged_date)::smallint as year,
    sum(o.quantity)   as total_quantity,
    sum(o.total_mad)  as total_mad,
    o.unit
  from operation_logs o
  group by o.season_id, o.farm_id, o.category, o.market,
           extract(month from o.logged_date), extract(year from o.logged_date), o.unit;

-- ============================================================
-- ALERTS
-- ============================================================

create table alerts (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references organizations(id),
  season_id             uuid references seasons(id),
  farm_id               uuid references farms(id),
  severity              alert_severity not null default 'info',
  alert_type            text not null,
  affected_category     budget_category,
  expected_min          numeric(14,2),
  expected_max          numeric(14,2),
  actual_value          numeric(14,2),
  deviation_pct         numeric(8,2),
  ai_explanation_fr     text,
  is_dismissed          boolean not null default false,
  dismissed_by          uuid references profiles(id),
  dismissed_at          timestamptz,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- EXCHANGE RATES (auto-fetched daily)
-- ============================================================

create table exchange_rates (
  date          date primary key,
  eur_mad_rate  numeric(10,4) not null,
  usd_mad_rate  numeric(10,4),
  source        text default 'api.exchangerate-api.com'
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_operation_logs_season   on operation_logs(season_id, logged_date);
create index idx_operation_logs_farm     on operation_logs(farm_id, logged_date);
create index idx_budget_lines_season     on budget_lines(season_id, category, month);
create index idx_alerts_org              on alerts(org_id, is_dismissed, created_at desc);
create index idx_profiles_org            on profiles(org_id);
create index idx_farms_org               on farms(org_id);
create index idx_seasons_farm            on seasons(farm_id, status);
