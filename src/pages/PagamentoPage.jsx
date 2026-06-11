import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { CreditCard, Lock, CheckCircle, ArrowLeft, Zap } from 'lucide-react'
import Spinner from '../components/ui/Spinner'

const PRODOTTI = {
  checkin: {
    titolo: 'Check-in certificato',
    descrizione: 'Certifica il tuo ingresso con firma digitale, geolocalizzazione e timestamp blockchain.',
    prezzo: '9,99',
    features: ['Firma digitale validata', 'Geolocalizzazione GPS', 'Timestamp certificato', 'PDF scaricabile'],
    icon: '🔒',
  },
  verifica: {
    titolo: 'Verifica identità',
    descrizione: 'Verifica la tua identità con documento ufficiale e selfie in tempo reale.',
    prezzo: '4,99',
    features: ['Riconoscimento documento', 'Selfie liveness check', 'Badge verificato', 'Valido 12 mesi'],
    icon: '🛡️',
  },
}

function ConfettiAnim() {
  const items = Array.from({ length: 18 }, (_, i) => ({
    left: `${5 + i * 5.5}%`,
    delay: `${(i * 0.07).toFixed(2)}s`,
    color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][i % 5],
    size: 6 + (i % 3) * 4,
  }))
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((c, i) => (
        <div key={i} className="absolute animate-bounce"
          style={{ left: c.left, top: '-10px', animationDelay: c.delay, animationDuration: '0.8s' }}>
          <div style={{ width: c.size, height: c.size, background: c.color, borderRadius: '50%', opacity: 0.7 }} />
        </div>
      ))}
    </div>
  )
}

export default function PagamentoPage() {
  const { tipo } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tenancyId = searchParams.get('tenancy')

  const prodotto = PRODOTTI[tipo] || PRODOTTI.checkin

  const [step, setStep] = useState('form') // 'form' | 'processing' | 'success'
  const [card, setCard] = useState({ numero: '', scadenza: '', cvv: '', nome: '' })
  const [errors, setErrors] = useState({})

  function formatNumero(v) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }
  function formatScadenza(v) {
    return v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2')
  }

  function validate() {
    const e = {}
    if (card.numero.replace(/\s/g, '').length < 16) e.numero = 'Numero non valido'
    if (card.scadenza.length < 5) e.scadenza = 'Scadenza non valida'
    if (card.cvv.length < 3) e.cvv = 'CVV non valido'
    if (!card.nome.trim()) e.nome = 'Campo obbligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handlePaga() {
    if (!validate()) return
    setStep('processing')
    setTimeout(() => setStep('success'), 2200)
  }

  if (step === 'processing') {
    return (
      <div className="max-w-sm mx-auto flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.1)' }}>
          <Spinner size="lg" />
        </div>
        <p className="font-semibold text-gray-700">Elaborazione pagamento…</p>
        <p className="text-sm text-gray-400">Connessione sicura SSL/TLS</p>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="max-w-sm mx-auto py-16 relative">
        <ConfettiAnim />
        <div className="card text-center space-y-4 relative z-10">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)' }}>
            <CheckCircle size={36} className="text-[#10b981]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-800">Pagamento confermato!</h2>
            <p className="text-sm text-gray-500 mt-1">{prodotto.titolo} attivato con successo</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-1">
            <p className="text-xs text-gray-500">Importo addebitato</p>
            <p className="text-2xl font-extrabold text-[#10b981]">€ {prodotto.prezzo}</p>
          </div>
          <div className="space-y-2 pt-2">
            {tenancyId && (
              <button onClick={() => navigate(`/locazioni/${tenancyId}`)}
                className="btn-primary w-full">
                Torna alla locazione
              </button>
            )}
            <button onClick={() => navigate('/dashboard')}
              className="btn-secondary w-full">
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[420px] mx-auto space-y-4">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1a3a5c] transition-colors">
        <ArrowLeft size={15} /> Indietro
      </button>

      {/* Riepilogo prodotto */}
      <div className="rounded-2xl overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #0f2744, #1a3a5c)', boxShadow: '0 8px 24px rgba(26,58,92,0.25)' }}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              {prodotto.icon}
            </div>
            <div>
              <p className="font-bold text-sm">{prodotto.titolo}</p>
              <p className="text-white/50 text-xs mt-0.5">{prodotto.descrizione}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {prodotto.features.map(f => (
              <div key={f} className="flex items-center gap-1.5 text-xs text-white/70">
                <Zap size={10} className="text-[#10b981] flex-shrink-0" /> {f}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-white/60 text-sm">Totale</span>
            <span className="text-2xl font-extrabold">€ {prodotto.prezzo}</span>
          </div>
        </div>
      </div>

      {/* Form carta */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={14} className="text-[#10b981]" />
          <h2 className="font-semibold text-gray-800 text-sm">Pagamento sicuro</h2>
          <span className="ml-auto text-[10px] text-gray-400 font-medium">256-bit SSL</span>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Numero carta</label>
          <div className="relative">
            <input
              value={card.numero}
              onChange={e => setCard(p => ({ ...p, numero: formatNumero(e.target.value) }))}
              placeholder="1234 5678 9012 3456"
              className={`input-field pr-10 font-mono tracking-widest ${errors.numero ? 'border-red-300' : ''}`}
            />
            <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
          </div>
          {errors.numero && <p className="text-xs text-red-500 mt-1">{errors.numero}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Scadenza</label>
            <input
              value={card.scadenza}
              onChange={e => setCard(p => ({ ...p, scadenza: formatScadenza(e.target.value) }))}
              placeholder="MM/AA"
              className={`input-field font-mono ${errors.scadenza ? 'border-red-300' : ''}`}
            />
            {errors.scadenza && <p className="text-xs text-red-500 mt-1">{errors.scadenza}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">CVV</label>
            <input
              value={card.cvv}
              onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="123"
              type="password"
              className={`input-field font-mono ${errors.cvv ? 'border-red-300' : ''}`}
            />
            {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Nome sul titolare</label>
          <input
            value={card.nome}
            onChange={e => setCard(p => ({ ...p, nome: e.target.value.toUpperCase() }))}
            placeholder="MARIO ROSSI"
            className={`input-field uppercase tracking-wide ${errors.nome ? 'border-red-300' : ''}`}
          />
          {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
        </div>

        <button onClick={handlePaga}
          className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}>
          <Lock size={15} /> Paga € {prodotto.prezzo}
        </button>

        <p className="text-center text-[10px] text-gray-400">
          I dati della carta non vengono salvati. Pagamento simulato a scopo dimostrativo.
        </p>
      </div>
    </div>
  )
}
