'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, WifiOff, Loader2 } from 'lucide-react'
import type { BudgetCategory, LogType, UnitType, MarketType } from '@/lib/supabase/types'
import { CATEGORY_LABELS } from '@/lib/supabase/types'

const CATEGORIES_BY_TYPE: Record<string, BudgetCategory[]> = {
  harvest:    [],
  input_use:  ['semences','plants','engrais','phytos','insectes','ruches','autres_intrants'],
  labor:      ['main_oeuvre_directe','main_oeuvre_admin'],
  energy_reading: ['energie'],
}

const schema = z.object({
  logged_date:   z.string().min(1, 'Date requise'),
  log_type:      z.enum(['harvest','input_use','labor','energy_reading']),
  category:      z.string().optional(),
  quantity:      z.coerce.number().positive('Quantité requise'),
  unit:          z.enum(['kg','g','litre','heure','kwh','unite']),
  unit_price_mad:z.coerce.number().optional(),
  market:        z.enum(['export','local']).optional(),
  notes:         z.string().optional(),
})
type FormData = z.infer<typeof schema>

const LOG_TYPE_LABELS: Record<string, string> = {
  harvest:        'Récolte',
  input_use:      'Consommation intrant',
  labor:          "Main d'œuvre",
  energy_reading: 'Relevé énergie',
}

export default function OperationForm({ seasonId, farmId }: { seasonId: string; farmId: string }) {
  const supabase = createClient()
  const [isOnline, setIsOnline] = useState(true)
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { logged_date: new Date().toISOString().split('T')[0], log_type: 'harvest', unit: 'kg' },
  })

  const logType = watch('log_type')
  const categories = CATEGORIES_BY_TYPE[logType] ?? []

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on  = () => { setIsOnline(true);  syncOffline() }
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    // Count pending offline entries
    const q = JSON.parse(localStorage.getItem('stalson_offline') ?? '[]')
    setPending(q.length)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  async function syncOffline() {
    const queue: FormData[] = JSON.parse(localStorage.getItem('stalson_offline') ?? '[]')
    if (!queue.length) return
    for (const entry of queue) {
      await supabase.from('operation_logs').insert({ ...entry, season_id: seasonId, farm_id: farmId })
    }
    localStorage.setItem('stalson_offline', '[]')
    setPending(0)
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    const payload = { ...data, season_id: seasonId, farm_id: farmId }

    if (!isOnline) {
      const queue = JSON.parse(localStorage.getItem('stalson_offline') ?? '[]')
      queue.push(payload)
      localStorage.setItem('stalson_offline', JSON.stringify(queue))
      setPending(queue.length)
      setSuccess(true)
      setTimeout(() => { setSuccess(false); reset() }, 2500)
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from('operation_logs').insert(payload)
    setSubmitting(false)
    if (!error) {
      setSuccess(true)
      setTimeout(() => { setSuccess(false); reset() }, 2500)
    }
  }

  if (success) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <CheckCircle className="w-14 h-14 text-green-500" />
      <p className="text-lg font-semibold text-gray-800">Opération enregistrée !</p>
      {!isOnline && <p className="text-sm text-amber-600">Synchronisation en attente ({pending})</p>}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          Hors ligne — les données seront synchronisées à la reconnexion
          {pending > 0 && <span className="ml-auto font-semibold">{pending} en attente</span>}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Date */}
        <div>
          <label className="label">Date</label>
          <input type="date" {...register('logged_date')} className="input" />
          {errors.logged_date && <p className="text-red-500 text-xs mt-1">{errors.logged_date.message}</p>}
        </div>

        {/* Type */}
        <div>
          <label className="label">Type d'opération</label>
          <select {...register('log_type')} className="input">
            {Object.entries(LOG_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {/* Category (conditional) */}
        {categories.length > 0 && (
          <div>
            <label className="label">Catégorie</label>
            <select {...register('category')} className="input">
              <option value="">— Sélectionner —</option>
              {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
        )}

        {/* Market (for harvest) */}
        {logType === 'harvest' && (
          <div>
            <label className="label">Marché</label>
            <div className="flex gap-3">
              {[['export','Export'],['local','Marché local']].map(([v,l]) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" {...register('market')} value={v} className="accent-green-700" />
                  <span className="text-sm text-gray-700">{l}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Quantity + Unit */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">Quantité</label>
            <input type="number" step="any" {...register('quantity')} className="input" placeholder="0" />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
          </div>
          <div className="w-28">
            <label className="label">Unité</label>
            <select {...register('unit')} className="input">
              {[['kg','kg'],['g','g'],['litre','L'],['heure','h'],['kwh','kWh'],['unite','unité']].map(([v,l]) =>
                <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Unit price */}
        <div>
          <label className="label">Prix unitaire (MAD) — optionnel</label>
          <input type="number" step="any" {...register('unit_price_mad')} className="input" placeholder="0.00" />
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea {...register('notes')} className="input h-20 resize-none" placeholder="Observations, remarques..." />
        </div>

        <button type="submit" disabled={submitting} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Enregistrement...' : 'Enregistrer l\'opération'}
        </button>
      </form>
    </div>
  )
}
