'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABELS, MANDATORY_CATEGORIES } from '@/lib/supabase/types'
import type { BudgetCategory } from '@/lib/supabase/types'
import BudgetWizard from '@/components/budget/BudgetWizard'
import { formatMAD, formatPct } from '@/lib/formatters'
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react'

const ALL_CATEGORIES: BudgetCategory[] = [
  'semences','plants','engrais','phytos','insectes','energie',
  'main_oeuvre_directe','main_oeuvre_admin','transport','loyer',
  'entretien','honoraires','ruches','autres_intrants','autres_frais',
]

const REVENUE_CATEGORIES: BudgetCategory[] = []  // revenue is tracked via operation_logs

export default function BudgetPage() {
  const supabase = createClient()
  const [showWizard, setShowWizard] = useState(false)
  const [budgetLines, setBudgetLines] = useState<any[]>([])
  const [actualLines, setActualLines] = useState<any[]>([])
  const [season, setSeason] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: seasons } = await supabase.from('seasons').select('*, farms(surface_productive_ha)').eq('status', 'active').limit(1)
    const activeSeason = seasons?.[0]
    setSeason(activeSeason)
    if (!activeSeason) { setLoading(false); return }

    const [{ data: budget }, { data: actuals }] = await Promise.all([
      supabase.from('budget_lines').select('category, amount_mad').eq('season_id', activeSeason.id),
      supabase.from('operation_logs').select('category, total_mad, log_type').eq('season_id', activeSeason.id),
    ])
    setBudgetLines(budget ?? [])
    setActualLines(actuals ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  // Aggregate
  const getBudget = (cat: BudgetCategory) =>
    budgetLines.filter(l => l.category === cat).reduce((s, l) => s + (l.amount_mad ?? 0), 0)
  const getActual = (cat: BudgetCategory) =>
    actualLines.filter(l => l.category === cat && l.log_type !== 'harvest').reduce((s, l) => s + (l.total_mad ?? 0), 0)

  const totalBudget = ALL_CATEGORIES.reduce((s, c) => s + getBudget(c), 0)
  const totalActual = ALL_CATEGORIES.reduce((s, c) => s + getActual(c), 0)
  const totalVariance = totalActual - totalBudget
  const totalVariancePct = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0

  function varianceClass(variance: number, isCost = true) {
    if (Math.abs(variance) < 100) return 'text-gray-500'
    const bad = isCost ? variance > 0 : variance < 0
    return bad ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
          <p className="text-sm text-gray-500 mt-0.5">Saison {season?.label ?? '—'} — Budget annuel vs Réel YTD</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Créer / Modifier le budget
        </button>
      </div>

      {/* Budget vs Actual table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Catégorie', 'Budget annuel', 'Réel YTD', 'Écart (MAD)', 'Écart (%)'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3 first:pl-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ALL_CATEGORIES.map(cat => {
                const budget  = getBudget(cat)
                const actual  = getActual(cat)
                const variance   = actual - budget
                const variancePct = budget > 0 ? (variance / budget) * 100 : 0
                const isMandatory = MANDATORY_CATEGORIES.includes(cat)
                const missingBudget = budget === 0 && isMandatory
                return (
                  <tr key={cat} className={`hover:bg-gray-50 transition-colors ${missingBudget ? 'bg-red-50' : ''}`}>
                    <td className="px-5 py-3 font-medium text-gray-800 flex items-center gap-2">
                      {missingBudget && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      {CATEGORY_LABELS[cat]}
                      {isMandatory && <span className="text-red-400 text-xs">•</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-700">{budget > 0 ? formatMAD(budget) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3 text-gray-700">{actual > 0 ? formatMAD(actual) : <span className="text-gray-300">—</span>}</td>
                    <td className={`px-5 py-3 ${varianceClass(variance)}`}>
                      {variance !== 0 ? `${variance > 0 ? '+' : ''}${formatMAD(variance)}` : '—'}
                    </td>
                    <td className={`px-5 py-3 ${varianceClass(variancePct)}`}>
                      {variancePct !== 0 ? `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Total row */}
            <tfoot className="bg-gray-900 text-white">
              <tr>
                <td className="px-5 py-3 font-bold">Total</td>
                <td className="px-5 py-3 font-bold">{formatMAD(totalBudget)}</td>
                <td className="px-5 py-3 font-bold">{formatMAD(totalActual)}</td>
                <td className={`px-5 py-3 font-bold ${totalVariance > 0 ? 'text-red-300' : 'text-green-300'}`}>
                  {totalVariance !== 0 ? `${totalVariance > 0 ? '+' : ''}${formatMAD(totalVariance)}` : '—'}
                </td>
                <td className={`px-5 py-3 font-bold ${totalVariancePct > 0 ? 'text-red-300' : 'text-green-300'}`}>
                  {totalVariancePct !== 0 ? `${totalVariancePct > 0 ? '+' : ''}${totalVariancePct.toFixed(1)}%` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">• Catégorie obligatoire — un budget à zéro déclenche une alerte.</p>

      {/* Wizard modal */}
      {showWizard && season && (
        <BudgetWizard
          seasonId={season.id}
          surfaceHa={season.farms?.surface_productive_ha ?? 5.575}
          onClose={() => setShowWizard(false)}
          onSuccess={() => { setShowWizard(false); load() }}
        />
      )}
    </div>
  )
}
