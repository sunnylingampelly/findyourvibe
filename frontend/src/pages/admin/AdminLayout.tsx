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
    <div className="w-full min-h-screen bg-[#F4F6F8] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E8EAE6] flex flex-col shrink-0 shadow-sm">
        <div className="p-6 border-b border-[#E8EAE6]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#194E49] to-[#4D9274] rounded-xl flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <div>
              <span className="font-manrope font-bold text-sm text-[#24332F]">Find Your Vibe</span>
              <p className="text-[10px] text-[#A1AAA5]">Admin Panel</p>
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
                isActive ? 'bg-[#E8F0EA] text-[#236B63]' : 'text-[#77817C] hover:bg-[#F4F1EA]'
              )}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-[#E8EAE6]">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#D76D6D] hover:bg-red-50 w-full transition-colors">
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
