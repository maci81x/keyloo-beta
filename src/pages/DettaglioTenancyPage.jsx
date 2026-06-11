import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import StatoBadge from '../components/ui/StatoBadge'
import ReviewForm from '../components/reviews/ReviewForm'
import ReviewCard from '../components/reviews/ReviewCard'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import { format, differenceInDays, differenceInMonths } from 'date-fns'
import { it } from 'date-fns/locale'
import { useToast } from '../components/ui/Toast'
import { MapPin, Calendar, FileText, CreditCard, Star, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'

const GRADIENT_BY_STATO = {
  attiva: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  chiusa: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
  proposta: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  confermata: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
}

function ContractTimeline({ dataInizio, dataFine, stato }) {
  const start = new Date(dataInizio)
  const end = dataFine ? new Date(dataFine) : null
  const today = new Date()
  const totalDays = end ? differenceInDays(end, start) : null
  const elapsedDays = differenceInDays(today, start)
  const progress = end
    ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
    : stato === 'chiusa' ? 100 : 50
  const months = end ? differenceInMonths(end, start) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="font-medium text-gray-700">{format(start, 'd MMM yyyy', { locale: it })}</span>
        {end && <span className="font-medium text-gray-700">{format(end, 'd MMM yyyy', { locale: it })}</span>}
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: GRADIENT_BY_STATO[stato] || GRADIENT_BY_STATO.proposta }}
        />
        {stato === 'attiva' && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#10b981] shadow-sm"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Inizio</span>
        {months && <span className="font-medium">{months} {months === 1 ? 'mese' : 'mesi'} totali</span>}
        {end && <span>Fine</span>}
      </div>
    </div>
  )
}

export default function DettaglioTenancyPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
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

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!tenancy) return <p className="text-center text-gray-500 py-10">Locazione non trovata.</p>

  const isLandlord = tenancy.landlord_id === user.id
  const direction = isLandlord ? 'landlord_to_tenant' : 'tenant_to_landlord'
  const miaReview = reviews.find(r => r.author_id === user.id)
  const gradient = GRADIENT_BY_STATO[tenancy.stato] || GRADIENT_BY_STATO.proposta
  const reviewWindowOpen = tenancy.stato === 'chiusa'
    && tenancy.review_window_closes_at
    && new Date(tenancy.review_window_closes_at) > new Date()

  return (
    <div className="max-w-[680px] mx-auto space-y-4">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1a3a5c] transition-colors">
        <ArrowLeft size={15} /> Locazioni
      </button>

      {/* Header immobile */}
      <div className="rounded-2xl overflow-hidden text-white relative"
        style={{ background: gradient, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
        />
        <div className="relative p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight leading-tight">
                {tenancy.properties?.indirizzo}
              </h1>
              <div className="flex items-center gap-1.5 mt-1 text-white/75 text-sm">
                <MapPin size={13} />
                <span>{tenancy.properties?.citta} ({tenancy.properties?.provincia})</span>
              </div>
            </div>
            <StatoBadge stato={tenancy.stato} />
          </div>

          <div className="mt-4">
            <ContractTimeline
              dataInizio={tenancy.data_inizio}
              dataFine={tenancy.data_fine}
              stato={tenancy.stato}
            />
          </div>
        </div>
      </div>

      {/* Dettagli contratto */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={15} className="text-[#1a3a5c]" />
          <h2 className="font-semibold text-[#1a3a5c] text-sm">Dettagli contratto</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Inizio', value: format(new Date(tenancy.data_inizio), 'd MMM yyyy', { locale: it }) },
            { label: 'Fine', value: tenancy.data_fine ? format(new Date(tenancy.data_fine), 'd MMM yyyy', { locale: it }) : 'Non definita' },
            { label: 'Ruolo', value: isLandlord ? 'Proprietario' : 'Inquilino' },
            { label: 'Canone', value: tenancy.canone_mensile ? `€ ${Number(tenancy.canone_mensile).toLocaleString('it-IT')}` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-800">{value}</p>
            </div>
          ))}
        </div>
        {tenancy.estremi_registrazione_rli && (
          <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
            RLI: {tenancy.estremi_registrazione_rli}
          </p>
        )}
      </div>

      {/* Check-in certificato / Pagamento */}
      <div className="card"
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', borderColor: 'rgba(16,185,129,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)' }}>
            <CreditCard size={18} className="text-[#10b981]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm">Check-in certificato</p>
            <p className="text-xs text-gray-500 mt-0.5">Certifica il tuo check-in con firma digitale e geolocalizzazione</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-extrabold text-[#10b981]">€ 9,99</p>
            <Link
              to={`/pagamento/checkin?tenancy=${id}`}
              className="mt-1 inline-flex items-center gap-1.5 btn-success text-xs px-3 py-1.5">
              <CreditCard size={12} /> Paga
            </Link>
          </div>
        </div>
      </div>

      {/* Banner review window */}
      {reviewWindowOpen && !miaReview && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
          <span className="text-amber-800 font-medium">
            Finestra recensione aperta fino al {format(new Date(tenancy.review_window_closes_at), 'd MMM yyyy', { locale: it })}
          </span>
        </div>
      )}

      {/* Recensioni */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={15} className="text-yellow-400 fill-yellow-400" />
            <h2 className="font-semibold text-gray-800">Recensioni</h2>
            {reviews.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                {reviews.length}
              </span>
            )}
          </div>
          {!miaReview && (
            <button onClick={() => setShowReviewForm(true)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
              <Star size={12} /> Scrivi
            </button>
          )}
          {miaReview && (
            <div className="flex items-center gap-1.5 text-xs text-[#10b981] font-medium">
              <CheckCircle2 size={13} /> Recensione scritta
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="card text-center py-8">
            <Star size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">Nessuna recensione ancora.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <ReviewCard key={r.id} review={r}
                onContesta={r.recipient_id === user.id ? setDisputeReview : null} />
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
            className="input-field resize-none"
          />
          <button onClick={apriDisputa} className="btn-primary w-full">Invia contestazione</button>
        </div>
      </Modal>
    </div>
  )
}
