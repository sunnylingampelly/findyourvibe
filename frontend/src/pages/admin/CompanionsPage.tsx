import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Eye, CheckCircle, XCircle } from 'lucide-react'
import api from '../../api/client'
import AdminLayout from './AdminLayout'
import Badge from '../../components/ui/Badge'

const STATUS_VARIANTS: Record<string, 'default' | 'verified' | 'warning' | 'error' | 'success' | 'muted'> = {
  approved: 'verified', submitted: 'warning', under_review: 'warning',
  rejected: 'error', suspended: 'error', draft: 'muted',
}

export default function CompanionsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)
  const [reason, setReason] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-companions', search, page],
    queryFn: () => api.get('/admin/companion-applications', { params: { search, page } }),
  })

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/admin/companion-applications/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-companions'] }); setSelected(null) },
  })
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.post(`/admin/companion-applications/${id}/reject`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-companions'] }); setSelected(null) },
  })

  const apps = data?.data?.data ?? []
  const meta = data?.data?.meta

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-manrope font-bold text-2xl text-[#24332F]">Companion Applications</h1>
          <p className="text-[#77817C] text-sm">{meta?.total ?? '—'} total applications</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8EAE6]">
          <div className="p-4 border-b border-[#E8EAE6]">
            <div className="relative"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1AAA5]" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search applications…" className="w-full max-w-sm pl-10 pr-4 py-2 bg-[#FAF9F6] border border-[#E8EAE6] rounded-xl text-sm focus:outline-none focus:border-[#236B63]" /></div>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-[#E8EAE6]">
              <tr className="text-left text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide">
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#E8EAE6]">
                  {Array.from({ length: 4 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-24" /></td>)}
                </tr>
              )) : apps.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-[#A1AAA5]">No applications</td></tr>
              ) : apps.map((app: { id: string; user?: { name: string; email: string }; legal_name: string; status: string; created_at: string }) => (
                <tr key={app.id} className="border-b border-[#E8EAE6] hover:bg-[#FAF9F6]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#24332F]">{app.user?.name ?? app.legal_name}</p>
                    <p className="text-xs text-[#A1AAA5]">{app.user?.email}</p>
                  </td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANTS[app.status] ?? 'muted'}>{app.status.replace(/_/g, ' ')}</Badge></td>
                  <td className="px-4 py-3 text-[#77817C]">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(app)} className="text-xs text-[#236B63] border border-[#236B63]/30 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-[#E8F0EA]"><Eye size={12} /> Review</button>
                      {app.status === 'submitted' || app.status === 'under_review' ? (
                        <>
                          <button onClick={() => approve.mutate(app.id)} className="text-xs text-[#4D9274] border border-[#4D9274]/30 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-green-50"><CheckCircle size={12} /> Approve</button>
                          <button onClick={() => { setSelected(app); setReason('') }} className="text-xs text-[#D76D6D] border border-[#D76D6D]/30 px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-red-50"><XCircle size={12} /> Reject</button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review sheet */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="font-manrope font-bold text-xl text-[#24332F] mb-4">Application Review</h2>
            <div className="space-y-3 mb-6">
              <div><p className="text-xs text-[#A1AAA5]">Legal Name</p><p className="text-sm font-medium text-[#24332F]">{(selected as { legal_name?: string }).legal_name}</p></div>
              <div><p className="text-xs text-[#A1AAA5]">Status</p><Badge variant={STATUS_VARIANTS[(selected as { status: string }).status] ?? 'muted'}>{(selected as { status: string }).status}</Badge></div>
            </div>
            {((selected as { status: string }).status === 'submitted' || (selected as { status: string }).status === 'under_review') && (
              <div className="space-y-3">
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Rejection reason (required for reject)…" rows={3} className="w-full border border-[#E8EAE6] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#236B63] resize-none" />
                <div className="flex gap-3">
                  <button onClick={() => approve.mutate((selected as { id: string }).id)} className="flex-1 py-3 bg-[#4D9274] text-white rounded-xl text-sm font-semibold">Approve</button>
                  <button onClick={() => reject.mutate({ id: (selected as { id: string }).id, reason })} disabled={!reason} className="flex-1 py-3 bg-[#D76D6D] text-white rounded-xl text-sm font-semibold disabled:opacity-50">Reject</button>
                </div>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="w-full mt-3 py-2.5 text-sm text-[#77817C] border border-[#E8EAE6] rounded-xl">Close</button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
