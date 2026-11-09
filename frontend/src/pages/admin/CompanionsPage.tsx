import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Eye, CheckCircle, XCircle, FileText, User, Clock, AlertCircle, Download } from 'lucide-react'
import api from '../../api/client'
import AdminLayout from './AdminLayout'
import Badge from '../../components/ui/Badge'

async function downloadDoc(appId: string, docId: string, filename: string) {
  const res = await api.get(
    `/admin/companion-applications/${appId}/documents/${docId}/download`,
    { responseType: 'blob' }
  )
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

const STATUS_VARIANTS: Record<string, 'default' | 'verified' | 'warning' | 'error' | 'success' | 'muted'> = {
  approved: 'verified', submitted: 'warning', under_review: 'warning',
  rejected: 'error', suspended: 'error', draft: 'muted',
  additional_info_required: 'warning',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
  approved: 'Approved', rejected: 'Rejected', suspended: 'Suspended',
  additional_info_required: 'More Info Needed',
}

const STATUS_TABS = [
  { key: '', label: 'All', icon: null },
  { key: 'submitted', label: 'Submitted', icon: Clock },
  { key: 'under_review', label: 'Under Review', icon: AlertCircle },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
]

type Application = {
  id: string
  legal_name: string
  status: string
  created_at: string
  admin_notes?: string
  rejection_reason?: string
  submission_notes?: string
  user?: { name: string; email: string }
  documents?: { id: string; document_type: string; original_name: string; created_at: string }[]
}

export default function CompanionsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Application | null>(null)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-companions', search, statusFilter, page],
    queryFn: () => api.get('/admin/companion-applications', { params: { search, status: statusFilter || undefined, page } }),
  })

  const approve = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.post(`/admin/companion-applications/${id}/approve`, { admin_notes: notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-companions'] }); setSelected(null); setNotes('') },
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/companion-applications/${id}/reject`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-companions'] }); setSelected(null); setReason('') },
  })

  const apps: Application[] = data?.data?.data ?? []
  const meta = data?.data?.meta

  const canAct = (app: Application) => app.status === 'submitted' || app.status === 'under_review'

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="font-manrope font-bold text-2xl text-[#24332F]">Companion Applications</h1>
          <p className="text-[#77817C] text-sm mt-0.5">{meta?.total ?? apps.length} total applications</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {STATUS_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === key
                  ? 'bg-[#236B63] text-white shadow-sm'
                  : 'bg-white border border-[#E8EAE6] text-[#77817C] hover:border-[#236B63]/30'
              }`}
            >
              {Icon && <Icon size={13} />}
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#E8EAE6] overflow-hidden">
          {/* Search bar */}
          <div className="p-4 border-b border-[#E8EAE6]">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1AAA5]" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by name or email…"
                className="w-full max-w-sm pl-10 pr-4 py-2.5 bg-[#FAF9F6] border border-[#E8EAE6] rounded-xl text-sm focus:outline-none focus:border-[#236B63]"
              />
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b border-[#E8EAE6] bg-[#FAF9F6]">
              <tr className="text-left text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide">
                <th className="px-5 py-3">Applicant</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Docs</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#E8EAE6]">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-3.5"><div className="skeleton h-4 rounded w-24" /></td>
                      ))}
                    </tr>
                  ))
                : apps.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-[#A1AAA5]">
                      <FileText size={32} className="mx-auto mb-2 opacity-30" />
                      No applications found
                    </td>
                  </tr>
                )
                : apps.map(app => (
                    <tr key={app.id} className="border-b border-[#E8EAE6] hover:bg-[#FAF9F6] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#E8F0EA] rounded-full flex items-center justify-center shrink-0">
                            <User size={14} className="text-[#236B63]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#24332F] leading-tight">{app.user?.name ?? app.legal_name}</p>
                            <p className="text-xs text-[#A1AAA5]">{app.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={STATUS_VARIANTS[app.status] ?? 'muted'}>
                          {STATUS_LABELS[app.status] ?? app.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-[#77817C]">
                        {(app.documents?.length ?? 0) > 0
                          ? <span className="text-[#236B63] font-medium">{app.documents?.length} file{(app.documents?.length ?? 0) !== 1 ? 's' : ''}</span>
                          : <span className="text-[#A1AAA5]">None</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-[#77817C]">{new Date(app.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => { setSelected(app); setReason(''); setNotes('') }}
                            className="text-xs text-[#236B63] border border-[#236B63]/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#E8F0EA] transition-colors"
                          >
                            <Eye size={12} /> Review
                          </button>
                          {canAct(app) && (
                            <>
                              <button
                                onClick={() => approve.mutate({ id: app.id })}
                                className="text-xs text-[#4D9274] border border-[#4D9274]/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-green-50 transition-colors"
                              >
                                <CheckCircle size={12} /> Approve
                              </button>
                              <button
                                onClick={() => { setSelected(app); setReason('') }}
                                className="text-xs text-[#D76D6D] border border-[#D76D6D]/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-red-50 transition-colors"
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#E8EAE6]">
              <span className="text-xs text-[#A1AAA5]">Page {meta.current_page} of {meta.last_page}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs border border-[#E8EAE6] rounded-lg disabled:opacity-40 hover:bg-[#FAF9F6]">Prev</button>
                <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs border border-[#E8EAE6] rounded-lg disabled:opacity-40 hover:bg-[#FAF9F6]">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-[#E8EAE6]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-manrope font-bold text-xl text-[#24332F]">Application Review</h2>
                  <p className="text-sm text-[#A1AAA5] mt-0.5">{selected.user?.email}</p>
                </div>
                <Badge variant={STATUS_VARIANTS[selected.status] ?? 'muted'} className="mt-1">
                  {STATUS_LABELS[selected.status] ?? selected.status}
                </Badge>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Applicant info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FAF9F6] rounded-xl p-3">
                  <p className="text-xs text-[#A1AAA5] mb-0.5">Full Name</p>
                  <p className="text-sm font-medium text-[#24332F]">{selected.user?.name ?? '—'}</p>
                </div>
                <div className="bg-[#FAF9F6] rounded-xl p-3">
                  <p className="text-xs text-[#A1AAA5] mb-0.5">Legal Name</p>
                  <p className="text-sm font-medium text-[#24332F]">{selected.legal_name ?? '—'}</p>
                </div>
              </div>

              {selected.submission_notes && (
                <div className="bg-[#FAF9F6] rounded-xl p-3">
                  <p className="text-xs text-[#A1AAA5] mb-1">Application Notes</p>
                  <p className="text-sm text-[#24332F] whitespace-pre-line">{selected.submission_notes}</p>
                </div>
              )}

              {/* Documents */}
              <div>
                <p className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-2">Documents Uploaded</p>
                {!selected.documents || selected.documents.length === 0 ? (
                  <div className="border border-dashed border-[#E8EAE6] rounded-xl p-4 text-center">
                    <p className="text-sm text-[#A1AAA5]">No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selected.documents.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 bg-[#FAF9F6] rounded-xl px-3 py-2.5 border border-[#E8EAE6]">
                        <div className="w-8 h-8 bg-[#E8F0EA] rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={14} className="text-[#236B63]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#24332F] truncate">{doc.original_name}</p>
                          <p className="text-xs text-[#A1AAA5] capitalize">{doc.document_type.replace(/_/g, ' ')} · {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => downloadDoc(selected.id, doc.id, doc.original_name)}
                          title="Download"
                          className="w-8 h-8 rounded-lg bg-white border border-[#E8EAE6] flex items-center justify-center hover:bg-[#E8F0EA] hover:border-[#236B63]/30 transition-colors shrink-0"
                        >
                          <Download size={13} className="text-[#236B63]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Previous notes */}
              {selected.admin_notes && (
                <div className="bg-[#E8F0EA] rounded-xl p-3">
                  <p className="text-xs text-[#A1AAA5] mb-1">Previous Admin Notes</p>
                  <p className="text-sm text-[#24332F]">{selected.admin_notes}</p>
                </div>
              )}
              {selected.rejection_reason && (
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs text-[#D76D6D] mb-1">Rejection Reason</p>
                  <p className="text-sm text-[#24332F]">{selected.rejection_reason}</p>
                </div>
              )}

              {/* Action area */}
              {canAct(selected) && (
                <div className="space-y-3 pt-2 border-t border-[#E8EAE6]">
                  <p className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide">Take Action</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Admin notes (shown to applicant on approve)…"
                    rows={2}
                    className="w-full border border-[#E8EAE6] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#236B63] resize-none"
                  />
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Rejection reason (required to reject)…"
                    rows={2}
                    className="w-full border border-[#E8EAE6] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#D76D6D] resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => approve.mutate({ id: selected.id, notes })}
                      disabled={approve.isPending}
                      className="flex-1 py-3 bg-[#236B63] text-white rounded-xl text-sm font-semibold hover:bg-[#194E49] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={15} /> Approve
                    </button>
                    <button
                      onClick={() => reject.mutate({ id: selected.id, reason })}
                      disabled={!reason.trim() || reject.isPending}
                      className="flex-1 py-3 bg-[#D76D6D] text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <button onClick={() => setSelected(null)} className="w-full py-2.5 text-sm text-[#77817C] border border-[#E8EAE6] rounded-xl hover:bg-[#FAF9F6] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
