import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Spinner from '../components/ui/Spinner'
import StatoBadge from '../components/ui/StatoBadge'
import { useToast } from '../components/ui/Toast'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const TABS = ['Verifiche', 'Contestazioni', 'Metriche']

export default function AdminPage() {
  const [tab, setTab] = useState(0)
  const [verifiche, setVerifiche] = useState([])
  const [disputes, setDisputes] = useState([])
  const [metriche, setMetriche] = useState(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    async function load() {
      const [verRes, disRes, usersRes, revRes] = await Promise.all([
        supabase.from('identity_verifications').select('*, profiles(nome, cognome, email)').order('created_at', { ascending: false }),
        supabase.from('disputes').select('*, reviews(testo, direction), profiles:opened_by(nome, cognome)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
      ])
      setVerifiche(verRes.data || [])
      setDisputes(disRes.data || [])
      setMetriche({ utenti: usersRes.count, recensioni: revRes.count })
      setLoading(false)
    }
    load()
  }, [])

  async function approvaVerifica(id, profileId) {
    const { error } = await supabase.from('identity_verifications').update({ stato: 'approved', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { showToast('Errore', 'error'); return }
    setVerifiche(prev => prev.map(v => v.id === id ? { ...v, stato: 'approved' } : v))
    showToast('Verifica approvata', 'success')
  }

  async function rifiutaVerifica(id) {
    const { error } = await supabase.from('identity_verifications').update({ stato: 'rejected', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { showToast('Errore', 'error'); return }
    setVerifiche(prev => prev.map(v => v.id === id ? { ...v, stato: 'rejected' } : v))
    showToast('Verifica rifiutata', 'info')
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#1a3a5c]">Admin</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === i ? 'bg-white text-[#1a3a5c] shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="space-y-3">
          {verifiche.length === 0 && <p className="text-gray-500 text-sm text-center py-8">Nessuna verifica.</p>}
          {verifiche.map(v => (
            <div key={v.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800">{v.profiles?.nome} {v.profiles?.cognome}</p>
                <StatoBadge stato={v.stato} />
              </div>
              <p className="text-xs text-gray-400">{v.profiles?.email}</p>
              <p className="text-xs text-gray-400">{format(new Date(v.created_at), 'd MMM yyyy HH:mm', { locale: it })}</p>
              {v.stato === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => approvaVerifica(v.id, v.profile_id)} className="btn-primary flex-1 text-sm">Approva</button>
                  <button onClick={() => rifiutaVerifica(v.id)} className="btn-secondary flex-1 text-sm">Rifiuta</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 1 && (
        <div className="space-y-3">
          {disputes.length === 0 && <p className="text-gray-500 text-sm text-center py-8">Nessuna contestazione.</p>}
          {disputes.map(d => (
            <div key={d.id} className="card space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-gray-800">{d.profiles?.nome} {d.profiles?.cognome}</p>
                <StatoBadge stato={d.stato} />
              </div>
              <p className="text-sm text-gray-600">{d.motivo}</p>
              <p className="text-xs text-gray-400">{format(new Date(d.created_at), 'd MMM yyyy', { locale: it })}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 2 && metriche && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-[#1a3a5c]">{metriche.utenti}</p>
            <p className="text-sm text-gray-500 mt-1">Utenti totali</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-[#10b981]">{metriche.recensioni}</p>
            <p className="text-sm text-gray-500 mt-1">Recensioni totali</p>
          </div>
        </div>
      )}
    </div>
  )
}
