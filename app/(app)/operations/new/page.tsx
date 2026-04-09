import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OperationForm from '@/components/operations/OperationForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewOperationPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get the first active season and farm
  const { data: season } = await supabase
    .from('seasons')
    .select('id, farm_id, label, farms(name)')
    .eq('status', 'active')
    .single()

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/operations" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nouvelle opération</h1>
          {season && <p className="text-xs text-gray-500">Saison {season.label}</p>}
        </div>
      </div>

      <div className="card p-5">
        {season
          ? <OperationForm seasonId={season.id} farmId={season.farm_id} />
          : <p className="text-sm text-red-600 text-center py-8">Aucune saison active trouvée. Veuillez créer une saison d'abord.</p>
        }
      </div>
    </div>
  )
}
