import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import StarRating from '../ui/StarRating'
import StatoBadge from '../ui/StatoBadge'
import { Flag } from 'lucide-react'

export default function ReviewCard({ review, onContesta }) {
  const avg = Object.values(review.ratings || {}).length
    ? (Object.values(review.ratings).reduce((a, b) => a + b, 0) / Object.values(review.ratings).length).toFixed(1)
    : null

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {avg && <StarRating value={Math.round(avg)} readonly size={16} />}
          <span className="text-sm text-gray-500">{avg && `${avg}/5`}</span>
        </div>
        <StatoBadge stato={review.stato} />
      </div>
      {review.testo && (
        <p className="text-sm text-gray-700">{review.testo}</p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-400">
        {review.published_at && (
          <span>Pubblicata il {format(new Date(review.published_at), 'd MMM yyyy', { locale: it })}</span>
        )}
        {review.stato === 'pubblicata' && onContesta && (
          <button
            onClick={() => onContesta(review)}
            className="flex items-center gap-1 text-red-500 hover:text-red-700"
          >
            <Flag size={12} /> Contesta
          </button>
        )}
      </div>
    </div>
  )
}
