import { useState, useEffect } from 'react'
import { guestsApi } from '../api/guests'
import { useAuth } from '../context/AuthContext'
import { Search, Plus, Star, X } from 'lucide-react'
import Spinner from '../components/Spinner'

function initials(name) {
  return (name ?? '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const EMPTY = { name: '', email: '', phone: '', idNumber: '' }

const inputCls = 'w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400'

function AddGuestModal({ onClose, onCreated }) {
  const [form,    setForm]    = useState(EMPTY)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await guestsApi.create(form)
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to add guest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add Guest</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
            <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
              className={inputCls} placeholder="James Wilson" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              className={inputCls} placeholder="guest@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)}
                className={inputCls} placeholder="+1 555-0101" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID / Passport</label>
              <input type="text" value={form.idNumber} onChange={e => set('idNumber', e.target.value)}
                className={inputCls} placeholder="P1234567" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Adding…' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Guests() {
  const { user }  = useAuth()
  const canManage = ['admin', 'manager'].includes(user?.role)

  const [guests,    setGuests]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    guestsApi.list()
      .then(res => setGuests(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = guests.filter(g =>
    (g.name  ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (g.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-6"><Spinner /></div>

  return (
    <div className="p-6">
      {showModal && (
        <AddGuestModal
          onClose={() => setShowModal(false)}
          onCreated={g => setGuests(prev => [...prev, g])}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{guests.length} registered</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} />
            Add Guest
          </button>
        )}
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input type="text" placeholder="Search by name or email…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white dark:placeholder-gray-500" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60">
              {['Guest', 'Contact', 'ID Number', 'Loyalty Points', 'Member Since'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {filtered.map(g => (
              <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                      {initials(g.name)}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">{g.name}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-gray-700 dark:text-gray-300">{g.email}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{g.phone}</p>
                </td>
                <td className="px-5 py-3.5 font-mono text-gray-500 dark:text-gray-400 text-xs">{g.idNumber ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{(g.loyaltyPoints ?? 0).toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                  {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-5 py-3.5"></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">No guests found</p>}
      </div>
    </div>
  )
}
