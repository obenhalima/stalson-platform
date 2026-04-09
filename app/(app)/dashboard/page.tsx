import { createClient } from '@/lib/supabase/server'
import KPICard from '@/components/dashboard/KPICard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import CostBreakdownChart from '@/components/dashboard/CostBreakdownChart'
import { formatMAD, formatQty, formatPct, formatDate } from '@/lib/formatters'
import { CATEGORY_LABELS } from '@/lib/supabase/types'
import { TrendingUp, Package, Leaf, AlertTriangle, Calendar } from 'lucide-react'

// Mock data used when DB has no data yet
const MOCK_REVENUE = [
  { month: 'Juil', budget: 0, actual: 0 },
  { month: 'Aoû', budget: 0, actual: 0 },
  { month: 'Sep', budget: 0, actual: 0 },
  { month: 'Oct', budget: 3_070_000, actual: 2_800_000 },
  { month: 'Nov', budget: 3_070_000, actual: 3_200_000 },
  { month: 'Déc', budget: 2_302_500, actual: 2_100_000 },
  { month: 'Jan', budget: 2_302_500, actual: 0 },
  { month: 'Fév', budget: 3_070_000, actual: 0 },
  { month: 'Mar', budget: 2_302_500, actual: 0 },
  { month: 'Avr', budget: 2_302_500, actual: 0 },
  { month: 'Mai', budget: 1_535_000, actual: 0 },
  { month: 'Juin', budget: 767_500, actual: 0 },
]

const MOCK_COSTS = [
  { category: 'semences',            label: 'Semences',           amount: 1_494_638 },
  { category: 'plants',              label: 'Plants',             amount: 1_113_000 },
  { category: 'main_oeuvre_directe', label: "Main d'œuvre",       amount: 2_548_739 },
  { category: 'loyer',               label: 'Loyers',             amount: 451_471 },
  { category: 'entretien',           label: 'Entretien',          amount: 148_925 },
  { category: 'main_oeuvre_admin',   label: 'Admin',              amount: 928_080 },
  { category: 'honoraires',          label: 'Honoraires',         amount: 246_000 },
  { category: 'autres_frais',        label: 'Autres frais',       amount: 375_800 },
]

export default async function DashboardPage() {
  const supabase = createClient()
  const today = new Date()

  // Fetch active season
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*, farms(code, name, surface_total_ha, surface_productive_ha)')
    .eq('status', 'active')
    .limit(5)

  const activeSeason = seasons?.[0]

  // Fetch budget lines for the active season
  const { data: budgetLines } = activeSeason
    ? await supabase.from('budget_lines').select('*').eq('season_id', activeSeason.id)
    : { data: [] }

  // Fetch recent operation logs (harvest = revenue)
  const { data: opLogs } = activeSeason
    ? await supabase.from('operation_logs').select('*').eq('season_id', activeSeason.id)
    : { data: [] }

  // Fetch recent alerts
  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(3)

  // ── Compute KPIs ─────────────────────────────────────────────────────────────
  const revenueBudget = (budgetLines ?? [])
    .filter(l => l.category === 'semences' || l.category === 'plants') // placeholder — real: sum CA lines
    .reduce((s, l) => s + l.amount_mad, 0) || 17_652_500

  const harvestLogs  = (opLogs ?? []).filter(l => l.log_type === 'harvest')
  const revenueActual = harvestLogs.reduce((s, l) => s + (l.total_mad ?? 0), 0) || 8_100_000

  const costLogs  = (opLogs ?? []).filter(l => l.log_type !== 'harvest')
  const costsActual = costLogs.reduce((s, l) => s + (l.total_mad ?? 0), 0) || 3_800_000

  const ebitdaBudget = revenueBudget - (budgetLines ?? []).reduce((s, l) => s + l.amount_mad, 0)
  const ebitdaActual = revenueActual - costsActual

  const volumeKg = harvestLogs.reduce((s, l) => {
    if (l.unit === 'kg') return s + l.quantity
    if (l.unit === 'g')  return s + l.quantity / 1000
    return s
  }, 0) || 149_500

  const budgetConsumed = revenueBudget > 0 ? (costsActual / revenueBudget) * 100 : 0
  const revenueTrend   = revenueBudget > 0 ? ((revenueActual - revenueBudget) / revenueBudget) * 100 : 0

  // Chart data
  const revenueChartData = MOCK_REVENUE  // replace with real aggregation once data exists
  const costChartData    = MOCK_COSTS

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(today)} — Saison {activeSeason?.label ?? '25/26'}
          </p>
        </div>
        {seasons && seasons.length > 1 && (
          <select className="input max-w-[180px] text-sm" defaultValue={activeSeason?.id}>
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.farms?.code} — {s.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Chiffre d'affaires"
          value={formatMAD(revenueActual, true)}
          subtitle={`Budget : ${formatMAD(revenueBudget, true)}`}
          trend={revenueTrend}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <KPICard
          title="EBITDA réel"
          value={formatMAD(ebitdaActual, true)}
          subtitle={formatPct((ebitdaActual / revenueActual) * 100) + ' du CA'}
          icon={<Leaf className="w-5 h-5" />}
          color={ebitdaActual >= 0 ? 'green' : 'red'}
        />
        <KPICard
          title="Volume récolté"
          value={formatQty(volumeKg, 'kg')}
          subtitle="Tomate cerise export"
          icon={<Package className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          title="Budget consommé"
          value={formatPct(budgetConsumed)}
          subtitle={`${formatMAD(costsActual, true)} / ${formatMAD(revenueBudget, true)}`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={budgetConsumed > 90 ? 'red' : budgetConsumed > 70 ? 'amber' : 'green'}
          invertTrend
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">CA mensuel — Budget vs Réel (MAD)</h2>
          <RevenueChart data={revenueChartData} />
        </div>

        {/* Cost breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Répartition des coûts</h2>
          <CostBreakdownChart data={costChartData} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Domain comparison table */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Comparaison par domaine</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Domaine','Surface (ha)','CA (MAD)','Coût/ha','EBITDA %'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { code: 'D104', surface: 0,     ca: 0,          cost_ha: 0,        ebitda: 0 },
                  { code: 'D105', surface: 0,     ca: 0,          cost_ha: 0,        ebitda: 0 },
                  { code: 'D106', surface: 5.575, ca: 17_652_500, cost_ha: 727_304,  ebitda: 1.7 },
                  { code: 'D107', surface: 0,     ca: 0,          cost_ha: 0,        ebitda: 0 },
                  { code: 'D114', surface: 0,     ca: 0,          cost_ha: 0,        ebitda: 0 },
                ].map(row => (
                  <tr key={row.code}>
                    <td className="py-2 pr-4 font-semibold text-green-700">{row.code}</td>
                    <td className="py-2 pr-4 text-gray-600">{row.surface.toFixed(3)}</td>
                    <td className="py-2 pr-4">{row.ca > 0 ? formatMAD(row.ca, true) : '—'}</td>
                    <td className="py-2 pr-4">{row.cost_ha > 0 ? formatMAD(row.cost_ha, true) : '—'}</td>
                    <td className={`py-2 pr-4 font-semibold ${row.ebitda > 0 ? 'text-green-600' : row.ebitda < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {row.ebitda !== 0 ? `${row.ebitda > 0 ? '+' : ''}${row.ebitda.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Alertes récentes</h2>
            <a href="/alerts" className="text-xs text-green-700 hover:underline">Voir tout →</a>
          </div>
          {(!alerts || alerts.length === 0) ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">Aucune anomalie détectée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className={`rounded-lg p-3 border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.severity === 'warning'  ? 'border-amber-400 bg-amber-50' :
                  'border-blue-400 bg-blue-50'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${
                      alert.severity === 'critical' ? 'text-red-700' :
                      alert.severity === 'warning'  ? 'text-amber-700' : 'text-blue-700'
                    }`}>
                      {alert.severity === 'critical' ? '🔴 Critique' : alert.severity === 'warning' ? '🟡 Avertissement' : '🔵 Info'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2">{alert.ai_explanation_fr ?? alert.alert_type}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
