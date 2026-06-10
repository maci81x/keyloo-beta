import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import BadgeVerifica from '../components/ui/BadgeVerifica'
import StatoBadge from '../components/ui/StatoBadge'
import Spinner from '../components/ui/Spinner'
import StarRating from '../components/ui/StarRating'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [reviews, setReviews] = useState([])
  const [tenancies, setTenancies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [revRes, tenRes] = await Promise.all([
        supabase.from('reviews').select('*').eq('recipient_id', user.id).eq('stato', 'pubblicata').order('published_at', { ascending: false }).limit(5),
        supabase.from('tenancies').select('*, properties(indirizzo, citta)').or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(5),
      ])
      setReviews(revRes.data || [])
      setTenancies(tenRes.data || [])
      setLoading(false)
    }
    load()
  }, [user.id])

  const avgScore = reviews.length
    ? (reviews.reduce((sum, r) => {
        const vals = Object.values(r.ratings || {})
        return sum + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0)
      }, 0) / reviews.length).toFixed(1)
    : null

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      {/* Passaporto reputazionale */}
      <div className="card bg-[#1a3a5c] text-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Il tuo passaporto</h2>
          <BadgeVerifica level={profile?.verification_level || 0} />
        </div>
        <p className="text-white/70 text-sm">{profile?.nome} {profile?.cognome}</p>
        {avgScore ? (
          <div className="mt-3 flex items-center gap-2">
            <StarRating value={Math.round(avgScore)} readonly />
            <span className="text-lg font-bold">{avgScore}</span>
            <span className="text-white/60 text-sm">({reviews.length} recensioni)</span>
          </div>
        ) : (
          <p className="text-white/50 text-sm mt-3">Nessuna recensione ancora</p>
        )}
        <Link to="/verifica-identita" className="inline-block mt-4 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
          Verifica identità →
        </Link>
      </div>

      {/* Locazioni recenti */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Locazioni recenti</h3>
          <Link to="/locazioni" className="text-sm text-[#1a3a5c] hover:underline">Vedi tutte</Link>
        </div>
        {tenancies.length === 0 ? (
          <div className="card text-center text-gray-500 text-sm py-8">
            <p>Nessuna locazione.</p>
            <Link to="/locazioni/nuova" className="btn-primary mt-4 inline-block">Crea locazione</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {tenancies.map(t => (
              <Link key={t.id} to={`/locazioni/${t.id}`} className="card flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="font-medium text-sm text-gray-800">{t.properties?.indirizzo}, {t.properties?.citta}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(t.data_inizio), 'd MMM yyyy', { locale: it })}
                    {t.data_fine && ` → ${format(new Date(t.data_fine), 'd MMM yyyy', { locale: it })}`}
                  </p>
                </div>
                <StatoBadge stato={t.stato} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recensioni ricevute */}
      {reviews.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Recensioni ricevute</h3>
          <div className="space-y-2">
            {reviews.map(r => {
              const vals = Object.values(r.ratings || {})
              const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null
              return (
                <div key={r.id} className="card">
                  <div className="flex items-center gap-2 mb-1">
                    {avg && <StarRating value={Math.round(avg)} readonly size={14} />}
                    <span className="text-xs text-gray-500">{avg}/5</span>
                  </div>
                  {r.testo && <p className="text-sm text-gray-700 line-clamp-2">{r.testo}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
