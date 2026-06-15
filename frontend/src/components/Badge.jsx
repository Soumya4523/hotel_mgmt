const variants = {
  available:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  occupied:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cleaning:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  checked_in:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  checked_out: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  cancelled:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  done:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  draft:       'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  issued:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  void:        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  admin:       'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  manager:     'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  front_desk:  'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  housekeeping:'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  morning:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  evening:     'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  night:       'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  urgent:      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  normal:      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  low:         'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  clean:       'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  inspect:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  restock:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  repair:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

const labels = {
  checked_in:  'Checked In',
  checked_out: 'Checked Out',
  in_progress: 'In Progress',
  front_desk:  'Front Desk',
}

export default function Badge({ status }) {
  const cls = variants[status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  const label = labels[status] ?? (status.charAt(0).toUpperCase() + status.slice(1))
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
