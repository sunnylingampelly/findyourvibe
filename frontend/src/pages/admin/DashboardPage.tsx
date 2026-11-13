import { useQuery } from '@tanstack/react-query'
import { Users, ShieldCheck, Flag, UserCheck, AlertCircle, Clock } from 'lucide-react'
import api from '../../api/client'
import AdminLayout from './AdminLayout'

interface KPI { label: string; value: number | string; icon: React.ElementType; color: string; bg: string }

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard'),
    refetchInterval: 60000,
  })

  const stats = data?.data?.data ?? {}

  const kpis: KPI[] = [
    { label: 'Total Users', value: stats.stats?.users?.total ?? '—', icon: Users, color: '#8B7CFF', bg: 'rgba(139,124,255,0.12)' },
    { label: 'Active Users', value: stats.stats?.users?.active ?? '—', icon: UserCheck, color: '#C8FF4D', bg: 'rgba(200,255,77,0.12)' },
    { label: 'Pending Apps', value: stats.stats?.companions?.pending ?? '—', icon: Clock, color: '#FF9F43', bg: 'rgba(255,159,67,0.12)' },
    { label: 'Approved Companions', value: stats.stats?.companions?.approved ?? '—', icon: ShieldCheck, color: '#C8FF4D', bg: 'rgba(200,255,77,0.12)' },
    { label: 'Open Reports', value: stats.stats?.reports?.open ?? '—', icon: AlertCircle, color: '#FF5C7A', bg: 'rgba(255,92,122,0.12)' },
    { label: 'Total Connections', value: stats.stats?.connections?.total ?? '—', icon: Flag, color: '#8B7CFF', bg: 'rgba(139,124,255,0.12)' },
  ]

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-manrope font-bold text-2xl" style={{ color: '#F2F0EB' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#8B8B9A' }}>Platform overview and key metrics</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {kpis.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl p-5" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={18} style={{ color }} />
                </div>
              </div>
              <div className="font-manrope font-bold text-3xl mb-1" style={{ color: '#F2F0EB' }}>
                {isLoading ? <div className="h-8 w-16 rounded animate-pulse" style={{ background: '#252530' }} /> : value}
              </div>
              <p className="text-sm" style={{ color: '#8B8B9A' }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-2xl p-5" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
            <h2 className="font-manrope font-semibold mb-4" style={{ color: '#F2F0EB' }}>Recent Users</h2>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: '#1C1C22' }} />)}</div>
            ) : (stats.recent_users ?? []).length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#52525E' }}>No recent users</p>
            ) : (stats.recent_users ?? []).map((u: { id: string; name: string; email: string; created_at: string }) => (
              <div key={u.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid #2E2E3A' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(200,255,77,0.15)', color: '#C8FF4D' }}>{u.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#F2F0EB' }}>{u.name}</p>
                  <p className="text-xs truncate" style={{ color: '#52525E' }}>{u.email}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
            <h2 className="font-manrope font-semibold mb-4" style={{ color: '#F2F0EB' }}>Pending Applications</h2>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: '#1C1C22' }} />)}</div>
            ) : (stats.pending_applications ?? []).length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#52525E' }}>No pending applications</p>
            ) : (stats.pending_applications ?? []).map((app: { id: string; user_name: string; legal_name: string; status: string; submitted: string }) => (
              <div key={app.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid #2E2E3A' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(200,255,77,0.12)' }}>
                  <ShieldCheck size={16} style={{ color: '#C8FF4D' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#F2F0EB' }}>{app.user_name ?? app.legal_name}</p>
                  <p className="text-xs" style={{ color: '#FF9F43' }}>{app.submitted} · Awaiting review</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
