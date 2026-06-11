import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import StatoBadge from '../components/ui/StatoBadge'
import Spinner from '../components/ui/Spinner'
import StarRating from '../components/ui/StarRating'
import { ShieldCheck, ShieldAlert, Home, Plus, Star, FileText, Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

const CRITERI_LABELS = {
  puntualita_pagamenti: 'Puntualità', cura_immobile: 'Cura immobile',
  rispetto_regole: 'Regole', comunicazione: 'Comunicazione',
  manutenzione: 'Manutenzione', disponibilita: 'Disponibilità', rispetto_privacy: 'Privacy',
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [reviews, setReviews] = useState([])
  const [tenancies, setTenancies] = useState([])
  const [reviewDovuta, setReviewDovuta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [revRes, tenRes] = await Promise.all([
        supabase.from('reviews').select('*').eq('recipient_id', user.id).eq('stato', 'pubblicata').order('published_at', { ascending: false }).limit(10),
        supabase.from('tenancies').select('*, properties(indirizzo, citta)').or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`).order('created_at', { ascending: false }),
      ])
      const revs = revRes.data || []
      const tens = tenRes.data || []
      setReviews(revs)
      setTenancies(tens)

      // Cerca tenancy chiusa con finestra review aperta dove non ho ancora scritto
      const { data: mieReviews } = await supabase
        .from('reviews').select('tenancy_id').eq('author_id', user.id)
      const giàScritte = new Set((mieReviews || []).map(r => r.tenancy_id))
      const pending = tens.find(t =>
        t.stato === 'chiusa' &&
        t.review_window_closes_at &&
        new Date(t.review_window_closes_at) > new Date() &&
        !giàScritte.has(t.id)
      )
      setReviewDovuta(pending || null)
      setLoading(false)
    }
    load()
  }, [user.id])

  const verified = (profile?.verification_level || 0) >= 1
  const avgScore = reviews.length
    ? (reviews.reduce((sum, r) => {
        const vals = Object.values(r.ratings || {})
        return sum + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0)
      }, 0) / reviews.length).toFixed(1)
    : null

  const criteriMedi = reviews.length ? (() => {
    const tot = {}; const cnt = {}
    reviews.forEach(r => Object.entries(r.ratings || {}).forEach(([k, v]) => {
      tot[k] = (tot[k] || 0) + v; cnt[k] = (cnt[k] || 0) + 1
    }))
    return Object.entries(tot).map(([k, v]) => ({ key: k, label: CRITERI_LABELS[k] || k, avg: (v / cnt[k]).toFixed(1) }))
  })() : []

  const tenancieRecenti = tenancies.slice(0, 4)
  const anniStorico = tenancies.length
    ? Math.max(0, new Date().getFullYear() - Math.min(...tenancies.map(t => new Date(t.data_inizio).getFullYear())))
    : 0

  const steps = [
    { label: 'Verifica identità', done: verified, link: '/verifica-identita' },
    { label: 'Primo contratto', done: tenancies.length > 0, link: '/locazioni/nuova' },
    { label: 'Prima recensione ricevuta', done: reviews.length > 0, link: '/locazioni' },
  ]
  const stepsCompleted = steps.filter(s => s.done).length

  // Attività recente
  const attivita = [
    ...reviews.slice(0, 2).map(r => ({
      tipo: 'review', data: r.published_at,
      testo: `Recensione ricevuta · ${Object.values(r.ratings || {}).length ? (Object.values(r.ratings).reduce((a, b) => a + b, 0) / Object.values(r.ratings).length).toFixed(1) : '—'}/5`,
      icon: Star, color: 'text-yellow-500',
    })),
    ...tenancieRecenti.slice(0, 2).map(t => ({
      tipo: 'tenancy', data: t.created_at,
      testo: `Contratto ${t.stato} · ${t.properties?.indirizzo}`,
      icon: Home, color: 'text-[#1a3a5c]',
    })),
  ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 4)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-[680px] mx-auto space-y-5 pt-2">

      {/* Banner review in attesa */}
      {reviewDovuta && (
        <Link to={`/locazioni/${reviewDovuta.id}`}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:shadow-md"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)', color: '#92400e' }}>
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
          <span>Hai una recensione da scrivere per <strong>{reviewDovuta.properties?.indirizzo}</strong> — finestra aperta fino al {format(new Date(reviewDovuta.review_window_closes_at), 'd MMM yyyy', { locale: it })}</span>
        </Link>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Contratti', value: tenancies.length, icon: FileText, color: '#1a3a5c' },
          { label: 'Recensioni', value: reviews.length, icon: Star, color: '#f59e0b' },
          { label: 'Anni storico', value: anniStorico, icon: Clock, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
              style={{ background: `${s.color}15` }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Card reputazione */}
      <div className="rounded-2xl text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2744 0%, #1a3a5c 60%, #1e4a78 100%)', boxShadow: '0 0 0 1px rgba(59,130,246,0.2), 0 8px 32px rgba(26,58,92,0.35)' }}>

        {/* Glow */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />

        <div className="p-5">
          {/* Layout a due colonne se verificato con recensioni */}
          {verified && avgScore ? (
            <div className="flex gap-5">
              {/* Sinistra: stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={16} className="text-[#10b981]" />
                  <span className="text-xs font-semibold text-[#10b981]">Identità verificata</span>
                </div>
                <h2 className="text-lg font-extrabold tracking-tight">{profile?.nome} {profile?.cognome}</h2>
                <p className="text-white/50 text-xs mb-3">La tua reputazione</p>
                <div className="flex items-center gap-2 mb-3">
                  <StarRating value={Math.round(avgScore)} readonly size={18} />
                  <span className="text-2xl font-extrabold">{avgScore}</span>
                  <span className="text-white/40 text-xs">/ 5 · {reviews.length} rec.</span>
                </div>
              </div>
              {/* Destra: griglia criteri */}
              <div className="grid grid-cols-2 gap-1.5 w-44 flex-shrink-0">
                {criteriMedi.slice(0, 4).map(c => (
                  <div key={c.key} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] text-white/40 truncate">{c.label}</p>
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-bold">{c.avg}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: verified ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)' }}>
                {verified ? <ShieldCheck size={28} className="text-[#10b981]" /> : <ShieldAlert size={28} className="text-white/40" />}
              </div>
              <h2 className="text-lg font-extrabold tracking-tight">{profile?.nome} {profile?.cognome}</h2>
              <p className="text-white/50 text-sm mt-1 mb-4">
                {verified ? 'Nessuna recensione ancora ricevuta' : 'Inizia a costruire la tua reputazione'}
              </p>
              {!verified && (
                <Link to="/verifica-identita"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: '#10b981', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
                  <ShieldCheck size={15} /> Verifica identità
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prossimi passi */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title text-sm"><CheckCircle size={15} className="text-[#10b981]" /> Prossimi passi</h3>
          <span className="text-xs text-gray-400 font-medium">{stepsCompleted}/{steps.length}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3">
          <div className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(stepsCompleted / steps.length) * 100}%`, background: '#10b981' }} />
        </div>
        <div className="space-y-2">
          {steps.map(s => (
            <Link key={s.label} to={s.done ? '#' : s.link}
              className={`flex items-center gap-3 py-1.5 px-2 rounded-lg text-sm transition-colors ${s.done ? 'opacity-60' : 'hover:bg-gray-50'}`}>
              {s.done
                ? <CheckCircle size={16} className="text-[#10b981] flex-shrink-0" />
                : <Circle size={16} className="text-gray-300 flex-shrink-0" />}
              <span className={s.done ? 'line-through text-gray-400' : 'text-gray-700'}>{s.label}</span>
              {!s.done && <span className="ml-auto text-xs text-[#1a3a5c] font-medium">→</span>}
            </Link>
          ))}
        </div>
      </div>

      {/* Locazioni recenti */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title"><Home size={16} className="text-[#1a3a5c]" /> Locazioni recenti</h3>
          <Link to="/locazioni" className="text-xs text-[#1a3a5c] font-medium hover:underline">Vedi tutte →</Link>
        </div>
        {tenancieRecenti.length === 0 ? (
          <div className="card text-center py-10 space-y-4">
            <svg width="64" height="64" viewBox="0 0 72 72" fill="none" className="mx-auto opacity-25">
              <rect x="10" y="32" width="52" height="32" rx="4" stroke="#1a3a5c" strokeWidth="2.5" fill="none"/>
              <path d="M6 34L36 10L66 34" stroke="#1a3a5c" strokeWidth="2.5" strokeLinecap="round"/>
              <rect x="28" y="44" width="16" height="20" rx="2" stroke="#1a3a5c" strokeWidth="2" fill="none"/>
              <circle cx="52" cy="26" r="8" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5"/>
              <path d="M49 26l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm text-gray-500">Nessun contratto ancora.</p>
            <Link to="/locazioni/nuova" className="btn-primary inline-flex items-center gap-2">
              <Plus size={14} /> Crea locazione
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {tenancieRecenti.map(t => (
              <Link key={t.id} to={`/locazioni/${t.id}`} className="card-hover flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: t.stato === 'attiva' ? 'rgba(16,185,129,0.1)' : t.stato === 'chiusa' ? 'rgba(107,114,128,0.1)' : 'rgba(26,58,92,0.08)' }}>
                    <Home size={18} className={t.stato === 'attiva' ? 'text-[#10b981]' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{t.properties?.indirizzo}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(t.data_inizio), 'd MMM yyyy', { locale: it })}
                      {t.data_fine && ` → ${format(new Date(t.data_fine), 'd MMM yyyy', { locale: it })}`}
                    </p>
                  </div>
                </div>
                <StatoBadge stato={t.stato} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Attività recente */}
      {attivita.length > 0 && (
        <div>
          <h3 className="section-title mb-3"><Clock size={16} className="text-gray-400" /> Attività recente</h3>
          <div className="card space-y-0 divide-y divide-gray-50">
            {attivita.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <a.icon size={13} className={a.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{a.testo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.data ? formatDistanceToNow(new Date(a.data), { addSuffix: true, locale: it }) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
