import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import StatoBadge from '../components/ui/StatoBadge'
import Spinner from '../components/ui/Spinner'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function TenanciePage() {
  const { user } = useAuth()
  const [tenancies, setTenancies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tenancies')
      .select('*, properties(indirizzo, citta, provincia)')
      .or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id},created_by.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setTenancies(data || []); setLoading(false) })
  }, [user.id])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1a3a5c]">Locazioni</h1>
        <Link to="/locazioni/nuova" className="btn-primary flex items-center gap-1 text-sm">
          <Plus size={16} /> Nuova
        </Link>
      </div>

      {tenancies.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>Nessuna locazione registrata.</p>
          <Link to="/locazioni/nuova" className="btn-primary mt-4 inline-block">Crea la prima</Link>
        </div>
      ) : (
        tenancies.map(t => (
          <Link key={t.id} to={`/locazioni/${t.id}`} className="card flex items-center justify-between hover:shadow-md transition-shadow block">
            <div>
              <p className="font-medium text-gray-800">{t.properties?.indirizzo}</p>
              <p className="text-sm text-gray-500">{t.properties?.citta} ({t.properties?.provincia})</p>
              <p className="text-xs text-gray-400 mt-1">
                Dal {format(new Date(t.data_inizio), 'd MMM yyyy', { locale: it })}
                {t.data_fine && ` al ${format(new Date(t.data_fine), 'd MMM yyyy', { locale: it })}`}
              </p>
            </div>
            <StatoBadge stato={t.stato} />
          </Link>
        ))
      )}
    </div>
  )
}
