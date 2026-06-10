import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import BadgeVerifica from '../components/ui/BadgeVerifica'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../components/ui/Toast'
import { Share2 } from 'lucide-react'

export default function ProfiloPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState({
    nome: profile?.nome || '',
    cognome: profile?.cognome || '',
    telefono: profile?.telefono || '',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })) }

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    setLoading(false)
    if (error) { showToast('Errore salvataggio', 'error'); return }
    await refreshProfile()
    showToast('Profilo aggiornato', 'success')
  }

  async function copyShareLink() {
    const token = profile?.share_token
    if (!token) return
    const url = `${window.location.origin}/p/${token}`
    await navigator.clipboard.writeText(url)
    showToast('Link copiato', 'success')
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center text-xl font-bold">
          {profile?.nome?.[0]}{profile?.cognome?.[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{profile?.nome} {profile?.cognome}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="mt-1"><BadgeVerifica level={profile?.verification_level || 0} /></div>
        </div>
      </div>

      <form onSubmit={handleSave} className="card space-y-4">
        <h2 className="font-semibold text-[#1a3a5c]">Dati personali</h2>
        {[
          { name: 'nome', label: 'Nome' },
          { name: 'cognome', label: 'Cognome' },
          { name: 'telefono', label: 'Telefono' },
        ].map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input
              name={f.name}
              value={form[f.name]}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a5c]"
            />
          </div>
        ))}
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Spinner size="sm" />} Salva
        </button>
      </form>

      <div className="card space-y-3">
        <h2 className="font-semibold text-[#1a3a5c]">Link pubblico</h2>
        <p className="text-sm text-gray-500">Condividi il tuo passaporto reputazionale.</p>
        <button onClick={copyShareLink} className="btn-secondary w-full flex items-center justify-center gap-2">
          <Share2 size={16} /> Copia link
        </button>
      </div>
    </div>
  )
}
