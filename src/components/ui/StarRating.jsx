import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, readonly = false, size = 20 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(n)}
          className={readonly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star
            size={size}
            className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}
