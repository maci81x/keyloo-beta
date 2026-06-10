import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import StatoBadge from '../components/ui/StatoBadge'
import Spinner from '../components/ui/Spinner'
import StarRating from '../components/ui/StarRating'
import { ShieldCheck, ShieldAlert, Home, Plus, Star } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const CRITERI_LABELS = {
  puntualita_pagamenti: 'Puntualità',
  cura_immobile: 'Cura immobile',
  rispetto_regole: 'Regole',
  comunicazione: 'Comunicazione',
  manutenzione: 'Manutenzione',
  disponibilita: 'Disponibilità',
  rispetto_privacy: 'Privacy',
}

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

  const verified = (profile?.verification_level || 0) >= 1

  // Aggrega ratings medi per criterio su tutte le recensioni
  const criteriMedi = reviews.length ? (() => {
    const totali = {}
    const conti = {}
    reviews.forEach(r => {
      Object.entries(r.ratings || {}).forEach(([k, v]) => {
        totali[k] = (totali[k] || 0) + v
        conti[k] = (conti[k] || 0) + 1
      })
    })
    return Object.entries(totali).map(([k, v]) => ({
      key: k,
      label: CRITERI_LABELS[k] || k,
      avg: (v / conti[k]).toFixed(1),
    }))
  })() : []

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-[680px] mx-auto pt-4 space-y-6">

      {/* Card reputazione */}
      <div
        className="rounded-2xl text-white p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f2744 0%, #1a3a5c 60%, #1e4a78 100%)',
          boxShadow: '0 0 0 1px rgba(59,130,246,0.2), 0 8px 32px rgba(26,58,92,0.4)',
        }}
      >
        {/* Glow orb decorativo */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />

        {/* Icona centrata */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
            style={{ background: verified ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)' }}>
            {verified
              ? <ShieldCheck size={32} className="text-[#10b981]" />
              : <ShieldAlert size={32} className="text-white/50" />
            }
          </div>
          <h2 className="text-xl font-bold tracking-tight">La tua reputazione</h2>
          <p className="text-white/70 text-sm mt-0.5">
            {profile?.nome} {profile?.cognome}
          </p>

          {/* Badge verifica prominente */}
          <div className="mt-3">
            {verified ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                <ShieldCheck size={14} /> Identità verificata
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-white/10 text-white/60 border border-white/10">
                <ShieldAlert size={14} /> Non verificato
              </span>
            )}
          </div>
        </div>

        {/* Contenuto: se verificato con recensioni → griglia criteri; altrimenti CTA */}
        {verified && criteriMedi.length > 0 ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              <StarRating value={Math.round(avgScore)} readonly size={20} />
              <span className="text-2xl font-bold">{avgScore}</span>
              <span className="text-white/50 text-sm">/ 5 · {reviews.length} {reviews.length === 1 ? 'recensione' : 'recensioni'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {criteriMedi.slice(0, 6).map(c => (
                <div key={c.key} className="rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-white/50 mb-0.5 truncate">{c.label}</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold">{c.avg}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : !verified ? (
          <div className="text-center mt-2">
            <p className="text-white/50 text-sm mb-4">Inizia a costruire la tua reputazione</p>
            <Link
              to="/verifica-identita"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: '#10b981', color: '#fff', boxShadow: '0 0 16px rgba(16,185,129,0.3)' }}
            >
              <ShieldCheck size={15} /> Verifica identità
            </Link>
          </div>
        ) : (
          <div className="text-center mt-2">
            <p className="text-white/50 text-sm">Nessuna recensione ancora ricevuta</p>
          </div>
        )}
      </div>

      {/* Locazioni recenti */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Home size={16} className="text-[#1a3a5c]" /> Locazioni recenti
          </h3>
          <Link to="/locazioni" className="text-sm text-[#1a3a5c] hover:underline">Vedi tutte</Link>
        </div>

        {tenancies.length === 0 ? (
          <div className="card text-center py-10 space-y-4">
            {/* Illustrazione SVG inline */}
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mx-auto opacity-30">
              <rect x="10" y="32" width="52" height="32" rx="4" stroke="#1a3a5c" strokeWidth="2.5" fill="none"/>
              <path d="M6 34L36 10L66 34" stroke="#1a3a5c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="28" y="44" width="16" height="20" rx="2" stroke="#1a3a5c" strokeWidth="2" fill="none"/>
              <circle cx="52" cy="26" r="8" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5"/>
              <path d="M49 26l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <p className="font-medium text-gray-700">Nessun contratto ancora</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                Crea il tuo primo contratto per iniziare a costruire la tua reputazione.
              </p>
            </div>
            <Link to="/locazioni/nuova" className="btn-primary inline-flex items-center gap-2 mx-auto">
              <Plus size={15} /> Crea locazione
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {tenancies.map(t => (
              <Link key={t.id} to={`/locazioni/${t.id}`} className="card flex items-center justify-between hover:shadow-md transition-shadow block">
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
