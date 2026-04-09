'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DataPoint { month: string; budget: number; actual: number }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const budget = payload.find((p: any) => p.dataKey === 'budget')?.value ?? 0
  const actual = payload.find((p: any) => p.dataKey === 'actual')?.value ?? 0
  const variance = budget > 0 ? ((actual - budget) / budget) * 100 : 0
  const fmt = (v: number) => new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(v) + ' MAD'
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      <p className="text-green-300">Budget : {fmt(budget)}</p>
      <p className="text-green-700">Réel : {fmt(actual)}</p>
      <p className={`font-semibold mt-1 ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        Écart : {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
      </p>
    </div>
  )
}

export default function RevenueChart({ data }: { data: DataPoint[] }) {
  const fmt = (v: number) => {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
    if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'k'
    return String(v)
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
        <Legend formatter={(v) => v === 'budget' ? 'Budget' : 'Réel'} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="budget" fill="#bbf7d0" radius={[4, 4, 0, 0]} name="budget" />
        <Bar dataKey="actual" fill="#166534" radius={[4, 4, 0, 0]} name="actual" />
      </BarChart>
    </ResponsiveContainer>
  )
}
