'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Alert } from '@/lib/supabase/types'
import AlertCard from '@/components/alerts/AlertCard'
import { CheckCircle, Loader2, BellOff } from 'lucide-react'

export default function AlertsPage() {
  const supabase = createClient()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissingAll, setDismissingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('is_dismissed', false)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false })
    setAlerts((data ?? []) as Alert[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  function onDismissed(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  async function dismissAll() {
    setDismissingAll(true)
    await Promise.all(
      alerts.map(a => fetch('/api/alerts/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: a.id }),
      }))
    )
    setAlerts([])
    setDismissingAll(false)
  }

  const critiques   = alerts.filter(a => a.severity === 'critical')
  const warnings    = alerts.filter(a => a.severity === 'warning')
  const infos       = alerts.filter(a => a.severity === 'info')

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? '…' : alerts.length === 0 ? 'Aucune anomalie active' : `${alerts.length} alerte${alerts.length > 1 ? 's' : ''} active${alerts.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {alerts.length > 0 && (
          <button onClick={dismissAll} disabled={dismissingAll} className="btn-secondary flex items-center gap-2 text-xs">
            {dismissingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
            Tout ignorer
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : alerts.length === 0 ? (
        /* Empty state */
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-gray-800">Aucune anomalie détectée</p>
          <p className="text-sm text-gray-500 mt-1">Toutes les données semblent cohérentes avec les données historiques.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {critiques.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-3">
                🔴 Critiques ({critiques.length})
              </h2>
              <div className="space-y-3">
                {critiques.map(a => <AlertCard key={a.id} alert={a} onDismissed={onDismissed} />)}
              </div>
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-amber-600 uppercase tracking-wide mb-3">
                🟡 Avertissements ({warnings.length})
              </h2>
              <div className="space-y-3">
                {warnings.map(a => <AlertCard key={a.id} alert={a} onDismissed={onDismissed} />)}
              </div>
            </div>
          )}
          {infos.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3">
                🔵 Informations ({infos.length})
              </h2>
              <div className="space-y-3">
                {infos.map(a => <AlertCard key={a.id} alert={a} onDismissed={onDismissed} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
