const textColor = {
  indigo:  'text-indigo-600 dark:text-indigo-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  red:     'text-red-600 dark:text-red-400',
  amber:   'text-amber-600 dark:text-amber-400',
  blue:    'text-blue-600 dark:text-blue-400',
  slate:   'text-slate-600 dark:text-slate-400',
  gray:    'text-gray-700 dark:text-gray-300',
}

export default function StatCard({ label, value, sub, color = 'indigo' }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1.5 ${textColor[color] ?? 'text-gray-900 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
