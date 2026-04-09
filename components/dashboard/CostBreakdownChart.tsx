'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CATEGORY_LABELS } from '@/lib/supabase/types'

const COLORS = ['#166534','#15803d','#16a34a','#4ade80','#86efac','#d97706','#f59e0b','#fbbf24','#6366f1','#a78bfa']

interface DataPoint { category: string; label: string; amount: number }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { label, amount } = payload[0].payload
  const fmt = new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(amount) + ' MAD'
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800">{label}</p>
      <p className="text-gray-600 mt-1">{fmt}</p>
    </div>
  )
}

export default function CostBreakdownChart({ data }: { data: DataPoint[] }) {
  const total = data.reduce((s, d) => s + d.amount, 0)
  const fmt = (v: number) => new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(v) + ' MAD'

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="label" cx="40%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend layout="vertical" align="right" verticalAlign="middle"
          formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
          wrapperStyle={{ fontSize: 11, lineHeight: '1.8' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
