export type UserRole = 'owner' | 'farm_manager' | 'finance'
export type SeasonStatus = 'draft' | 'active' | 'closed'
export type LogType = 'harvest' | 'input_use' | 'labor' | 'energy_reading'
export type UnitType = 'kg' | 'g' | 'litre' | 'heure' | 'kwh' | 'unite'
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type MarketType = 'export' | 'local'
export type BudgetCategory =
  | 'semences' | 'plants' | 'engrais' | 'phytos' | 'insectes'
  | 'energie' | 'main_oeuvre_directe' | 'main_oeuvre_admin'
  | 'transport' | 'loyer' | 'entretien' | 'honoraires'
  | 'ruches' | 'autres_intrants' | 'autres_frais'

// Mandatory categories that CANNOT be zero without justification
export const MANDATORY_CATEGORIES: BudgetCategory[] = [
  'engrais', 'phytos', 'energie', 'main_oeuvre_directe', 'transport'
]

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  semences:            'Semences',
  plants:              'Plants',
  engrais:             'Engrais',
  phytos:              'Phytosanitaires',
  insectes:            'Insectes auxiliaires',
  energie:             'Énergie',
  main_oeuvre_directe: "Main d'œuvre directe",
  main_oeuvre_admin:   "Main d'œuvre adm. & tech.",
  transport:           'Transport sur ventes',
  loyer:               'Loyers fermes',
  entretien:           'Entretien & maintenance',
  honoraires:          'Honoraires',
  ruches:              'Ruches',
  autres_intrants:     'Autres intrants',
  autres_frais:        'Autres frais généraux',
}

export const UNIT_LABELS: Record<UnitType, string> = {
  kg:    'kg',
  g:     'g',
  litre: 'L',
  heure: 'h',
  kwh:   'kWh',
  unite: 'unité',
}

export interface Organization {
  id: string
  name: string
  country: string
  currency: string
  created_at: string
}

export interface Profile {
  id: string
  org_id: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Farm {
  id: string
  org_id: string
  code: string
  name: string
  surface_total_ha: number
  surface_productive_ha: number
  is_active: boolean
}

export interface Season {
  id: string
  farm_id: string
  label: string
  crop_variety: string
  start_date: string
  end_date: string
  status: SeasonStatus
}

export interface BudgetLine {
  id: string
  season_id: string
  category: BudgetCategory
  month: number
  year: number
  amount_mad: number
  unit_volume: number | null
  unit_type: UnitType | null
  unit_price_mad: number | null
  market: MarketType | null
  notes: string | null
  validated: boolean
  zero_justification: string | null
}

export interface OperationLog {
  id: string
  season_id: string
  farm_id: string
  logged_date: string
  log_type: LogType
  category: BudgetCategory | null
  quantity: number
  unit: UnitType
  unit_price_mad: number | null
  total_mad: number
  market: MarketType | null
  notes: string | null
  logged_by: string | null
  synced_at: string | null
  created_at: string
}

export interface Alert {
  id: string
  org_id: string
  season_id: string | null
  farm_id: string | null
  severity: AlertSeverity
  alert_type: string
  affected_category: BudgetCategory | null
  expected_min: number | null
  expected_max: number | null
  actual_value: number | null
  deviation_pct: number | null
  ai_explanation_fr: string | null
  is_dismissed: boolean
  created_at: string
}

export interface KPIData {
  revenue_budget: number
  revenue_actual: number
  ebitda_budget: number
  ebitda_actual: number
  cost_per_kg: number
  yield_per_ha: number
  budget_consumed_pct: number
  total_volume_kg: number
}
