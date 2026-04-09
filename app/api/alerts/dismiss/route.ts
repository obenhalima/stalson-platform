import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { alert_id } = await req.json()
  if (!alert_id) return NextResponse.json({ error: 'alert_id requis' }, { status: 400 })

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'finance'].includes(profile.role)) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { error } = await supabase
    .from('alerts')
    .update({ is_dismissed: true, dismissed_at: new Date().toISOString(), dismissed_by: user.id })
    .eq('id', alert_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
