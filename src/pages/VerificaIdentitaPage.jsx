import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import BadgeVerifica from '../components/ui/BadgeVerifica'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import { Upload } from 'lucide-react'

export default function VerificaIdentitaPage() {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('identity_verifications').insert({
      profile_id: user.id,
      stato: 'pending',
    })
    setLoading(false)
    if (error) { showToast('Errore invio richiesta', 'error'); return }
    setSubmitted(true)
    showToast('Richiesta inviata', 'success')
  }

  if (profile?.verification_level >= 1) return (
    <div className="card max-w-md mx-auto text-center py-10 space-y-3">
      <BadgeVerifica level={1} />
      <p className="text-gray-600 text-sm">La tua identità è già verificata.</p>
    </div>
  )

  if (submitted) return (
    <div className="card max-w-md mx-auto text-center py-10 space-y-3">
      <p className="text-[#10b981] font-semibold">Richiesta inviata!</p>
      <p className="text-sm text-gray-500">Il team Keyloo verificherà il documento entro 24–48 ore.</p>
    </div>
  )

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="card">
        <h1 className="font-bold text-[#1a3a5c] text-lg mb-2">Verifica identità</h1>
        <p className="text-sm text-gray-600">
          Carica un documento d'identità valido per ottenere il badge verificato.
          La verifica aumenta la fiducia nella tua reputazione.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <Upload size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Upload documento (stub)</p>
          <p className="text-xs text-gray-400 mt-1">Carta d'identità o passaporto</p>
        </div>
        <p className="text-xs text-gray-400 text-center">
          I documenti vengono trattati in conformità con il GDPR e cancellati dopo la verifica.
        </p>
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Spinner size="sm" />} Invia richiesta
        </button>
      </form>
    </div>
  )
}
