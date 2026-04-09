'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Leaf, LayoutDashboard, ClipboardList, Calculator, Bell, Settings, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/supabase/types'

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Propriétaire',
  farm_manager: 'Chef de domaine',
  finance: 'Finances',
}

const NAV = [
  { href: '/dashboard',  label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/operations', label: 'Opérations',       icon: ClipboardList },
  { href: '/budget',     label: 'Budget',           icon: Calculator },
  { href: '/alerts',     label: 'Alertes',          icon: Bell },
  { href: '/settings',   label: 'Paramètres',       icon: Settings },
]

interface Props { userName: string; userRole: UserRole; alertCount: number }

export default function Sidebar({ userName, userRole, alertCount }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-green-900 text-white flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-green-800">
        <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">Stalson</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const isAlerts = href === '/alerts'
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-green-700 text-white' : 'text-green-200 hover:bg-green-800 hover:text-white'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isAlerts && alertCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-green-800 space-y-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-green-200" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-green-400">{ROLE_LABELS[userRole]}</p>
          </div>
        </div>
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-green-300 hover:bg-green-800 hover:text-white transition-colors">
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
