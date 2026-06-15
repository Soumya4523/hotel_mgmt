import { useState, useEffect } from 'react'
import { billingApi } from '../api/billing'
import { reservationsApi } from '../api/reservations'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import { Plus, X } from 'lucide-react'

const inputCls  = 'w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white'
const selectCls = `${inputCls} bg-white`

function GenerateInvoiceModal({ onClose, onCreated }) {
  const [reservations, setReservations] = useState([])
  const [form,         setForm]         = useState({ reservationId: '', discountAmount: '' })
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [fetching,     setFetching]     = useState(true)

  useEffect(() => {
    reservationsApi.list()
      .then(res => {
        const eligible = res.data.filter(r => ['checked_in', 'checked_out'].includes(r.status))
        setReservations(eligible)
        if (eligible.length > 0) setForm(f => ({ ...f, reservationId: String(eligible[0].id) }))
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
      const payload = { reservationId: parseInt(form.reservationId) }
      if (form.discountAmount) payload.discountAmount = parseFloat(form.discountAmount)
      const res = await billingApi.create(payload)
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to generate invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Generate Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}
          {fetching
            ? <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" /></div>
            : <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reservation *</label>
                {reservations.length === 0
                  ? <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                      No eligible reservations. Check-in a guest first.
                    </p>
                  : <select required value={form.reservationId} onChange={e => set('reservationId', e.target.value)} className={selectCls}>
                      {reservations.map(r => (
                        <option key={r.id} value={r.id}>
                          #{r.id} — {r.guest?.name} · Room {r.room?.roomNumber} [{r.status}]
                        </option>
                      ))}
                    </select>
                }
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Amount (optional)</label>
                <input type="number" min="0" step="0.01" value={form.discountAmount}
                  onChange={e => set('discountAmount', e.target.value)}
                  className={inputCls} placeholder="0.00" />
              </div>
            </>
          }
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading || fetching || reservations.length === 0}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Generating…' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Billing() {
  const { user }  = useAuth()
  const canManage = ['admin', 'manager'].includes(user?.role)

  const [invoices,  setInvoices]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    try {
      const res = await billingApi.list()
      setInvoices(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleMarkPaid(inv) {
    const alreadyPaid = (inv.payments ?? []).reduce((s, p) => s + parseFloat(p.amount), 0)
    const remaining   = parseFloat(inv.total) - alreadyPaid
    if (remaining <= 0) return
    try {
      await billingApi.addPayment(inv.id, { amount: remaining, method: 'card' })
      load()
    } catch (err) {
      alert(err.response?.data?.error ?? 'Failed to record payment')
    }
  }

  async function handleVoid(inv) {
    if (!confirm(`Void invoice #${inv.id}?`)) return
    try {
      await billingApi.void(inv.id)
      load()
    } catch (err) {
      alert(err.response?.data?.error ?? 'Failed to void invoice')
    }
  }

  if (loading) return <div className="p-6"><Spinner /></div>

  const paid        = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total), 0)
  const outstanding = invoices.filter(i => i.status === 'issued').reduce((s, i) => s + parseFloat(i.total), 0)
  const drafts      = invoices.filter(i => i.status === 'draft').length

  return (
    <div className="p-6">
      {showModal && (
        <GenerateInvoiceModal
          onClose={() => setShowModal(false)}
          onCreated={inv => { setInvoices(prev => [inv, ...prev]); setShowModal(false) }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{invoices.length} invoices</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} />
            Generate Invoice
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Total</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{invoices.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Paid</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">${paid.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Outstanding</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">${outstanding.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Drafts</p>
          <p className="text-2xl font-bold text-gray-400 dark:text-gray-500 mt-1">{drafts}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60">
              {['#', 'Guest', 'Room', 'Subtotal', 'Tax', 'Total', 'Status', 'Issued', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">{inv.id}</td>
                <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{inv.reservation?.guest?.name ?? '—'}</td>
                <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">{inv.reservation?.room?.roomNumber ?? '—'}</td>
                <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">${parseFloat(inv.subtotal).toFixed(2)}</td>
                <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300">${parseFloat(inv.tax).toFixed(2)}</td>
                <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">${parseFloat(inv.total).toFixed(2)}</td>
                <td className="px-5 py-3.5"><Badge status={inv.status} /></td>
                <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                  {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-5 py-3.5">
                  {canManage && (
                    <div className="flex items-center gap-3">
                      {inv.status === 'issued' && (
                        <button onClick={() => handleMarkPaid(inv)} className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium">Mark Paid</button>
                      )}
                      {(inv.status === 'issued' || inv.status === 'draft') && (
                        <button onClick={() => handleVoid(inv)} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium">Void</button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">No invoices yet</p>}
      </div>
    </div>
  )
}
