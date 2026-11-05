import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, X, ChevronDown } from 'lucide-react'
import api from '../../api/client'
import AdminLayout from './AdminLayout'
import Badge from '../../components/ui/Badge'

interface AdminUser {
  id: string
  name: string
  email: string
  status: string
  is_companion: boolean
  companion_status: string
  city?: string
  country?: string
  joined: string
  onboarding_completed: boolean
  last_active?: string
}

interface UserDetail {
  id: string
  name: string
  email: string
  mobile?: string
  role: string
  status: string
  email_verified_at?: string
  onboarding_completed_at?: string
  last_active_at?: string
  profile?: {
    display_name?: string
    gender?: string
    bio?: string
    is_companion: boolean
    companion_verification_status: string
    avg_rating?: number
    rating_count: number
  }
  interests: string[]
  languages: string[]
  services: string[]
  companion_application?: { id: string; status: string; submitted_at: string }
  joined: string
}

const STATUS_OPTIONS = ['all', 'active', 'suspended'] as const

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, page, statusFilter],
    queryFn: () => api.get('/admin/users', {
      params: {
        search: search || undefined,
        page,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      },
    }),
  })

  const fetchDetail = async (id: string) => {
    const res = await api.get(`/admin/users/${id}`)
    setDetail(res.data.data)
  }

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      if (detail) fetchDetail(detail.id)
    },
  })

  const users: AdminUser[] = data?.data?.data ?? []
  const meta = data?.data?.meta

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-manrope font-bold text-2xl text-[#24332F]">User Management</h1>
            <p className="text-[#77817C] text-sm mt-1">{meta?.total ?? '—'} total users</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8EAE6]">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E8EAE6] flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1AAA5]" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by name or email…"
                className="w-full pl-10 pr-4 py-2 bg-[#FAF9F6] border border-[#E8EAE6] rounded-xl text-sm focus:outline-none focus:border-[#236B63]"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="appearance-none pl-3 pr-8 py-2 bg-[#FAF9F6] border border-[#E8EAE6] rounded-xl text-sm text-[#24332F] focus:outline-none focus:border-[#236B63] cursor-pointer"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1AAA5] pointer-events-none" />
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b border-[#E8EAE6]">
              <tr className="text-left text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Companion</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#E8EAE6]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-[#A1AAA5]">No users found</td></tr>
              ) : users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[#E8EAE6] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                  onClick={() => fetchDetail(u.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#A8C5B5] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#24332F]">{u.name}</p>
                        <p className="text-xs text-[#A1AAA5]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.status === 'active' ? 'success' : u.status === 'suspended' ? 'error' : 'muted'}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.companion_status === 'approved' ? 'verified' : 'muted'}>
                      {u.companion_status ?? 'not_started'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#77817C] text-xs">
                    {[u.city, u.country].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-[#77817C]">{u.joined}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {u.status === 'active' ? (
                        <button
                          onClick={() => updateStatus.mutate({ id: u.id, status: 'suspended' })}
                          className="text-xs text-[#D76D6D] border border-[#D76D6D]/30 px-2.5 py-1 rounded-lg hover:bg-red-50"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatus.mutate({ id: u.id, status: 'active' })}
                          className="text-xs text-[#4D9274] border border-[#4D9274]/30 px-2.5 py-1 rounded-lg hover:bg-green-50"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between p-4">
              <p className="text-sm text-[#77817C]">Page {meta.current_page} of {meta.last_page}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border border-[#E8EAE6] rounded-lg disabled:opacity-40">Previous</button>
                <button disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border border-[#E8EAE6] rounded-lg disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User detail drawer */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setDetail(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#E8EAE6] flex items-center justify-between">
              <h2 className="font-manrope font-bold text-lg text-[#24332F]">User Detail</h2>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-[#FAF9F6] rounded-xl">
                <X size={18} className="text-[#77817C]" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#A8C5B5] flex items-center justify-center text-white text-xl font-bold">
                  {detail.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-manrope font-bold text-[#24332F] text-lg">{detail.name}</p>
                  <p className="text-sm text-[#A1AAA5]">{detail.email}</p>
                  {detail.mobile && <p className="text-sm text-[#A1AAA5]">{detail.mobile}</p>}
                </div>
              </div>

              {/* Status + action */}
              <div className="flex items-center gap-3">
                <Badge variant={detail.status === 'active' ? 'success' : 'error'}>{detail.status}</Badge>
                {detail.status === 'active' ? (
                  <button
                    onClick={() => updateStatus.mutate({ id: detail.id, status: 'suspended' })}
                    disabled={updateStatus.isPending}
                    className="text-xs text-[#D76D6D] border border-[#D76D6D]/30 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    Suspend Account
                  </button>
                ) : (
                  <button
                    onClick={() => updateStatus.mutate({ id: detail.id, status: 'active' })}
                    disabled={updateStatus.isPending}
                    className="text-xs text-[#4D9274] border border-[#4D9274]/30 px-3 py-1.5 rounded-lg hover:bg-green-50 disabled:opacity-50"
                  >
                    Activate Account
                  </button>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Role', value: detail.role },
                  { label: 'Joined', value: new Date(detail.joined).toLocaleDateString() },
                  { label: 'Email Verified', value: detail.email_verified_at ? new Date(detail.email_verified_at).toLocaleDateString() : 'No' },
                  { label: 'Onboarding', value: detail.onboarding_completed_at ? 'Completed' : 'Incomplete' },
                  { label: 'Last Active', value: detail.last_active_at ? new Date(detail.last_active_at).toLocaleDateString() : '—' },
                  { label: 'Gender', value: detail.profile?.gender ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-[#A1AAA5] mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-[#24332F]">{value}</p>
                  </div>
                ))}
              </div>

              {/* Bio */}
              {detail.profile?.bio && (
                <div>
                  <p className="text-xs text-[#A1AAA5] mb-1">Bio</p>
                  <p className="text-sm text-[#24332F] bg-[#FAF9F6] rounded-xl p-3">{detail.profile.bio}</p>
                </div>
              )}

              {/* Companion */}
              {detail.profile && (
                <div>
                  <p className="text-xs text-[#A1AAA5] mb-1">Companion Status</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={detail.profile.companion_verification_status === 'approved' ? 'verified' : 'muted'}>
                      {detail.profile.companion_verification_status}
                    </Badge>
                    {detail.profile.avg_rating != null && (
                      <span className="text-xs text-[#77817C]">★ {Number(detail.profile.avg_rating).toFixed(1)} ({detail.profile.rating_count} reviews)</span>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {detail.interests.length > 0 && (
                <div>
                  <p className="text-xs text-[#A1AAA5] mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.interests.map(i => (
                      <span key={i} className="text-xs bg-[#E8F0EA] text-[#236B63] px-2.5 py-1 rounded-full">{i}</span>
                    ))}
                  </div>
                </div>
              )}

              {detail.languages.length > 0 && (
                <div>
                  <p className="text-xs text-[#A1AAA5] mb-2">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.languages.map(l => (
                      <span key={l} className="text-xs bg-[#F0EDE8] text-[#8C6E3D] px-2.5 py-1 rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {detail.services.length > 0 && (
                <div>
                  <p className="text-xs text-[#A1AAA5] mb-2">Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.services.map(s => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Companion application link */}
              {detail.companion_application && (
                <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8EAE6]">
                  <p className="text-xs text-[#A1AAA5] mb-1">Companion Application</p>
                  <div className="flex items-center justify-between">
                    <Badge variant={detail.companion_application.status === 'approved' ? 'verified' : detail.companion_application.status === 'submitted' ? 'warning' : 'muted'}>
                      {detail.companion_application.status}
                    </Badge>
                    <span className="text-xs text-[#77817C]">{new Date(detail.companion_application.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
