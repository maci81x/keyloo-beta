import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import StatoBadge from '../ui/StatoBadge'
import { Flag, Star } from 'lucide-react'

const LABEL_MAP = {
  puntualita_pagamenti: 'Puntualità',
  cura_immobile: 'Cura immobile',
  rispetto_regole: 'Regole',
  comunicazione: 'Comunicazione',
  manutenzione: 'Manutenzione',
  disponibilita: 'Disponibilità',
  rispetto_privacy: 'Privacy',
}

function MiniStars({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={10}
          className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  )
}

export default function ReviewCard({ review, onContesta }) {
  const entries = Object.entries(review.ratings || {})
  const avg = entries.length
    ? (entries.reduce((s, [, v]) => s + v, 0) / entries.length).toFixed(1)
    : null

  const isLandlordToTenant = review.direction === 'landlord_to_tenant'
  const borderColor = isLandlordToTenant ? '#1a3a5c' : '#10b981'
  const dirLabel = isLandlordToTenant ? 'Dal proprietario' : "Dall'inquilino"

  return (
    <div className="card overflow-hidden pl-0" style={{ borderLeft: `4px solid ${borderColor}` }}>
      <div className="pl-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${borderColor}, ${isLandlordToTenant ? '#1e4a78' : '#059669'})` }}>
              {isLandlordToTenant ? 'P' : 'I'}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600">{dirLabel}</p>
              {review.published_at && (
                <p className="text-[10px] text-gray-400">
                  {format(new Date(review.published_at), 'd MMM yyyy', { locale: it })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {avg && (
              <span className="text-sm font-bold text-gray-800">{avg}
                <span className="text-xs font-normal text-gray-400">/5</span>
              </span>
            )}
            <StatoBadge stato={review.stato} />
          </div>
        </div>

        {/* Ratings per criterio */}
        {entries.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
            {entries.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">{LABEL_MAP[k] || k}</span>
                <MiniStars value={v} />
              </div>
            ))}
          </div>
        )}

        {/* Testo */}
        {review.testo && (
          <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-50 pt-2 mb-2">
            "{review.testo}"
          </p>
        )}

        {/* Footer */}
        {review.stato === 'pubblicata' && onContesta && (
          <button onClick={() => onContesta(review)}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors mt-1">
            <Flag size={11} /> Contesta
          </button>
        )}
      </div>
    </div>
  )
}
