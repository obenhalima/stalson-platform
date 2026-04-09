-- ============================================================
-- SEED DATA — Stalson (run AFTER creating the first user)
-- Replaces the 5 Domaines from the Excel file
-- ============================================================

-- 1. Organization
insert into organizations (id, name, country, currency)
values ('11111111-1111-1111-1111-111111111111', 'Stalson Agri', 'MA', 'MAD');

-- 2. Farms (5 domaines from the Excel)
insert into farms (org_id, code, name, surface_total_ha, surface_productive_ha) values
  ('11111111-1111-1111-1111-111111111111', 'D104', 'Domaine 104', 0, 0),
  ('11111111-1111-1111-1111-111111111111', 'D105', 'Domaine 105', 0, 0),
  ('11111111-1111-1111-1111-111111111111', 'D106', 'Domaine 106', 5.575, 26.14),
  ('11111111-1111-1111-1111-111111111111', 'D107', 'Domaine 107', 0, 0),
  ('11111111-1111-1111-1111-111111111111', 'D114', 'Domaine 114', 0, 0);

-- 3. Current season (FY25/26)
insert into seasons (farm_id, label, crop_variety, start_date, end_date, status)
select id, '25/26', 'Tomate Cerise', '2025-07-01', '2026-06-30', 'active'
from farms
where code = 'D106';

-- 4. Historical exchange rate (approximate)
insert into exchange_rates (date, eur_mad_rate, usd_mad_rate)
values (current_date, 10.85, 9.92);
