import { useState, useEffect } from 'react'
import { roomsApi } from '../api/rooms'
import { reservationsApi } from '../api/reservations'
import { housekeepingApi } from '../api/housekeeping'
import { billingApi } from '../api/billing'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import Spinner from '../components/Spinner'

export default function Dashboard() {
  const [rooms,        setRooms]        = useState([])
  const [arrivals,     setArrivals]     = useState([])
  const [departures,   setDepartures]   = useState([])
  const [pendingTasks, setPendingTasks] = useState([])
  const [revenue,      setRevenue]      = useState(0)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const [roomsRes, resRes, tasksRes, invoicesRes] = await Promise.all([
          roomsApi.list(),
          reservationsApi.list(),
          housekeepingApi.list({ status: 'pending' }),
          billingApi.list({ status: 'paid' }),
        ])
        setRooms(roomsRes.data)
        const all = resRes.data
        setArrivals(all.filter(r => r.checkIn?.slice(0, 10) === today && r.status === 'confirmed'))
        setDepartures(all.filter(r => r.checkOut?.slice(0, 10) === today && r.status === 'checked_in'))
        setPendingTasks(tasksRes.data)
        setRevenue(invoicesRes.data.reduce((s, i) => s + parseFloat(i.total ?? 0), 0))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-6"><Spinner /></div>

  const occupied  = rooms.filter(r => r.status === 'occupied').length
  const available = rooms.filter(r => r.status === 'available').length
  const cleaning  = rooms.filter(r => r.status === 'cleaning').length
  const total     = rooms.length || 1

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{dateLabel}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Rooms"    value={rooms.length}                  sub="across all floors"    color="slate"  />
        <StatCard label="Occupied"       value={occupied}                      sub={`${Math.round(occupied/total*100)}% occupancy`} color="red" />
        <StatCard label="Available"      value={available}                     sub="ready to book"        color="emerald"/>
        <StatCard label="Cleaning"       value={cleaning}                      sub="in progress"          color="amber"  />
        <StatCard label="Arrivals Today" value={arrivals.length}               sub="check-ins expected"   color="blue"   />
        <StatCard label="Revenue"        value={`$${revenue.toLocaleString()}`} sub="paid invoices"      color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Today's Arrivals</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{arrivals.length} expected</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            {arrivals.length === 0 && <p className="px-5 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">No arrivals today</p>}
            {arrivals.map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{r.guest?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Room {r.room?.roomNumber} · {r.room?.roomType?.name}</p>
                </div>
                <Badge status="confirmed" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Today's Departures</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{departures.length} due today</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            {departures.length === 0 && <p className="px-5 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">No departures today</p>}
            {departures.map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{r.guest?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Room {r.room?.roomNumber}</p>
                </div>
                <Badge status="checked_in" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Active Housekeeping</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{pendingTasks.length} tasks pending</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            {pendingTasks.length === 0 && <p className="px-5 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">No pending tasks</p>}
            {pendingTasks.map(t => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Room {t.room?.roomNumber}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t.staff?.name ?? 'Unassigned'} · {t.type}</p>
                </div>
                <div className="flex gap-2">
                  <Badge status={t.priority} />
                  <Badge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Room Overview</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Occupied',  count: occupied,  color: 'bg-red-500'     },
              { label: 'Available', count: available, color: 'bg-emerald-500' },
              { label: 'Cleaning',  count: cleaning,  color: 'bg-amber-500'   },
            ].map(({ label, count, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 dark:text-gray-400">{label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{count} / {rooms.length}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${(count/total)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
