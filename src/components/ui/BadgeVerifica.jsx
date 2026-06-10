import { ShieldCheck, ShieldAlert } from 'lucide-react'

export default function BadgeVerifica({ level = 0 }) {
  if (level >= 1) {
    return (
      <span className="badge-verified inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] font-medium">
        <ShieldCheck size={12} /> Verificato
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
      <ShieldAlert size={12} /> Non verificato
    </span>
  )
}
