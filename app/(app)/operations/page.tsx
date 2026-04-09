import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Package, DollarSign, FileText } from 'lucide-react'
import { formatMAD, formatDate, formatQty } from '@/lib/formatters'
import { CATEGORY_LABELS } from '@/lib/supabase/types'

const LOG_TYPE_LABELS: Record<string, string> = {
  harvest: 'Récolte', input_use: 'Intrant', labor: "Main d'œuvre", energy_reading: 'Énergie',
}
const LOG_TYPE_COLORS: Record<string, string> = {
  harvest: 'bg-green-100 text-green-700', input_use: 'bg-blue-100 text-blue-700',
  labor: 'bg-purple-100 text-purple-700', energy_reading: 'bg-amber-100 text-amber-700',
}

export default async function OperationsPage() {
  const supabase = createClient()
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString().split('T')[0]

  const { data: logs } = await supabase
    .from('operation_logs')
    .select('*')
    .gte('logged_date', since)
    .order('logged_date', { ascending: false })
    .limit(200)

  const entries = logs ?? []
  const totalRecolte = entries.filter(l => l.log_type === 'harvest')
    .reduce((s, l) => s + (l.unit === 'kg' ? l.quantity : l.unit === 'g' ? l.quantity / 1000 : 0), 0)
  const totalCosts = entries.filter(l => l.log_type !== 'harvest')
    .reduce((s, l) => s + (l.total_mad ?? 0), 0)

  // Group by date
  const grouped: Record<string, typeof entries> = {}
  entries.forEach(l => {
    grouped[l.logged_date] = grouped[l.logged_date] ?? []
    grouped[l.logged_date].push(l)
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal des opérations</h1>
          <p className="text-sm text-gray-500 mt-0.5">30 derniers jours</p>
        </div>
        <Link href="/operations/new" className="btn-primary hidden md:flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle entrée
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Récolte totale', value: formatQty(totalRecolte, 'kg'), icon: <Package className="w-4 h-4" />, color: 'text-green-700 bg-green-50' },
          { label: 'Coûts enregistrés', value: formatMAD(totalCosts, true), icon: <DollarSign className="w-4 h-4" />, color: 'text-blue-700 bg-blue-50' },
          { label: 'Nb entrées', value: String(entries.length), icon: <FileText className="w-4 h-4" />, color: 'text-purple-700 bg-purple-50' },
        ].map(c => (
          <div key={c.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.color}`}>{c.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-base font-bold text-gray-800">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grouped log list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune opération enregistrée ces 30 derniers jours.</p>
          <Link href="/operations/new" className="btn-primary inline-flex items-center gap-2 mt-4">
            <Plus className="w-4 h-4" /> Enregistrer une opération
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{formatDate(date)}</p>
              <div className="card divide-y divide-gray-50">
                {dayLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-4 px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${LOG_TYPE_COLORS[log.log_type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {LOG_TYPE_LABELS[log.log_type] ?? log.log_type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {log.category ? CATEGORY_LABELS[log.category as keyof typeof CATEGORY_LABELS] ?? log.category : '—'}
                      </p>
                      {log.notes && <p className="text-xs text-gray-400 truncate">{log.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-800">{formatQty(log.quantity, log.unit)}</p>
                      {log.total_mad > 0 && <p className="text-xs text-gray-500">{formatMAD(log.total_mad)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <Link href="/operations/new"
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-800 transition-colors z-40">
        <Plus className="w-7 h-7" />
      </Link>
    </div>
  )
}
