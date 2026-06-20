import { useState, useEffect } from 'react'
import { roomsApi } from '../api/rooms'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'
import { BedDouble, Plus, X } from 'lucide-react'

const STATUS_FILTERS = ['all', 'available', 'occupied', 'cleaning']
const FLOOR_FILTERS  = ['all', '1', '2', '3']

const inputCls = 'w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white'
const selectCls = `${inputCls} bg-white`

function AddRoomModal({ onClose, onCreated }) {
  const [types,    setTypes]    = useState([])
  const [step,     setStep]     = useState('loading') // 'loading' | 'create-type' | 'room'
  const [typeForm, setTypeForm] = useState({ name: '', basePrice: '', maxOccupancy: '2' })
  const [roomForm, setRoomForm] = useState({ roomNumber: '', floor: '1', roomTypeId: '' })
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    roomsApi.listTypes()
      .then(r => {
        setTypes(r.data)
        if (r.data.length > 0) {
          setRoomForm(f => ({ ...f, roomTypeId: String(r.data[0].id) }))
          setStep('room')
        } else {
          setStep('create-type')
        }
      })
      .catch(() => setStep('create-type'))
  }, [])

  function setT(k, v) { setTypeForm(f => ({ ...f, [k]: v })) }
  function setR(k, v) { setRoomForm(f => ({ ...f, [k]: v })) }

  async function handleCreateType(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await roomsApi.createType({
        name:         typeForm.name,
        basePrice:    parseFloat(typeForm.basePrice),
        maxOccupancy: parseInt(typeForm.maxOccupancy),
      })
      const newType = res.data
      setTypes(prev => [...prev, newType])
      setRoomForm(f => ({ ...f, roomTypeId: String(newType.id) }))
      setStep('room')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to create room type')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateRoom(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await roomsApi.create({
        roomNumber: roomForm.roomNumber,
        floor:      parseInt(roomForm.floor),
        roomTypeId: parseInt(roomForm.roomTypeId),
      })
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to add room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {step === 'create-type' ? 'Create Room Type' : 'Add Room'}
            </h2>
            {step === 'create-type' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Step 1 of 2 — no room types exist yet</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
        </div>

        {step === 'loading' && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
          </div>
        )}

        {step === 'create-type' && (
          <form onSubmit={handleCreateType} className="px-6 py-5 space-y-4">
            {error && <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type Name *</label>
              <input type="text" required value={typeForm.name} onChange={e => setT('name', e.target.value)}
                className={inputCls} placeholder="Standard, Deluxe, Suite…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price / Night *</label>
                <input type="number" required min="1" step="0.01" value={typeForm.basePrice} onChange={e => setT('basePrice', e.target.value)}
                  className={inputCls} placeholder="99.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Occupancy *</label>
                <input type="number" required min="1" max="10" value={typeForm.maxOccupancy} onChange={e => setT('maxOccupancy', e.target.value)}
                  className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button type="submit" disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {loading ? 'Creating…' : 'Create & Continue →'}
              </button>
            </div>
          </form>
        )}

        {step === 'room' && (
          <form onSubmit={handleCreateRoom} className="px-6 py-5 space-y-4">
            {error && <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Number *</label>
                <input type="text" required value={roomForm.roomNumber} onChange={e => setR('roomNumber', e.target.value)}
                  className={inputCls} placeholder="101" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Floor *</label>
                <input type="number" required min="1" max="50" value={roomForm.floor} onChange={e => setR('floor', e.target.value)}
                  className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Type *</label>
              <select required value={roomForm.roomTypeId} onChange={e => setR('roomTypeId', e.target.value)} className={selectCls}>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — ${parseFloat(t.basePrice)}/night</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Need a new type?{' '}
              <button type="button" onClick={() => { setStep('create-type'); setError('') }}
                className="text-indigo-500 hover:text-indigo-700 underline">Create one</button>
            </p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button type="submit" disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {loading ? 'Adding…' : 'Add Room'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Rooms() {
  const { user }  = useAuth()
  const canManage = ['admin', 'manager'].includes(user?.role)

  const [rooms,        setRooms]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [floorFilter,  setFloorFilter]  = useState('all')
  const [showModal,    setShowModal]    = useState(false)

  async function load() {
    try {
      const res = await roomsApi.list()
      setRooms(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleStatusChange(id, status) {
    try {
      await roomsApi.updateStatus(id, status)
      setRooms(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch (err) {
      alert(err.response?.data?.error ?? 'Failed to update status')
    }
  }

  const filtered = rooms.filter(r => {
    const okStatus = statusFilter === 'all' || r.status === statusFilter
    const okFloor  = floorFilter  === 'all' || String(r.floor) === floorFilter
    return okStatus && okFloor
  })

  if (loading) return <div className="p-6"><Spinner /></div>

  return (
    <div className="p-6">
      {showModal && (
        <AddRoomModal
          onClose={() => setShowModal(false)}
          onCreated={room => { setRooms(prev => [...prev, room]); setShowModal(false) }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rooms</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{rooms.length} rooms total</p>
        </div>
        {canManage && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} />
            Add Room
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                statusFilter === f
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>{f}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
          {FLOOR_FILTERS.map(f => (
            <button key={f} onClick={() => setFloorFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                floorFilter === f
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>{f === 'all' ? 'All Floors' : `Floor ${f}`}</button>
          ))}
        </div>
        <span className="self-center text-sm text-gray-400 dark:text-gray-500">{filtered.length} rooms</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filtered.map(room => {
          const borderColor = room.status === 'occupied' ? 'border-red-200 dark:border-red-900/60'   : room.status === 'cleaning' ? 'border-amber-200 dark:border-amber-900/60'  : 'border-emerald-200 dark:border-emerald-900/60'
          const iconBg      = room.status === 'occupied' ? 'bg-red-100 dark:bg-red-900/30'       : room.status === 'cleaning' ? 'bg-amber-100 dark:bg-amber-900/30'      : 'bg-emerald-100 dark:bg-emerald-900/30'
          const iconColor   = room.status === 'occupied' ? 'text-red-600 dark:text-red-400'     : room.status === 'cleaning' ? 'text-amber-600 dark:text-amber-400'    : 'text-emerald-600 dark:text-emerald-400'
          return (
            <div key={room.id} className={`bg-white dark:bg-slate-800 rounded-xl border-2 p-4 ${borderColor}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                  <BedDouble size={15} className={iconColor} />
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">F{room.floor}</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-white text-xl leading-none">{room.roomNumber}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">{room.roomType?.name}</p>
              <Badge status={room.status} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">${parseFloat(room.roomType?.basePrice ?? 0)}/night</p>
              {canManage && (
                <select value={room.status} onChange={e => handleStatusChange(room.id, e.target.value)}
                  className="mt-2 w-full text-xs border border-gray-200 dark:border-slate-600 rounded-md px-1 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-16">No rooms match filters</p>}
    </div>
  )
}
