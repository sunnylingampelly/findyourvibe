import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShieldCheck, Star, Flag, Settings, LogOut, FileText
} from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/companions', icon: ShieldCheck, label: 'Companions' },
  { to: '/admin/services', icon: Star, label: 'Services' },
  { to: '/admin/reports', icon: Flag, label: 'Reports' },
  { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } finally { logout(); navigate('/admin/login') }
  }

  return (
    <div className="w-full min-h-screen flex" style={{ background: '#07070A' }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col shrink-0" style={{ background: '#0D0D12', borderRight: '1px solid #2E2E3A' }}>
        <div className="p-6" style={{ borderBottom: '1px solid #2E2E3A' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#C8FF4D' }}>
              <ShieldCheck size={16} style={{ color: '#0A1A00' }} />
            </div>
            <div>
              <span className="font-manrope font-bold text-sm" style={{ color: '#F2F0EB' }}>Find Your Vibe</span>
              <p className="text-[10px]" style={{ color: '#52525E' }}>Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'text-[#C8FF4D]'
                  : 'text-[#52525E] hover:text-[#F2F0EB]'
              )}
              style={({ isActive }) => isActive ? { background: 'rgba(200,255,77,0.1)' } : { background: 'transparent' }}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4" style={{ borderTop: '1px solid #2E2E3A' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-colors"
            style={{ color: '#FF5C7A' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,92,122,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#0D0D12' }}>{children}</main>
    </div>
  )
}
