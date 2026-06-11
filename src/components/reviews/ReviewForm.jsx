import { useState } from 'react'
import Spinner from '../ui/Spinner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Send, Save } from 'lucide-react'

const CRITERI_INQUILINO = [
  { key: 'puntualita_pagamenti', label: 'Puntualità pagamenti' },
  { key: 'cura_immobile', label: "Cura dell'immobile" },
  { key: 'rispetto_regole', label: 'Rispetto delle regole' },
  { key: 'comunicazione', label: 'Comunicazione' },
]
const CRITERI_PROPRIETARIO = [
  { key: 'manutenzione', label: 'Manutenzione e riparazioni' },
  { key: 'disponibilita', label: 'Disponibilità' },
  { key: 'rispetto_privacy', label: 'Rispetto della privacy' },
  { key: 'comunicazione', label: 'Comunicazione' },
]
const STAR_LABELS = ['', 'Scarso', 'Sufficiente', 'Buono', 'Ottimo', 'Eccellente']

function BigStar({ filled, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="transition-all duration-100 hover:scale-125 active:scale-95">
      <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? '#facc15' : 'none'}
        stroke={filled ? '#facc15' : '#d1d5db'} strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </button>
  )
}

export default function ReviewForm({ tenancyId, direction, onSuccess }) {
  const { user } = useAuth()
  const criteri = direction === 'landlord_to_tenant' ? CRITERI_INQUILINO : CRITERI_PROPRIETARIO
  const [ratings, setRatings] = useState({})
  const [testo, setTesto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(stato) {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('reviews').insert({
      tenancy_id: tenancyId,
      author_id: user.id,
      direction,
      ratings,
      testo,
      stato,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess?.()
  }

  return (
    <div className="space-y-5">
      {criteri.map(c => {
        const val = ratings[c.key] || 0
        return (
          <div key={c.key}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">{c.label}</span>
              {val > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c]">
                  {STAR_LABELS[val]}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <BigStar key={n} filled={n <= val}
                  onClick={() => setRatings(prev => ({ ...prev, [c.key]: n }))} />
              ))}
            </div>
          </div>
        )
      })}

      <div>
        <textarea
          value={testo}
          onChange={e => setTesto(e.target.value)}
          maxLength={1500}
          rows={4}
          placeholder="Descrivi la tua esperienza (max 1500 caratteri)..."
          className="input-field resize-none"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">Commento opzionale</span>
          <span className={`text-xs font-medium ${testo.length > 1400 ? 'text-orange-500' : 'text-gray-400'}`}>
            {testo.length}/1500
          </span>
        </div>
        {testo.length > 0 && (
          <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500 italic">"{testo}"</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={() => handleSubmit('bozza')} disabled={loading}
          className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
          <Save size={14} /> Salva bozza
        </button>
        <button onClick={() => handleSubmit('depositata')} disabled={loading}
          className="btn-primary flex-1 flex items-center justify-center gap-1.5">
          {loading ? <Spinner size="sm" /> : <Send size={14} />} Deposita
        </button>
      </div>
    </div>
  )
}
