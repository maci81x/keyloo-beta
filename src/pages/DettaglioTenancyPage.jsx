import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import StatoBadge from '../components/ui/StatoBadge'
import ReviewForm from '../components/reviews/ReviewForm'
import ReviewCard from '../components/reviews/ReviewCard'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useToast } from '../components/ui/Toast'

export default function DettaglioTenancyPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tenancy, setTenancy] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [disputeReview, setDisputeReview] = useState(null)
  const [disputeMotivo, setDisputeMotivo] = useState('')

  async function load() {
    const [tenRes, revRes] = await Promise.all([
      supabase.from('tenancies').select('*, properties(*)').eq('id', id).single(),
      supabase.from('reviews').select('*').eq('tenancy_id', id),
    ])
    setTenancy(tenRes.data)
    setReviews(revRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function apriDisputa() {
    const { error } = await supabase.from('disputes').insert({
      review_id: disputeReview.id,
      opened_by: user.id,
      motivo: disputeMotivo,
    })
    if (error) { showToast('Errore apertura disputa', 'error'); return }
    showToast('Disputa aperta', 'success')
    setDisputeReview(null)
    setDisputeMotivo('')
    load()
  }

  const direction = tenancy?.landlord_id === user.id ? 'landlord_to_tenant' : 'tenant_to_landlord'
  const miaReview = reviews.find(r => r.author_id === user.id)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!tenancy) return <p className="text-center text-gray-500 py-10">Locazione non trovata.</p>

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-bold text-[#1a3a5c] text-lg">{tenancy.properties?.indirizzo}</h1>
          <StatoBadge stato={tenancy.stato} />
        </div>
        <p className="text-sm text-gray-500">{tenancy.properties?.citta} ({tenancy.properties?.provincia})</p>
        <p className="text-xs text-gray-400 mt-1">
          {format(new Date(tenancy.data_inizio), 'd MMM yyyy', { locale: it })}
          {tenancy.data_fine && ` → ${format(new Date(tenancy.data_fine), 'd MMM yyyy', { locale: it })}`}
        </p>
        {tenancy.estremi_registrazione_rli && (
          <p className="text-xs text-gray-400 mt-1">RLI: {tenancy.estremi_registrazione_rli}</p>
        )}
      </div>

      {/* Recensioni */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Recensioni</h2>
          {!miaReview && (
            <button onClick={() => setShowReviewForm(true)} className="btn-primary text-sm">
              Scrivi recensione
            </button>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">Nessuna recensione ancora.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <ReviewCard key={r.id} review={r} onContesta={r.recipient_id === user.id ? setDisputeReview : null} />
            ))}
          </div>
        )}
      </div>

      <Modal open={showReviewForm} onClose={() => setShowReviewForm(false)} title="Scrivi recensione">
        <ReviewForm
          tenancyId={id}
          direction={direction}
          onSuccess={() => { setShowReviewForm(false); load(); showToast('Recensione salvata', 'success') }}
        />
      </Modal>

      <Modal open={!!disputeReview} onClose={() => setDisputeReview(null)} title="Apri disputa">
        <div className="space-y-3">
          <textarea
            value={disputeMotivo}
            onChange={e => setDisputeMotivo(e.target.value)}
            rows={4}
            placeholder="Descrivi il motivo della contestazione..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
          />
          <button onClick={apriDisputa} className="btn-primary w-full">Invia contestazione</button>
        </div>
      </Modal>
    </div>
  )
}
