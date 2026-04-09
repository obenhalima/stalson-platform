import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import type { UserRole } from '@/lib/supabase/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { count: alertCount } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', profile.org_id)
    .eq('is_dismissed', false)

  const navProps = {
    userName: profile.full_name,
    userRole: profile.role as UserRole,
    alertCount: alertCount ?? 0,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar {...navProps} />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav {...navProps} />
    </div>
  )
}
