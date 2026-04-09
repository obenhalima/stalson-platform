import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const COLOR_MAP = {
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-700', text: 'text-green-700' },
  blue:  { bg: 'bg-blue-50',  icon: 'bg-blue-100 text-blue-700',   text: 'text-blue-700' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-700', text: 'text-amber-700' },
  red:   { bg: 'bg-red-50',   icon: 'bg-red-100 text-red-700',     text: 'text-red-700' },
}

interface Props {
  title: string
  value: string
  subtitle?: string
  trend?: number        // % vs budget, positive = above budget
  icon: React.ReactNode
  color: 'green' | 'blue' | 'amber' | 'red'
  invertTrend?: boolean // for costs: positive trend is bad
}

export default function KPICard({ title, value, subtitle, trend, icon, color, invertTrend }: Props) {
  const c = COLOR_MAP[color]
  const trendGood = trend !== undefined ? (invertTrend ? trend < 0 : trend > 0) : null

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trendGood ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {Math.abs(trend) < 0.5
              ? <Minus className="w-3 h-3" />
              : trendGood
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
