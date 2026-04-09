'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LABELS, MANDATORY_CATEGORIES } from '@/lib/supabase/types'
import type { BudgetCategory } from '@/lib/supabase/types'
import { AlertTriangle, CheckCircle, ChevronRight, ChevronLeft, Loader2, X } from 'lucide-react'

const ALL_CATEGORIES: BudgetCategory[] = [
  'semences','plants','engrais','phytos','insectes','energie',
  'main_oeuvre_directe','main_oeuvre_admin','transport','loyer',
  'entretien','honoraires','ruches','autres_intrants','autres_frais',
]

const MONTHS_FR = ['Juillet','Août','Septembre','Octobre','Novembre','Décembre','Janvier','Février','Mars','Avril','Mai','Juin']

interface AnomalyState { message: string; severity: 'warning' | 'critical' }

interface Props { seasonId: string; surfaceHa: number; onClose: () => void; onSuccess: () => void }

export default function BudgetWizard({ seasonId, surfaceHa, onClose, onSuccess }: Props) {
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [selectedMonth, setSelectedMonth] = useState(1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [amounts, setAmounts] = useState<Record<BudgetCategory, string>>({} as any)
  const [justifications, setJustifications] = useState<Record<BudgetCategory, string>>({} as any)
  const [anomalies, setAnomalies] = useState<Record<BudgetCategory, AnomalyState | null>>({} as any)
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState<BudgetCategory | null>(null)

  async function checkAnomaly(cat: BudgetCategory, value: string) {
    const amount = parseFloat(value) || 0
    setChecking(cat)
    try {
      const res = await fetch('/api/anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, amount_mad: amount, surface_ha: surfaceHa }),
      })
      const result = await res.json()
      setAnomalies(prev => ({ ...prev, [cat]: result.is_anomaly ? { message: result.message_fr, severity: result.severity } : null }))
    } catch {}
    setChecking(null)
  }

  async function handleSubmit() {
    setSubmitting(true)
    const lines = ALL_CATEGORIES.map(cat => ({
      season_id: seasonId,
      category: cat,
      month: selectedMonth,
      year: selectedYear,
      amount_mad: parseFloat(amounts[cat] ?? '0') || 0,
      zero_justification: justifications[cat] ?? null,
    }))

    const { error } = await supabase.from('budget_lines').upsert(lines, { onConflict: 'season_id,category,month,year' })
    setSubmitting(false)
    if (!error) onSuccess()
  }

  const isMandatoryZero = (cat: BudgetCategory) =>
    MANDATORY_CATEGORIES.includes(cat) && (parseFloat(amounts[cat] ?? '0') === 0 || amounts[cat] === '')

  const step2Valid = ALL_CATEGORIES.every(cat => {
    if (!isMandatoryZero(cat)) return true
    return (justifications[cat] ?? '').length >= 50
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {step === 1 ? 'Sélection de la période' : step === 2 ? 'Saisie du budget' : 'Confirmation'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Étape {step} / 3</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-green-600 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Sélectionnez le mois pour lequel vous souhaitez créer ou modifier le budget.</p>
              <div>
                <label className="label">Mois</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)} className="input">
                  {MONTHS_FR.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Année</label>
                <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)} className="input">
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Saisissez les montants pour {MONTHS_FR[selectedMonth - 1]} {selectedYear}.
                Les catégories marquées <span className="text-red-600 font-semibold">*</span> sont obligatoires.
              </p>
              {ALL_CATEGORIES.map(cat => {
                const isMandatory = MANDATORY_CATEGORIES.includes(cat)
                const isZero = isMandatoryZero(cat)
                const anomaly = anomalies[cat]
                return (
                  <div key={cat} className={`rounded-xl border p-4 transition-colors ${
                    isZero ? 'border-red-200 bg-red-50' : anomaly?.severity === 'critical' ? 'border-red-200 bg-red-50' : anomaly ? 'border-amber-200 bg-amber-50' : 'border-gray-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-700">
                          {CATEGORY_LABELS[cat]}
                          {isMandatory && <span className="text-red-500 ml-1">*</span>}
                        </label>
                      </div>
                      <div className="flex items-center gap-2 w-48">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={amounts[cat] ?? ''}
                          onChange={e => setAmounts(prev => ({ ...prev, [cat]: e.target.value }))}
                          onBlur={e => checkAnomaly(cat, e.target.value)}
                          className="input text-right"
                          placeholder="0"
                        />
                        {checking === cat && <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />}
                      </div>
                    </div>

                    {/* Anomaly warning */}
                    {anomaly && (
                      <div className={`mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
                        anomaly.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>{anomaly.message}</span>
                      </div>
                    )}

                    {/* Zero justification for mandatory */}
                    {isZero && (
                      <div className="mt-3">
                        <label className="text-xs text-red-600 font-semibold mb-1 block">
                          Justification requise (min. 50 caractères) pour valider un montant nul :
                        </label>
                        <textarea
                          value={justifications[cat] ?? ''}
                          onChange={e => setJustifications(prev => ({ ...prev, [cat]: e.target.value }))}
                          className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 h-20 resize-none"
                          placeholder="Expliquez pourquoi ce poste est nul pour ce mois..."
                        />
                        <p className={`text-xs mt-0.5 ${(justifications[cat] ?? '').length >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                          {(justifications[cat] ?? '').length} / 50 caractères minimum
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">
                  Budget prêt à être enregistré pour {MONTHS_FR[selectedMonth - 1]} {selectedYear}
                </p>
              </div>
              <div className="card divide-y divide-gray-50">
                {ALL_CATEGORIES.filter(cat => parseFloat(amounts[cat] ?? '0') > 0).map(cat => (
                  <div key={cat} className="flex justify-between items-center px-4 py-2.5 text-sm">
                    <span className="text-gray-700">{CATEGORY_LABELS[cat]}</span>
                    <span className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('fr-MA').format(parseFloat(amounts[cat] ?? '0'))} MAD
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center px-4 py-3 text-sm font-bold bg-gray-50">
                  <span>Total</span>
                  <span className="text-green-700">
                    {new Intl.NumberFormat('fr-MA').format(
                      ALL_CATEGORIES.reduce((s, c) => s + (parseFloat(amounts[c] ?? '0') || 0), 0)
                    )} MAD
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()} className="btn-secondary flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Annuler' : 'Retour'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 2 && !step2Valid}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Enregistrement...' : 'Confirmer le budget'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
