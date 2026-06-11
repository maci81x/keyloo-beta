import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import BadgeVerifica from '../components/ui/BadgeVerifica'
import StarRating from '../components/ui/StarRating'
import Spinner from '../components/ui/Spinner'
import ReviewCard from '../components/reviews/ReviewCard'
import { useToast } from '../components/ui/Toast'
import { Share2, ShieldCheck, Star, Edit2, Check } from 'lucide-react'

const CRITERI_LABELS = {
  puntualita_pagamenti: 'Puntualità pagamenti',
  cura_immobile: "Cura dell'immobile",
  rispetto_regole: 'Rispetto delle regole',
  comunicazione: 'Comunicazione',
  manutenzione: 'Manutenzione',
  disponibilita: 'Disponibilità',
  rispetto_privacy: 'Privacy',
}

function RatingBar({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-32 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(value / 5) * 100}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 w-6 text-right">{Number(value).toFixed(1)}</span>
    </div>
  )
}

export default function ProfiloPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    nome: profile?.nome || '',
    cognome: profile?.cognome || '',
    telefono: profile?.telefono || '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('reviews')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('stato', 'pubblicata')
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        console.log('PROFILO REVIEWS:', data, 'ERROR:', error)
        setReviews(data || [])
        setLoadingReviews(false)
      })
  }, [user.id])

  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    setSaving(false)
    if (error) { showToast('Errore salvataggio', 'error'); return }
    await refreshProfile()
    setEditing(false)
    showToast('Profilo aggiornato', 'success')
  }

  async function copyShareLink() {
    const token = profile?.share_token
    if (!token) return
    const url = `${window.location.origin}/p/${token}`
    await navigator.clipboard.writeText(url)
    showToast('Link copiato negli appunti', 'success')
  }

  const initials = `${profile?.nome?.[0] || ''}${profile?.cognome?.[0] || ''}`.toUpperCase()
  const verified = (profile?.verification_level || 0) >= 1

  const avgScore = reviews.length
    ? (reviews.reduce((sum, r) => {
        const vals = Object.values(r.ratings || {})
        return sum + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0)
      }, 0) / reviews.length)
    : null

  const criteriMedi = reviews.length ? (() => {
    const tot = {}; const cnt = {}
    reviews.forEach(r => Object.entries(r.ratings || {}).forEach(([k, v]) => {
      tot[k] = (tot[k] || 0) + v; cnt[k] = (cnt[k] || 0) + 1
    }))
    return Object.entries(tot)
      .map(([k, v]) => ({ key: k, label: CRITERI_LABELS[k] || k, avg: v / cnt[k] }))
      .sort((a, b) => b.avg - a.avg)
  })() : []

  return (
    <div className="max-w-[680px] mx-auto space-y-4">

      {/* Hero avatar */}
      <div className="rounded-2xl overflow-hidden text-white relative"
        style={{ background: 'linear-gradient(135deg, #0f2744 0%, #1a3a5c 60%, #1e4a78 100%)', boxShadow: '0 8px 32px rgba(26,58,92,0.3)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none -translate-y-12 translate-x-12"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
        <div className="relative p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold flex-shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              {initials || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight">{profile?.nome} {profile?.cognome}</h1>
              <p className="text-white/50 text-xs mt-0.5 truncate">{user?.email}</p>
              <div className="mt-1.5">
                <BadgeVerifica level={profile?.verification_level || 0} />
              </div>
            </div>
            <button onClick={() => setEditing(!editing)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Edit2 size={14} />
            </button>
          </div>

          {/* Rating inline se esistono recensioni */}
          {avgScore !== null && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
              <StarRating value={Math.round(avgScore)} readonly size={16} />
              <span className="text-xl font-extrabold">{avgScore.toFixed(1)}</span>
              <span className="text-white/40 text-xs">/ 5 · {reviews.length} {reviews.length === 1 ? 'recensione' : 'recensioni'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Form modifica inline */}
      {editing && (
        <form onSubmit={handleSave} className="card space-y-3">
          <h2 className="font-semibold text-[#1a3a5c] text-sm">Modifica dati</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'nome', label: 'Nome' },
              { name: 'cognome', label: 'Cognome' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                <input
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Telefono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="input-field"
              placeholder="+39 333 0000000"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1">Annulla</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Spinner size="sm" /> : <Check size={14} />} Salva
            </button>
          </div>
        </form>
      )}

      {/* Reputazione */}
      {criteriMedi.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Star size={15} className="text-yellow-400 fill-yellow-400" />
            <h2 className="font-semibold text-gray-800 text-sm">Reputazione per criterio</h2>
          </div>
          <div className="space-y-2.5">
            {criteriMedi.map(c => (
              <RatingBar key={c.key} label={c.label} value={c.avg} />
            ))}
          </div>
        </div>
      )}

      {/* Verificazione identità */}
      {!verified && (
        <div className="card border-dashed" style={{ borderColor: 'rgba(16,185,129,0.4)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.1)' }}>
              <ShieldCheck size={18} className="text-[#10b981]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">Verifica la tua identità</p>
              <p className="text-xs text-gray-400 mt-0.5">Aumenta la fiducia nella community</p>
            </div>
            <a href="/verifica-identita" className="btn-success text-xs px-3 py-1.5">Inizia</a>
          </div>
        </div>
      )}

      {/* Link pubblico */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-800 text-sm">Link passaporto</h2>
          <button onClick={copyShareLink}
            className="flex items-center gap-1.5 text-xs font-medium text-[#1a3a5c] hover:underline">
            <Share2 size={13} /> Copia
          </button>
        </div>
        <p className="text-xs text-gray-400">Condividi il tuo profilo di reputazione con futuri inquilini o proprietari.</p>
        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-xl">
          <p className="text-xs font-mono text-gray-500 truncate">
            {window.location.origin}/p/{profile?.share_token || '...'}
          </p>
        </div>
      </div>

      {/* Recensioni ricevute */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star size={15} className="text-yellow-400 fill-yellow-400" />
          <h2 className="font-semibold text-gray-800">Recensioni ricevute</h2>
          {reviews.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              {reviews.length}
            </span>
          )}
        </div>
        {loadingReviews ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : reviews.length === 0 ? (
          <div className="card text-center py-8">
            <Star size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">Nessuna recensione ancora ricevuta.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}
      </div>

    </div>
  )
}
