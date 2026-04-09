'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, Calculator, Bell, Settings } from 'lucide-react'
import type { UserRole } from '@/lib/supabase/types'

const NAV = [
  { href: '/dashboard',  label: 'Accueil',     icon: LayoutDashboard },
  { href: '/operations', label: 'Opérations',  icon: ClipboardList },
  { href: '/budget',     label: 'Budget',      icon: Calculator },
  { href: '/alerts',     label: 'Alertes',     icon: Bell },
  { href: '/settings',   label: 'Paramètres',  icon: Settings },
]

interface Props { userName: string; userRole: UserRole; alertCount: number }

export default function MobileNav({ alertCount }: Props) {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex pb-safe z-50">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        const isAlerts = href === '/alerts'
        return (
          <Link key={href} href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative text-xs transition-colors ${
              active ? 'text-green-700' : 'text-gray-500'
            }`}>
            <div className="relative">
              <Icon className="w-5 h-5" />
              {isAlerts && alertCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </div>
            <span className={`${active ? 'font-semibold' : 'font-normal'}`}>{label}</span>
            {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-green-700 rounded-t-full" />}
          </Link>
        )
      })}
    </nav>
  )
}
