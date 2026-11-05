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
    { label: 'Total Users', value: stats.stats?.users?.total ?? '—', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Users', value: stats.stats?.users?.active ?? '—', icon: UserCheck, color: 'text-[#4D9274]', bg: 'bg-[#E8F0EA]' },
    { label: 'Pending Apps', value: stats.stats?.companions?.pending ?? '—', icon: Clock, color: 'text-[#D9A45B]', bg: 'bg-orange-50' },
    { label: 'Approved Companions', value: stats.stats?.companions?.approved ?? '—', icon: ShieldCheck, color: 'text-[#236B63]', bg: 'bg-[#E8F0EA]' },
    { label: 'Open Reports', value: stats.stats?.reports?.open ?? '—', icon: AlertCircle, color: 'text-[#D76D6D]', bg: 'bg-red-50' },
    { label: 'Total Connections', value: stats.stats?.connections?.total ?? '—', icon: Flag, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-manrope font-bold text-2xl text-[#24332F]">Dashboard</h1>
          <p className="text-[#77817C] text-sm mt-1">Platform overview and key metrics</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {kpis.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#E8EAE6] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon size={18} className={color} />
                </div>
              </div>
              <div className="font-manrope font-bold text-3xl text-[#24332F] mb-1">
                {isLoading ? <div className="skeleton h-8 w-16 rounded" /> : value}
              </div>
              <p className="text-sm text-[#77817C]">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#E8EAE6] p-5">
            <h2 className="font-manrope font-semibold text-[#24332F] mb-4">Recent Users</h2>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
            ) : (stats.recent_users ?? []).length === 0 ? (
              <p className="text-sm text-[#A1AAA5] text-center py-6">No recent users</p>
            ) : (stats.recent_users ?? []).map((u: { id: string; name: string; email: string; created_at: string }) => (
              <div key={u.id} className="flex items-center gap-3 py-2.5 border-b border-[#E8EAE6] last:border-0">
                <div className="w-9 h-9 rounded-full bg-[#A8C5B5] flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#24332F] truncate">{u.name}</p>
                  <p className="text-xs text-[#A1AAA5] truncate">{u.email}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#E8EAE6] p-5">
            <h2 className="font-manrope font-semibold text-[#24332F] mb-4">Pending Applications</h2>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
            ) : (stats.pending_applications ?? []).length === 0 ? (
              <p className="text-sm text-[#A1AAA5] text-center py-6">No pending applications</p>
            ) : (stats.pending_applications ?? []).map((app: { id: string; user_name: string; legal_name: string; status: string; submitted: string }) => (
              <div key={app.id} className="flex items-center gap-3 py-2.5 border-b border-[#E8EAE6] last:border-0">
                <div className="w-9 h-9 rounded-full bg-[#E8F0EA] flex items-center justify-center">
                  <ShieldCheck size={16} className="text-[#236B63]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#24332F] truncate">{app.user_name ?? app.legal_name}</p>
                  <p className="text-xs text-[#D9A45B]">{app.submitted} · Awaiting review</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
