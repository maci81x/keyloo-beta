import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../lib/auth'
import Spinner from '../components/ui/Spinner'

export default function RegisterPage() {
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await signUp(form)
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm text-center space-y-3">
        <h2 className="text-xl font-bold text-[#10b981]">Registrazione completata!</h2>
        <p className="text-sm text-gray-600">Controlla la tua email per confermare l'account.</p>
        <button onClick={() => navigate('/login')} className="btn-primary w-full">Vai al login</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#1a3a5c] mb-6 text-center">Crea account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'nome', label: 'Nome' },
            { name: 'cognome', label: 'Cognome' },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'password', label: 'Password', type: 'password' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a5c]"
              />
            </div>
          ))}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" />} Registrati
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Hai già un account?{' '}
          <Link to="/login" className="text-[#1a3a5c] font-medium hover:underline">Accedi</Link>
        </p>
      </div>
    </div>
  )
}
