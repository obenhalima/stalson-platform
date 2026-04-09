import { createClient } from '@/lib/supabase/server'
import { User, Building2, Shield } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/supabase/types'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*, organizations(name)').eq('id', user?.id ?? '').single()

  const ROLE_LABELS: Record<string, string> = { owner: 'Propriétaire', farm_manager: 'Chef de domaine', finance: 'Finances' }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><User className="w-5 h-5 text-green-700" /></div>
          <h2 className="text-base font-semibold text-gray-800">Mon profil</h2>
        </div>
        {[
          ['Nom complet', profile?.full_name ?? '—'],
          ['Email', user?.email ?? '—'],
          ['Rôle', ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-800">{value}</span>
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-700" /></div>
          <h2 className="text-base font-semibold text-gray-800">Organisation</h2>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Nom</span>
          <span className="text-sm font-medium text-gray-800">{(profile as any)?.organizations?.name ?? 'Stalson Agri'}</span>
        </div>
      </div>
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Shield className="w-5 h-5 text-amber-700" /></div>
          <h2 className="text-base font-semibold text-gray-800">Sécurité</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">La gestion des mots de passe et l'authentification à deux facteurs sont gérées via Supabase Auth.</p>
      </div>
    </div>
  )
}
