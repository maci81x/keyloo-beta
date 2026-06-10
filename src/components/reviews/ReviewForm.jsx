import { useState } from 'react'
import StarRating from '../ui/StarRating'
import Spinner from '../ui/Spinner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const CRITERI_INQUILINO = [
  { key: 'puntualita_pagamenti', label: 'Puntualità pagamenti' },
  { key: 'cura_immobile', label: 'Cura dell\'immobile' },
  { key: 'rispetto_regole', label: 'Rispetto delle regole' },
  { key: 'comunicazione', label: 'Comunicazione' },
]

const CRITERI_PROPRIETARIO = [
  { key: 'manutenzione', label: 'Manutenzione e riparazioni' },
  { key: 'disponibilita', label: 'Disponibilità' },
  { key: 'rispetto_privacy', label: 'Rispetto della privacy' },
  { key: 'comunicazione', label: 'Comunicazione' },
]

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
    <div className="space-y-4">
      {criteri.map(c => (
        <div key={c.key} className="flex items-center justify-between">
          <span className="text-sm text-gray-700">{c.label}</span>
          <StarRating
            value={ratings[c.key] || 0}
            onChange={v => setRatings(prev => ({ ...prev, [c.key]: v }))}
          />
        </div>
      ))}
      <textarea
        value={testo}
        onChange={e => setTesto(e.target.value)}
        maxLength={1500}
        rows={4}
        placeholder="Commento (max 1500 caratteri)..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#1a3a5c]"
      />
      <div className="text-right text-xs text-gray-400">{testo.length}/1500</div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => handleSubmit('bozza')}
          disabled={loading}
          className="btn-secondary flex-1"
        >
          Salva bozza
        </button>
        <button
          onClick={() => handleSubmit('depositata')}
          disabled={loading}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {loading && <Spinner size="sm" />} Deposita
        </button>
      </div>
    </div>
  )
}
