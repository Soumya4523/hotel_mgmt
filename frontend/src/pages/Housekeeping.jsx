import { useState, useEffect } from 'react'
import { housekeepingApi } from '../api/housekeeping'
import { roomsApi } from '../api/rooms'
import { staffApi } from '../api/staff'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import { Plus, X } from 'lucide-react'

const COLUMNS = [
  { key: 'pending',     label: 'Pending',     headerColor: 'text-amber-700 dark:text-amber-400',   countBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'    },
  { key: 'in_progress', label: 'In Progress', headerColor: 'text-blue-700 dark:text-blue-400',    countBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'      },
  { key: 'done',        label: 'Done',        headerColor: 'text-emerald-700 dark:text-emerald-400', countBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
]

const inputCls  = 'w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white'
const selectCls = `${inputCls} bg-white`

function NewTaskModal({ onClose, onCreated }) {
  const [rooms,    setRooms]    = useState([])
  const [staff,    setStaff]    = useState([])
  const [form,     setForm]     = useState({ roomId: '', type: 'clean', priority: 'normal', assignedTo: '', notes: '' })
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    Promise.all([roomsApi.list(), staffApi.list()])
      .then(([r, s]) => {
        setRooms(r.data)
        setStaff(s.data)
        if (r.data.length > 0) setForm(f => ({ ...f, roomId: String(r.data[0].id) }))
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
      const payload = {
        roomId:   parseInt(form.roomId),
        type:     form.type,
        priority: form.priority,
        notes:    form.notes || undefined,
      }
      if (form.assignedTo) payload.assignedTo = parseInt(form.assignedTo)
      const res = await housekeepingApi.create(payload)
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}
          {fetching
            ? <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" /></div>
            : <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room *</label>
                <select required value={form.roomId} onChange={e => set('roomId', e.target.value)} className={selectCls}>
                  {rooms.length === 0 && <option value="">No rooms available</option>}
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.roomNumber} — Floor {r.floor} [{r.status}]</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Type *</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} className={selectCls}>
                    <option value="clean">Clean</option>
                    <option value="inspect">Inspect</option>
                    <option value="restock">Restock</option>
                    <option value="repair">Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority *</label>
                  <select value={form.priority} onChange={e => set('priority', e.target.value)} className={selectCls}>
                    <option value="urgent">Urgent</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To (optional)</label>
                <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className={selectCls}>
                  <option value="">Unassigned</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                  className={`${inputCls} resize-none`} placeholder="Additional details…" />
              </div>
            </>
          }
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading || fetching || rooms.length === 0}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Housekeeping() {
  const [tasks,     setTasks]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    try {
      const res = await housekeepingApi.list()
      setTasks(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, status) {
    try {
      await housekeepingApi.updateStatus(id, status)
      load()
    } catch (err) {
      alert(err.response?.data?.error ?? 'Failed to update')
    }
  }

  const byStatus = key => tasks.filter(t => t.status === key)

  if (loading) return <div className="p-6"><Spinner /></div>

  return (
    <div className="p-6">
      {showModal && (
        <NewTaskModal
          onClose={() => setShowModal(false)}
          onCreated={task => { setTasks(prev => [task, ...prev]); setShowModal(false) }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Housekeeping</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{tasks.length} tasks total</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={16} />
          New Task
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {COLUMNS.map(col => {
          const colTasks = byStatus(col.key)
          return (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className={`font-semibold ${col.headerColor}`}>{col.label}</h2>
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${col.countBg}`}>{colTasks.length}</span>
              </div>
              <div className="space-y-3">
                {colTasks.map(task => (
                  <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-gray-900 dark:text-white">Room {task.room?.roomNumber}</p>
                      <Badge status={task.priority} />
                    </div>
                    <div className="flex gap-1.5 mb-3">
                      <Badge status={task.type} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Assigned:</span> {task.staff?.name ?? 'Unassigned'}
                    </p>
                    {task.notes && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">{task.notes}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {task.status === 'pending' && (
                        <button onClick={() => updateStatus(task.id, 'in_progress')}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium border border-blue-200 dark:border-blue-800 rounded px-2 py-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                          Start
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button onClick={() => updateStatus(task.id, 'done')}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800 rounded px-2 py-0.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                          Mark Done
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-300 dark:text-slate-600 mt-2">
                      {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 p-8 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
