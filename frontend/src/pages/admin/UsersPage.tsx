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

const inputStyle = {
  background: '#1C1C22',
  border: '1px solid #2E2E3A',
  color: '#F2F0EB',
  outline: 'none',
}

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
            <h1 className="font-manrope font-bold text-2xl" style={{ color: '#F2F0EB' }}>User Management</h1>
            <p className="text-sm mt-1" style={{ color: '#8B8B9A' }}>{meta?.total ?? '—'} total users</p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
          <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid #2E2E3A' }}>
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#52525E' }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by name or email…"
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm cursor-pointer"
                style={inputStyle}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#52525E' }} />
            </div>
          </div>

          <table className="w-full text-sm">
            <thead style={{ borderBottom: '1px solid #2E2E3A' }}>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#52525E' }}>
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
                  <tr key={i} style={{ borderBottom: '1px solid #2E2E3A' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded w-24 animate-pulse" style={{ background: '#1C1C22' }} /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12" style={{ color: '#52525E' }}>No users found</td></tr>
              ) : users.map((u) => (
                <tr
                  key={u.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid #2E2E3A' }}
                  onClick={() => fetchDetail(u.id)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1C1C22')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(200,255,77,0.15)', color: '#C8FF4D' }}>
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: '#F2F0EB' }}>{u.name}</p>
                        <p className="text-xs" style={{ color: '#52525E' }}>{u.email}</p>
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
                  <td className="px-4 py-3 text-xs" style={{ color: '#8B8B9A' }}>
                    {[u.city, u.country].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#8B8B9A' }}>{u.joined}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {u.status === 'active' ? (
                        <button
                          onClick={() => updateStatus.mutate({ id: u.id, status: 'suspended' })}
                          className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                          style={{ color: '#FF5C7A', border: '1px solid rgba(255,92,122,0.3)' }}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatus.mutate({ id: u.id, status: 'active' })}
                          className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                          style={{ color: '#C8FF4D', border: '1px solid rgba(200,255,77,0.3)' }}
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
            <div className="flex items-center justify-between p-4" style={{ borderTop: '1px solid #2E2E3A' }}>
              <p className="text-sm" style={{ color: '#8B8B9A' }}>Page {meta.current_page} of {meta.last_page}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40" style={{ border: '1px solid #2E2E3A', color: '#F2F0EB', background: '#1C1C22' }}>Previous</button>
                <button disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40" style={{ border: '1px solid #2E2E3A', color: '#F2F0EB', background: '#1C1C22' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User detail drawer */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setDetail(null)}>
          <div className="w-full max-w-md h-full overflow-y-auto shadow-2xl" style={{ background: '#141418', borderLeft: '1px solid #2E2E3A' }} onClick={e => e.stopPropagation()}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid #2E2E3A' }}>
              <h2 className="font-manrope font-bold text-lg" style={{ color: '#F2F0EB' }}>User Detail</h2>
              <button onClick={() => setDetail(null)} className="p-2 rounded-xl transition-colors" style={{ color: '#8B8B9A' }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: 'rgba(200,255,77,0.15)', color: '#C8FF4D' }}>
                  {detail.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-manrope font-bold text-lg" style={{ color: '#F2F0EB' }}>{detail.name}</p>
                  <p className="text-sm" style={{ color: '#52525E' }}>{detail.email}</p>
                  {detail.mobile && <p className="text-sm" style={{ color: '#52525E' }}>{detail.mobile}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={detail.status === 'active' ? 'success' : 'error'}>{detail.status}</Badge>
                {detail.status === 'active' ? (
                  <button
                    onClick={() => updateStatus.mutate({ id: detail.id, status: 'suspended' })}
                    disabled={updateStatus.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                    style={{ color: '#FF5C7A', border: '1px solid rgba(255,92,122,0.3)' }}
                  >
                    Suspend Account
                  </button>
                ) : (
                  <button
                    onClick={() => updateStatus.mutate({ id: detail.id, status: 'active' })}
                    disabled={updateStatus.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                    style={{ color: '#C8FF4D', border: '1px solid rgba(200,255,77,0.3)' }}
                  >
                    Activate Account
                  </button>
                )}
              </div>

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
                    <p className="text-xs mb-0.5" style={{ color: '#52525E' }}>{label}</p>
                    <p className="text-sm font-medium" style={{ color: '#F2F0EB' }}>{value}</p>
                  </div>
                ))}
              </div>

              {detail.profile?.bio && (
                <div>
                  <p className="text-xs mb-1" style={{ color: '#52525E' }}>Bio</p>
                  <p className="text-sm rounded-xl p-3" style={{ color: '#F2F0EB', background: '#1C1C22' }}>{detail.profile.bio}</p>
                </div>
              )}

              {detail.profile && (
                <div>
                  <p className="text-xs mb-1" style={{ color: '#52525E' }}>Companion Status</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={detail.profile.companion_verification_status === 'approved' ? 'verified' : 'muted'}>
                      {detail.profile.companion_verification_status}
                    </Badge>
                    {detail.profile.avg_rating != null && (
                      <span className="text-xs" style={{ color: '#8B8B9A' }}>★ {Number(detail.profile.avg_rating).toFixed(1)} ({detail.profile.rating_count} reviews)</span>
                    )}
                  </div>
                </div>
              )}

              {detail.interests.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: '#52525E' }}>Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.interests.map(i => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(200,255,77,0.1)', color: '#C8FF4D' }}>{i}</span>
                    ))}
                  </div>
                </div>
              )}

              {detail.languages.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: '#52525E' }}>Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.languages.map(l => (
                      <span key={l} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(139,124,255,0.1)', color: '#8B7CFF' }}>{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {detail.services.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: '#52525E' }}>Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.services.map(s => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,159,67,0.1)', color: '#FF9F43' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {detail.companion_application && (
                <div className="p-3 rounded-xl" style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}>
                  <p className="text-xs mb-1" style={{ color: '#52525E' }}>Companion Application</p>
                  <div className="flex items-center justify-between">
                    <Badge variant={detail.companion_application.status === 'approved' ? 'verified' : detail.companion_application.status === 'submitted' ? 'warning' : 'muted'}>
                      {detail.companion_application.status}
                    </Badge>
                    <span className="text-xs" style={{ color: '#8B8B9A' }}>{new Date(detail.companion_application.submitted_at).toLocaleDateString()}</span>
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
