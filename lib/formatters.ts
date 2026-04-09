// French number & currency formatting for MAD

export function formatMAD(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat('fr-MA', {
      maximumFractionDigits: 1,
    }).format(value / 1_000_000) + ' M MAD'
  }
  if (compact && Math.abs(value) >= 1_000) {
    return new Intl.NumberFormat('fr-MA', {
      maximumFractionDigits: 1,
    }).format(value / 1_000) + ' k MAD'
  }
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' MAD'
}

export function formatEUR(value: number, rate = 10.85): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value / rate)
}

export function formatPct(value: number, decimals = 1): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

export function formatQty(value: number, unit: string): string {
  return new Intl.NumberFormat('fr-MA', {
    maximumFractionDigits: 2,
  }).format(value) + ' ' + unit
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(date))
}

export function formatMonthYear(month: number, year: number): string {
  return new Intl.DateTimeFormat('fr-MA', {
    month: 'short', year: '2-digit',
  }).format(new Date(year, month - 1, 1))
}

export function varianceColor(actual: number, budget: number, inverted = false): string {
  if (budget === 0) return 'text-gray-400'
  const ratio = (actual - budget) / Math.abs(budget)
  const good = inverted ? ratio < 0 : ratio >= 0
  if (Math.abs(ratio) < 0.05) return 'text-gray-600'
  return good ? 'text-green-600' : 'text-red-600'
}

export function variancePct(actual: number, budget: number): number {
  if (budget === 0) return 0
  return ((actual - budget) / Math.abs(budget)) * 100
}
