import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import StatoBadge from '../components/ui/StatoBadge'
import Spinner from '../components/ui/Spinner'
import { Plus, Home, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const FILTRI = ['Tutte', 'attiva', 'chiusa', 'proposta', 'confermata']

const GRADIENT_BY_STATO = {
  attiva: 'linear-gradient(135deg, #10b981, #059669)',
  chiusa: 'linear-gradient(135deg, #6b7280, #4b5563)',
  proposta: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  confermata: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
}

export default function TenanciePage() {
  const { user } = useAuth()
  const [tenancies, setTenancies] = useState([])
  const [filtro, setFiltro] = useState('Tutte')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('tenancies')
        .select(`*, properties(indirizzo, citta, cap, provincia)`)
        .or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      console.log('USER ID:', user?.id)
      console.log('TENANCIES DATA:', data)
      console.log('TENANCIES ERROR:', error)
      if (error) console.error('TENANCIES ERROR:', error)
      setTenancies(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const filtered = filtro === 'Tutte' ? tenancies : tenancies.filter(t => t.stato === filtro)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-[680px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-[#1a3a5c] tracking-tight">Locazioni</h1>
        <Link to="/locazioni/nuova" className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Nuova
        </Link>
      </div>

      {/* Pill filtri */}
      {tenancies.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {FILTRI.map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={filtro === f ? 'pill-filter-active' : 'pill-filter-inactive'}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'Tutte' && (
                <span className="ml-1 opacity-60">({tenancies.filter(t => t.stato === f).length})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card text-center py-12 space-y-3">
          <svg width="56" height="56" viewBox="0 0 72 72" fill="none" className="mx-auto opacity-25">
            <rect x="10" y="32" width="52" height="32" rx="4" stroke="#1a3a5c" strokeWidth="2.5" fill="none"/>
            <path d="M6 34L36 10L66 34" stroke="#1a3a5c" strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="28" y="44" width="16" height="20" rx="2" stroke="#1a3a5c" strokeWidth="2" fill="none"/>
          </svg>
          <p className="text-gray-500 text-sm">
            {filtro === 'Tutte' ? 'Nessuna locazione registrata.' : `Nessuna locazione "${filtro}".`}
          </p>
          {filtro === 'Tutte' && (
            <Link to="/locazioni/nuova" className="btn-primary inline-flex items-center gap-2">
              <Plus size={14} /> Crea la prima
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const isLandlord = t.landlord_id === user.id
            return (
              <Link key={t.id} to={`/locazioni/${t.id}`}
                className="card-hover flex gap-4 items-start">
                {/* Placeholder immobile colorato */}
                <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm"
                  style={{ background: GRADIENT_BY_STATO[t.stato] || GRADIENT_BY_STATO.proposta }}>
                  <Home size={22} className="text-white" />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-800 text-sm leading-tight">{t.properties?.indirizzo}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <MapPin size={10} /> {t.properties?.citta} ({t.properties?.provincia})
                      </p>
                    </div>
                    <StatoBadge stato={t.stato} />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">
                      {format(new Date(t.data_inizio), 'd MMM yyyy', { locale: it })}
                      {t.data_fine && ` → ${format(new Date(t.data_fine), 'd MMM yyyy', { locale: it })}`}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isLandlord ? 'bg-[#1a3a5c]/10 text-[#1a3a5c]' : 'bg-[#10b981]/10 text-[#10b981]'}`}>
                      {isLandlord ? 'Proprietario' : 'Inquilino'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
