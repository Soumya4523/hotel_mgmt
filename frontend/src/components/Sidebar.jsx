import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BedDouble, CalendarDays, Users, Sparkles, Receipt, UserCog, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const nav = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/rooms',        icon: BedDouble,        label: 'Rooms'        },
  { to: '/reservations', icon: CalendarDays,     label: 'Reservations' },
  { to: '/guests',       icon: Users,            label: 'Guests'       },
  { to: '/housekeeping', icon: Sparkles,         label: 'Housekeeping' },
  { to: '/billing',      icon: Receipt,          label: 'Billing'      },
  { to: '/staff',        icon: UserCog,          label: 'Staff'        },
]

function initials(name) {
  return (name ?? '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-bold shrink-0">G</div>
          <div>
            <p className="text-sm font-semibold leading-tight">Grand Hotel</p>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold shrink-0">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name ?? '—'}</p>
            <p className="text-[11px] text-slate-400 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="text-slate-400 hover:text-white transition-colors shrink-0"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors shrink-0"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
