import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import Spinner from '../components/ui/Spinner'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export default function NuovaTenancyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [property, setProperty] = useState({ indirizzo: '', citta: '', cap: '', provincia: '' })
  const [tenancy, setTenancy] = useState({
    data_inizio: '',
    data_fine: '',
    estremi_registrazione_rli: '',
    landlord_invite_email: '',
    tenant_invite_email: '',
  })

  function handleProp(e) { setProperty(prev => ({ ...prev, [e.target.name]: e.target.value })) }
  function handleTen(e) { setTenancy(prev => ({ ...prev, [e.target.name]: e.target.value })) }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const { data: prop, error: propErr } = await supabase
      .from('properties')
      .insert({ ...property, created_by: user.id })
      .select()
      .single()
    if (propErr) { setError(propErr.message); setLoading(false); return }

    const { data: ten, error: tenErr } = await supabase
      .from('tenancies')
      .insert({ ...tenancy, property_id: prop.id, created_by: user.id })
      .select()
      .single()
    if (tenErr) { setError(tenErr.message); setLoading(false); return }

    navigate(`/locazioni/${ten.id}`)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        {[1, 2, 3].map(n => (
          <div key={n} className={`h-2 flex-1 rounded-full ${n <= step ? 'bg-[#1a3a5c]' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="font-bold text-[#1a3a5c]">Passo 1 — Immobile</h2>
          {[
            { name: 'indirizzo', label: 'Indirizzo' },
            { name: 'citta', label: 'Città' },
            { name: 'cap', label: 'CAP' },
            { name: 'provincia', label: 'Provincia' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                name={f.name}
                value={property[f.name]}
                onChange={handleProp}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a5c]"
              />
            </div>
          ))}
          <button onClick={() => setStep(2)} className="btn-primary w-full flex items-center justify-center gap-1">
            Avanti <ChevronRight size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="font-bold text-[#1a3a5c]">Passo 2 — Contratto</h2>
          {[
            { name: 'data_inizio', label: 'Data inizio', type: 'date' },
            { name: 'data_fine', label: 'Data fine (opzionale)', type: 'date' },
            { name: 'estremi_registrazione_rli', label: 'Estremi registrazione RLI' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                name={f.name}
                value={tenancy[f.name]}
                onChange={handleTen}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a5c]"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 flex items-center justify-center gap-1">
              <ChevronLeft size={16} /> Indietro
            </button>
            <button onClick={() => setStep(3)} className="btn-primary flex-1 flex items-center justify-center gap-1">
              Avanti <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-4">
          <h2 className="font-bold text-[#1a3a5c]">Passo 3 — Parti</h2>
          {[
            { name: 'landlord_invite_email', label: 'Email proprietario' },
            { name: 'tenant_invite_email', label: 'Email inquilino' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type="email"
                name={f.name}
                value={tenancy[f.name]}
                onChange={handleTen}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a5c]"
              />
            </div>
          ))}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1 flex items-center justify-center gap-1">
              <ChevronLeft size={16} /> Indietro
            </button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Spinner size="sm" />} Crea locazione
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
