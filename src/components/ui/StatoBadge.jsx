const colori = {
  proposta: 'bg-blue-100 text-blue-700',
  confermata: 'bg-indigo-100 text-indigo-700',
  attiva: 'bg-[#10b981]/10 text-[#10b981]',
  chiusa: 'bg-gray-100 text-gray-600',
  bozza: 'bg-gray-100 text-gray-500',
  depositata: 'bg-yellow-100 text-yellow-700',
  pubblicata: 'bg-[#10b981]/10 text-[#10b981]',
  contestata: 'bg-red-100 text-red-700',
  sospesa: 'bg-orange-100 text-orange-700',
  archiviata: 'bg-gray-100 text-gray-400',
}

export default function StatoBadge({ stato }) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colori[stato] || 'bg-gray-100 text-gray-500'}`}>
      {stato}
    </span>
  )
}
