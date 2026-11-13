import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, X } from 'lucide-react'
import api from '../../api/client'
import AdminLayout from './AdminLayout'
import Badge from '../../components/ui/Badge'

const STATUS_VARIANTS: Record<string, 'default' | 'verified' | 'warning' | 'error' | 'success' | 'muted'> = {
  open: 'error', under_review: 'warning', resolved: 'success', dismissed: 'muted',
}

interface Report {
  id: string
  reporter?: { id: string; name: string }
  reported?: { id: string; name: string }
  category: string
  status: string
  description_preview?: string
  submitted: string
}

interface ResolveModal {
  id: string
  reportedName: string
}

const textareaStyle = { background: '#1C1C22', border: '1px solid #2E2E3A', color: '#F2F0EB', outline: 'none' }

export default function ReportsPage() {
  const [page, setPage] = useState(1)
  const [resolveModal, setResolveModal] = useState<ResolveModal | null>(null)
  const [resolution, setResolution] = useState<'resolved' | 'dismissed'>('resolved')
  const [notes, setNotes] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', page],
    queryFn: () => api.get('/admin/reports', { params: { page } }),
  })

  const resolve = useMutation({
    mutationFn: ({ id, resolution, notes }: { id: string; resolution: string; notes: string }) =>
      api.post(`/admin/reports/${id}/resolve`, { resolution, notes: notes || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] })
      setResolveModal(null)
      setNotes('')
    },
  })

  const reports: Report[] = data?.data?.data ?? []
  const meta = data?.data?.meta

  const openModal = (r: Report) => {
    setResolveModal({ id: r.id, reportedName: r.reported?.name ?? 'User' })
    setResolution('resolved')
    setNotes('')
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-manrope font-bold text-2xl" style={{ color: '#F2F0EB' }}>Safety Reports</h1>
          <p className="text-sm" style={{ color: '#8B8B9A' }}>{meta?.total ?? '—'} total reports</p>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
          <table className="w-full text-sm">
            <thead style={{ borderBottom: '1px solid #2E2E3A' }}>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#52525E' }}>
                <th className="px-4 py-3">Reporter</th>
                <th className="px-4 py-3">Reported</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #2E2E3A' }}>
                  {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded w-20 animate-pulse" style={{ background: '#1C1C22' }} /></td>)}
                </tr>
              )) : reports.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: '#52525E' }}>No reports</td></tr>
              ) : reports.map((r) => (
                <tr key={r.id} className="transition-colors" style={{ borderBottom: '1px solid #2E2E3A' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1C1C22')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#F2F0EB' }}>{r.reporter?.name ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: '#F2F0EB' }}>{r.reported?.name ?? '—'}</td>
                  <td className="px-4 py-3 capitalize" style={{ color: '#8B8B9A' }}>{r.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-xs" style={{ color: '#52525E' }}>{r.description_preview || '—'}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANTS[r.status] ?? 'muted'}>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8B8B9A' }}>{r.submitted}</td>
                  <td className="px-4 py-3">
                    {r.status === 'open' || r.status === 'under_review' ? (
                      <button
                        onClick={() => openModal(r)}
                        className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                        style={{ color: '#C8FF4D', border: '1px solid rgba(200,255,77,0.3)' }}
                      >
                        <Eye size={12} /> Review
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: '#52525E' }}>Closed</span>
                    )}
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

      {resolveModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="rounded-3xl max-w-md w-full p-6" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-manrope font-bold text-xl" style={{ color: '#F2F0EB' }}>Resolve Report</h2>
              <button onClick={() => setResolveModal(null)} className="p-2 rounded-xl" style={{ color: '#8B8B9A' }}>
                <X size={18} />
              </button>
            </div>

            <p className="text-sm mb-4" style={{ color: '#8B8B9A' }}>
              Report against <span className="font-semibold" style={{ color: '#F2F0EB' }}>{resolveModal.reportedName}</span>
            </p>

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#52525E' }}>Resolution</p>
              <div className="flex gap-2">
                {(['resolved', 'dismissed'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                    style={resolution === r
                      ? { background: r === 'resolved' ? '#C8FF4D' : '#252530', color: r === 'resolved' ? '#0A1A00' : '#F2F0EB', border: 'none' }
                      : { border: '1px solid #2E2E3A', color: '#8B8B9A', background: '#1C1C22' }
                    }
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#52525E' }}>Admin Notes (optional)</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about the resolution…"
                rows={3}
                className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                style={textareaStyle}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setResolveModal(null)} className="flex-1 py-2.5 text-sm rounded-xl" style={{ color: '#8B8B9A', border: '1px solid #2E2E3A', background: '#1C1C22' }}>
                Cancel
              </button>
              <button
                onClick={() => resolve.mutate({ id: resolveModal.id, resolution, notes })}
                disabled={resolve.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: resolution === 'resolved' ? '#C8FF4D' : '#252530', color: resolution === 'resolved' ? '#0A1A00' : '#F2F0EB' }}
              >
                {resolve.isPending ? 'Saving…' : `Mark as ${resolution}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
