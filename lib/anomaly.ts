import type { BudgetCategory } from './supabase/types'

// Historical benchmarks per category (MAD/ha) — seeded from FY18/19 actuals
// These will be replaced by real DB data once 2+ seasons exist
const BENCHMARKS: Record<BudgetCategory, { mean: number; std: number; min: number }> = {
  semences:            { mean:  85_966, std:  30_000, min:  10_000 },
  plants:              { mean:  38_738, std:  15_000, min:   5_000 },
  engrais:             { mean: 109_474, std:  40_000, min:  20_000 },
  phytos:              { mean:  73_568, std:  25_000, min:   5_000 },
  insectes:            { mean:  17_790, std:   8_000, min:     500 },
  energie:             { mean:  17_233, std:   6_000, min:   2_000 },
  main_oeuvre_directe: { mean: 229_320, std:  80_000, min:  50_000 },
  main_oeuvre_admin:   { mean:  47_151, std:  15_000, min:  10_000 },
  transport:           { mean:   8_262, std:   3_000, min:     500 },
  loyer:               { mean:  36_127, std:  10_000, min:   5_000 },
  entretien:           { mean:  17_853, std:   6_000, min:   1_000 },
  honoraires:          { mean:  20_000, std:  10_000, min:       0 },
  ruches:              { mean:   5_000, std:   2_000, min:       0 },
  autres_intrants:     { mean:   8_204, std:   4_000, min:       0 },
  autres_frais:        { mean:  11_292, std:   5_000, min:       0 },
}

export interface AnomalyResult {
  is_anomaly: boolean
  severity: 'none' | 'warning' | 'critical'
  z_score: number
  expected_min: number
  expected_max: number
  message_fr: string
}

export function detectAnomaly(
  category: BudgetCategory,
  amount_mad: number,
  surface_ha: number
): AnomalyResult {
  const bench = BENCHMARKS[category]
  if (!bench) return { is_anomaly: false, severity: 'none', z_score: 0, expected_min: 0, expected_max: Infinity, message_fr: '' }

  const per_ha = surface_ha > 0 ? amount_mad / surface_ha : amount_mad
  const z = bench.std > 0 ? (per_ha - bench.mean) / bench.std : 0
  const expected_min = Math.max(0, bench.mean - 2.5 * bench.std) * surface_ha
  const expected_max = (bench.mean + 2.5 * bench.std) * surface_ha

  let severity: AnomalyResult['severity'] = 'none'
  let message_fr = ''

  if (amount_mad === 0 && bench.min > 0) {
    severity = 'critical'
    message_fr = `La catégorie "${category}" ne peut pas être zéro. La valeur minimale historique est ${bench.min.toLocaleString('fr-MA')} MAD/ha.`
  } else if (Math.abs(z) > 4) {
    severity = 'critical'
    message_fr = `Valeur anormalement élevée détectée (z-score: ${z.toFixed(1)}). Valeur saisie : ${per_ha.toFixed(0)} MAD/ha, attendu entre ${(bench.mean - 2.5 * bench.std).toFixed(0)} et ${(bench.mean + 2.5 * bench.std).toFixed(0)} MAD/ha. Vérifiez les unités (g vs kg, MAD vs centimes).`
  } else if (Math.abs(z) > 2.5) {
    severity = 'warning'
    message_fr = `Valeur inhabituelle (z-score: ${z.toFixed(1)}). Cette valeur s'écarte significativement des données historiques. Confirmer si intentionnel.`
  }

  return {
    is_anomaly: severity !== 'none',
    severity,
    z_score: z,
    expected_min,
    expected_max,
    message_fr,
  }
}
