import { useState, useEffect } from 'react'
import { reservationsApi } from '../api/reservations'
import { guestsApi } from '../api/guests'
import { roomsApi } from '../api/rooms'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import { Plus, Search, X } from 'lucide-react'

const STATUS_FILTERS = ['all', 'confirmed', 'checked_in', 'checked_out', 'cancelled']
const STATUS_LABELS  = { all: 'All', confirmed: 'Confirmed', checked_in: 'Checked In', checked_out: 'Checked Out', cancelled: 'Cancelled' }

const today    = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

const inputCls  = 'w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white'
const selectCls = `${inputCls} bg-white`

function NewReservationModal({ onClose, onCreated }) {
  const [guests,   setGuests]   = useState([])
  const [rooms,    setRooms]    = useState([])
  const [form,     setForm]     = useState({ guestId: '', roomId: '', checkIn: today, checkOut: tomorrow, adults: 1, children: 0, notes: '' })
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    Promise.all([guestsApi.list(), roomsApi.list()])
      .then(([g, r]) => {
        setGuests(g.data)
        setRooms(r.data)
        if (g.data.length > 0) setForm(f => ({ ...f, guestId: String(g.data[0].id) }))
        if (r.data.length > 0) setForm(f => ({ ...f, roomId:  String(r.data[0].id) }))
      })
      .catch(console.error)
      .finally(() => setFetching(false))
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await reservationsApi.create({
        guestId:  parseInt(form.guestId),
        roomId:   parseInt(form.roomId),
        checkIn:  form.checkIn,
        checkOut: form.checkOut,
        adults:   parseInt(form.adults),
        children: parseInt(form.children),
        notes:    form.notes || undefined,
      })
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to create reservation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">New Reservation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}
          {fetching
            ? <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" /></div>
            : <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guest *</label>
                <select required value={form.guestId} onChange={e => set('guestId', e.target.value)} className={selectCls}>
                  {guests.length === 0 && <option value="">No guests — add one first</option>}
                  {guests.map(g => <option key={g.id} value={g.id}>{g.name} ({g.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room *</label>
                <select required value={form.roomId} onChange={e => set('roomId', e.target.value)} className={selectCls}>
                  {rooms.length === 0 && <option value="">No rooms — add one first</option>}
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} — {r.roomType?.name} (${parseFloat(r.roomType?.basePrice ?? 0)}/night) [{r.status}]
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Check-in *</label>
                  <input type="date" required value={form.checkIn} onChange={e => set('checkIn', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Check-out *</label>
                  <input type="date" required value={form.checkOut} onChange={e => set('checkOut', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adults</label>
                  <input type="number" min="1" value={form.adults} onChange={e => set('adults', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Children</label>
                  <input type="number" min="0" value={form.children} onChange={e => set('children', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                  className={`${inputCls} resize-none`} placeholder="Special requests…" />
              </div>
            </>
          }
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading || fetching || guests.length === 0 || rooms.length === 0}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Creating…' : 'Create Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Reservations() {
  const { user }  = useAuth()
  const canManage = ['admin', 'manager'].includes(user?.role)

  const [reservations, setReservations] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal,    setShowModal]    = useState(false)

  async function load() {
    try {
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await reservationsApi.list(params)
      setReservations(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  async function doAction(fn) {
    try { await fn(); load() }
    catch (err) { alert(err.response?.data?.error ?? 'Action failed') }
  }

  const filtered = reservations.filter(r =>
    (r.guest?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.room?.roomNumber ?? '').includes(search)
  )

  if (loading) return <div className="p-6"><Spinner /></div>

  return (
    <div className="p-6">
      {showModal && (
        <NewReservationModal
          onClose={() => setShowModal(false)}
          onCreated={r => { setReservations(prev => [r, ...prev]); setShowModal(false) }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{reservations.length} total</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} />
            New Reservation
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input type="text" placeholder="Search guest or room…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56 dark:bg-slate-800 dark:text-white dark:placeholder-gray-500" />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>{STATUS_LABELS[f]}</button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60">
              {['Guest', 'Room', 'Check-in', 'Check-out', 'Nights', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {filtered.map(r => {
              const nights = Math.ceil((new Date(r.checkOut) - new Date(r.checkIn)) / (1000 * 60 * 60 * 24))
              return (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900 dark:text-white">{r.guest?.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {r.adults} adult{r.adults !== 1 ? 's' : ''}
                      {r.children > 0 ? `, ${r.children} child${r.children !== 1 ? 'ren' : ''}` : ''}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900 dark:text-white">{r.room?.roomNumber}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{r.room?.roomType?.name}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs font-mono">{r.checkIn?.slice(0, 10)}</td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs font-mono">{r.checkOut?.slice(0, 10)}</td>
                  <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{nights}</td>
                  <td className="px-5 py-3.5"><Badge status={r.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-3">
                      {r.status === 'confirmed'  && <button onClick={() => doAction(() => reservationsApi.checkIn(r.id))}  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">Check In</button>}
                      {r.status === 'checked_in' && <button onClick={() => doAction(() => reservationsApi.checkOut(r.id))} className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium">Check Out</button>}
                      {r.status === 'confirmed'  && canManage && <button onClick={() => doAction(() => reservationsApi.cancel(r.id))} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium">Cancel</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">No reservations</p>}
      </div>
    </div>
  )
}
