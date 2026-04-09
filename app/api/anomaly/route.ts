import { NextRequest, NextResponse } from 'next/server'
import { detectAnomaly } from '@/lib/anomaly'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { BudgetCategory } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  const { category, amount_mad, surface_ha } = await req.json()
  const result = detectAnomaly(category as BudgetCategory, amount_mad, surface_ha)

  // If critical, persist an alert to Supabase
  if (result.severity === 'critical') {
    try {
      const cookieStore = cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
        if (profile) {
          await supabase.from('alerts').insert({
            org_id: profile.org_id,
            severity: 'critical',
            alert_type: `Valeur anormale détectée — ${category}`,
            affected_category: category,
            expected_min: result.expected_min,
            expected_max: result.expected_max,
            actual_value: amount_mad,
            deviation_pct: result.z_score * 10,
            ai_explanation_fr: result.message_fr,
          })
        }
      }
    } catch {}
  }

  return NextResponse.json(result)
}
