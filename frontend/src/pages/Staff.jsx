import { useState, useEffect } from 'react'
import { staffApi } from '../api/staff'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import { Plus, X } from 'lucide-react'

function initials(name) {
  return (name ?? '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'front_desk', shift: 'morning' }

const inputCls  = 'w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400'
const selectCls = `${inputCls} bg-white`

function AddStaffModal({ onClose, onCreated }) {
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await staffApi.create(form)
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to create staff member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add Staff Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
              className={inputCls} placeholder="Jane Smith" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              className={inputCls} placeholder="jane@hotel.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input type="password" required value={form.password} onChange={e => set('password', e.target.value)}
              className={inputCls} placeholder="Min 6 characters" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className={selectCls}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="front_desk">Front Desk</option>
                <option value="housekeeping">Housekeeping</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift</label>
              <select value={form.shift} onChange={e => set('shift', e.target.value)} className={selectCls}>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Adding…' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Staff() {
  const { user }  = useAuth()
  const canManage = ['admin', 'manager'].includes(user?.role)

  const [staff,     setStaff]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    try {
      const res = await staffApi.list()
      setStaff(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('Remove this staff member?')) return
    try {
      await staffApi.delete(id)
      setStaff(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      alert(err.response?.data?.error ?? 'Failed to delete')
    }
  }

  if (loading) return <div className="p-6"><Spinner /></div>

  return (
    <div className="p-6">
      {showModal && (
        <AddStaffModal
          onClose={() => setShowModal(false)}
          onCreated={member => setStaff(prev => [...prev, member])}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{staff.length} members</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} />
            Add Staff
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60">
              {['Name', 'Email', 'Role', 'Shift', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {staff.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      {initials(s.name)}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{s.email}</td>
                <td className="px-5 py-3.5"><Badge status={s.role} /></td>
                <td className="px-5 py-3.5"><Badge status={s.shift} /></td>
                <td className="px-5 py-3.5">
                  {canManage && (
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium">Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {staff.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">No staff members</p>}
      </div>
    </div>
  )
}
