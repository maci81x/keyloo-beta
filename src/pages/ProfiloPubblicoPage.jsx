import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BadgeVerifica from '../components/ui/BadgeVerifica'
import StarRating from '../components/ui/StarRating'
import Spinner from '../components/ui/Spinner'

export default function ProfiloPubblicoPage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase.rpc('get_public_profile', { p_token: token }).then(({ data: d, error }) => {
      if (error || !d) { setNotFound(true) }
      else { setData(d) }
      setLoading(false)
    })
  }, [token])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="card text-center p-10 max-w-sm">
        <p className="text-gray-500">Profilo non trovato o link scaduto.</p>
      </div>
    </div>
  )

  const reviews = data.reviews || []
  const avgScore = reviews.length
    ? (reviews.reduce((sum, r) => {
        const vals = Object.values(r.ratings || {})
        return sum + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0)
      }, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-5">
        <div className="card text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center text-2xl font-bold mx-auto">
            {data.nome?.[0]}{data.cognome?.[0]}
          </div>
          <h1 className="text-xl font-bold text-gray-800">{data.nome} {data.cognome}</h1>
          <BadgeVerifica level={data.verification_level} />
          {avgScore && (
            <div className="flex items-center justify-center gap-2">
              <StarRating value={Math.round(avgScore)} readonly />
              <span className="font-semibold">{avgScore}/5</span>
              <span className="text-gray-500 text-sm">({reviews.length} recensioni)</span>
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-700">Recensioni</h2>
            {reviews.map((r, i) => {
              const vals = Object.values(r.ratings || {})
              const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null
              return (
                <div key={i} className="card space-y-2">
                  <div className="flex items-center gap-2">
                    {avg && <StarRating value={Math.round(avg)} readonly size={14} />}
                    <span className="text-xs text-gray-500">{avg}/5</span>
                    <span className="text-xs text-gray-400 capitalize ml-auto">
                      {r.direction === 'tenant_to_landlord' ? 'Come proprietario' : 'Come inquilino'}
                    </span>
                  </div>
                  {r.testo && <p className="text-sm text-gray-700">{r.testo}</p>}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Powered by <span className="font-semibold text-[#1a3a5c]">Keyloo</span>
        </p>
      </div>
    </div>
  )
}
