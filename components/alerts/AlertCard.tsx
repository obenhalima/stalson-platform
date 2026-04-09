'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Alert } from '@/lib/supabase/types'
import { CATEGORY_LABELS } from '@/lib/supabase/types'
import { formatDate, formatMAD } from '@/lib/formatters'
import { X, Loader2 } from 'lucide-react'

interface Props { alert: Alert; onDismissed: (id: string) => void }

const SEV = {
  critical: { label: '🔴 Critique',       border: 'border-l-red-500',  bg: 'bg-red-50',    badge: 'badge-critical' },
  warning:  { label: '🟡 Avertissement',  border: 'border-l-amber-400', bg: 'bg-amber-50',  badge: 'badge-warning' },
  info:     { label: '🔵 Information',    border: 'border-l-blue-400',  bg: 'bg-blue-50',   badge: 'badge-info' },
}

export default function AlertCard({ alert, onDismissed }: Props) {
  const [dismissing, setDismissing] = useState(false)
  const s = SEV[alert.severity] ?? SEV.info

  async function dismiss() {
    setDismissing(true)
    await fetch('/api/alerts/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert_id: alert.id }),
    })
    onDismissed(alert.id)
  }

  return (
    <div className={`card border-l-4 ${s.border} ${s.bg} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {/* Severity + Category */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={s.badge}>{s.label}</span>
            {alert.affected_category && (
              <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                {CATEGORY_LABELS[alert.affected_category] ?? alert.affected_category}
              </span>
            )}
          </div>

          {/* Alert type */}
          <p className="text-sm font-semibold text-gray-800">{alert.alert_type}</p>

          {/* AI explanation */}
          {alert.ai_explanation_fr && (
            <p className="text-sm text-gray-600 italic leading-relaxed">{alert.ai_explanation_fr}</p>
          )}

          {/* Expected vs Actual */}
          {(alert.expected_min !== null || alert.actual_value !== null) && (
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 bg-white/70 rounded-lg px-3 py-2">
              {alert.expected_min !== null && alert.expected_max !== null && (
                <span>Attendu : {formatMAD(alert.expected_min, true)} – {formatMAD(alert.expected_max, true)}</span>
              )}
              {alert.actual_value !== null && (
                <span className="font-semibold text-gray-700">Réel : {formatMAD(alert.actual_value, true)}</span>
              )}
              {alert.deviation_pct !== null && (
                <span className={`font-bold ${alert.deviation_pct > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {alert.deviation_pct > 0 ? '+' : ''}{alert.deviation_pct.toFixed(0)}%
                </span>
              )}
            </div>
          )}

          {/* Date */}
          <p className="text-xs text-gray-400">{formatDate(alert.created_at)}</p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={dismiss}
          disabled={dismissing}
          className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-white/80 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          title="Ignorer cette alerte">
          {dismissing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
