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
          <h1 className="font-manrope font-bold text-2xl text-[#24332F]">Safety Reports</h1>
          <p className="text-[#77817C] text-sm">{meta?.total ?? '—'} total reports</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8EAE6]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E8EAE6]">
              <tr className="text-left text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide">
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
                <tr key={i} className="border-b border-[#E8EAE6]">
                  {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>)}
                </tr>
              )) : reports.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#A1AAA5]">No reports</td></tr>
              ) : reports.map((r) => (
                <tr key={r.id} className="border-b border-[#E8EAE6] hover:bg-[#FAF9F6]">
                  <td className="px-4 py-3 text-[#24332F] font-medium">{r.reporter?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-[#24332F]">{r.reported?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-[#77817C] capitalize">{r.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-[#A1AAA5] max-w-[180px] truncate text-xs">{r.description_preview || '—'}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANTS[r.status] ?? 'muted'}>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-[#77817C] text-xs">{r.submitted}</td>
                  <td className="px-4 py-3">
                    {r.status === 'open' || r.status === 'under_review' ? (
                      <button
                        onClick={() => openModal(r)}
                        className="text-xs text-[#236B63] border border-[#236B63]/30 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-[#E8F0EA]"
                      >
                        <Eye size={12} /> Review
                      </button>
                    ) : (
                      <span className="text-xs text-[#A1AAA5]">Closed</span>
                    )}
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

      {/* Resolution modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-manrope font-bold text-xl text-[#24332F]">Resolve Report</h2>
              <button onClick={() => setResolveModal(null)} className="p-2 hover:bg-[#FAF9F6] rounded-xl">
                <X size={18} className="text-[#77817C]" />
              </button>
            </div>

            <p className="text-sm text-[#77817C] mb-4">
              Report against <span className="font-semibold text-[#24332F]">{resolveModal.reportedName}</span>
            </p>

            <div className="mb-4">
              <p className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-2">Resolution</p>
              <div className="flex gap-2">
                {(['resolved', 'dismissed'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                      resolution === r
                        ? r === 'resolved'
                          ? 'bg-[#4D9274] text-white border-[#4D9274]'
                          : 'bg-[#77817C] text-white border-[#77817C]'
                        : 'border-[#E8EAE6] text-[#77817C] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-2">Admin Notes (optional)</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about the resolution…"
                rows={3}
                className="w-full border border-[#E8EAE6] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#236B63] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setResolveModal(null)}
                className="flex-1 py-2.5 text-sm text-[#77817C] border border-[#E8EAE6] rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => resolve.mutate({ id: resolveModal.id, resolution, notes })}
                disabled={resolve.isPending}
                className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50 ${
                  resolution === 'resolved' ? 'bg-[#4D9274]' : 'bg-[#77817C]'
                }`}
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
