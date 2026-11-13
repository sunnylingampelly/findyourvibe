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

const inputStyle = { background: '#1C1C22', border: '1px solid #2E2E3A', color: '#F2F0EB', outline: 'none' }
const textareaStyle = { background: '#1C1C22', border: '1px solid #2E2E3A', color: '#F2F0EB', outline: 'none' }

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
          <h1 className="font-manrope font-bold text-2xl" style={{ color: '#F2F0EB' }}>Companion Applications</h1>
          <p className="text-sm mt-0.5" style={{ color: '#8B8B9A' }}>{meta?.total ?? apps.length} total applications</p>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {STATUS_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setPage(1) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={statusFilter === key
                ? { background: '#C8FF4D', color: '#0A1A00' }
                : { background: '#1C1C22', border: '1px solid #2E2E3A', color: '#8B8B9A' }
              }
            >
              {Icon && <Icon size={13} />}
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
          <div className="p-4" style={{ borderBottom: '1px solid #2E2E3A' }}>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#52525E' }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by name or email…"
                className="w-full max-w-sm pl-10 pr-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
          </div>

          <table className="w-full text-sm">
            <thead style={{ borderBottom: '1px solid #2E2E3A', background: '#141418' }}>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#52525E' }}>
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
                    <tr key={i} style={{ borderBottom: '1px solid #2E2E3A' }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-3.5"><div className="h-4 rounded w-24 animate-pulse" style={{ background: '#1C1C22' }} /></td>
                      ))}
                    </tr>
                  ))
                : apps.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16" style={{ color: '#52525E' }}>
                      <FileText size={32} className="mx-auto mb-2 opacity-30" />
                      No applications found
                    </td>
                  </tr>
                )
                : apps.map(app => (
                    <tr key={app.id} className="transition-colors" style={{ borderBottom: '1px solid #2E2E3A' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1C1C22')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(200,255,77,0.12)' }}>
                            <User size={14} style={{ color: '#C8FF4D' }} />
                          </div>
                          <div>
                            <p className="font-medium leading-tight" style={{ color: '#F2F0EB' }}>{app.user?.name ?? app.legal_name}</p>
                            <p className="text-xs" style={{ color: '#52525E' }}>{app.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={STATUS_VARIANTS[app.status] ?? 'muted'}>
                          {STATUS_LABELS[app.status] ?? app.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        {(app.documents?.length ?? 0) > 0
                          ? <span className="font-medium" style={{ color: '#C8FF4D' }}>{app.documents?.length} file{(app.documents?.length ?? 0) !== 1 ? 's' : ''}</span>
                          : <span style={{ color: '#52525E' }}>None</span>
                        }
                      </td>
                      <td className="px-5 py-3.5" style={{ color: '#8B8B9A' }}>{new Date(app.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => { setSelected(app); setReason(''); setNotes('') }}
                            className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            style={{ color: '#C8FF4D', border: '1px solid rgba(200,255,77,0.3)' }}
                          >
                            <Eye size={12} /> Review
                          </button>
                          {canAct(app) && (
                            <>
                              <button
                                onClick={() => approve.mutate({ id: app.id })}
                                className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                style={{ color: '#C8FF4D', border: '1px solid rgba(200,255,77,0.3)' }}
                              >
                                <CheckCircle size={12} /> Approve
                              </button>
                              <button
                                onClick={() => { setSelected(app); setReason('') }}
                                className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                style={{ color: '#FF5C7A', border: '1px solid rgba(255,92,122,0.3)' }}
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

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #2E2E3A' }}>
              <span className="text-xs" style={{ color: '#52525E' }}>Page {meta.current_page} of {meta.last_page}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs rounded-lg disabled:opacity-40" style={{ border: '1px solid #2E2E3A', color: '#F2F0EB', background: '#1C1C22' }}>Prev</button>
                <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs rounded-lg disabled:opacity-40" style={{ border: '1px solid #2E2E3A', color: '#F2F0EB', background: '#1C1C22' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
            <div className="p-6" style={{ borderBottom: '1px solid #2E2E3A' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-manrope font-bold text-xl" style={{ color: '#F2F0EB' }}>Application Review</h2>
                  <p className="text-sm mt-0.5" style={{ color: '#52525E' }}>{selected.user?.email}</p>
                </div>
                <Badge variant={STATUS_VARIANTS[selected.status] ?? 'muted'} className="mt-1">
                  {STATUS_LABELS[selected.status] ?? selected.status}
                </Badge>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-3" style={{ background: '#1C1C22' }}>
                  <p className="text-xs mb-0.5" style={{ color: '#52525E' }}>Full Name</p>
                  <p className="text-sm font-medium" style={{ color: '#F2F0EB' }}>{selected.user?.name ?? '—'}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#1C1C22' }}>
                  <p className="text-xs mb-0.5" style={{ color: '#52525E' }}>Legal Name</p>
                  <p className="text-sm font-medium" style={{ color: '#F2F0EB' }}>{selected.legal_name ?? '—'}</p>
                </div>
              </div>

              {selected.submission_notes && (
                <div className="rounded-xl p-3" style={{ background: '#1C1C22' }}>
                  <p className="text-xs mb-1" style={{ color: '#52525E' }}>Application Notes</p>
                  <p className="text-sm whitespace-pre-line" style={{ color: '#F2F0EB' }}>{selected.submission_notes}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#52525E' }}>Documents Uploaded</p>
                {!selected.documents || selected.documents.length === 0 ? (
                  <div className="rounded-xl p-4 text-center" style={{ border: '1px dashed #2E2E3A' }}>
                    <p className="text-sm" style={{ color: '#52525E' }}>No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selected.documents.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(200,255,77,0.1)' }}>
                          <FileText size={14} style={{ color: '#C8FF4D' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#F2F0EB' }}>{doc.original_name}</p>
                          <p className="text-xs capitalize" style={{ color: '#52525E' }}>{doc.document_type.replace(/_/g, ' ')} · {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => downloadDoc(selected.id, doc.id, doc.original_name)}
                          title="Download"
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                          style={{ background: '#252530', border: '1px solid #2E2E3A', color: '#C8FF4D' }}
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selected.admin_notes && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(200,255,77,0.08)', border: '1px solid rgba(200,255,77,0.2)' }}>
                  <p className="text-xs mb-1" style={{ color: '#8B8B9A' }}>Previous Admin Notes</p>
                  <p className="text-sm" style={{ color: '#F2F0EB' }}>{selected.admin_notes}</p>
                </div>
              )}
              {selected.rejection_reason && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,92,122,0.08)', border: '1px solid rgba(255,92,122,0.2)' }}>
                  <p className="text-xs mb-1" style={{ color: '#FF5C7A' }}>Rejection Reason</p>
                  <p className="text-sm" style={{ color: '#F2F0EB' }}>{selected.rejection_reason}</p>
                </div>
              )}

              {canAct(selected) && (
                <div className="space-y-3 pt-2" style={{ borderTop: '1px solid #2E2E3A' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#52525E' }}>Take Action</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Admin notes (shown to applicant on approve)…"
                    rows={2}
                    className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                    style={textareaStyle}
                  />
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Rejection reason (required to reject)…"
                    rows={2}
                    className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                    style={{ ...textareaStyle, borderColor: '#FF5C7A' }}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => approve.mutate({ id: selected.id, notes })}
                      disabled={approve.isPending}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                      style={{ background: '#C8FF4D', color: '#0A1A00' }}
                    >
                      <CheckCircle size={15} /> Approve
                    </button>
                    <button
                      onClick={() => reject.mutate({ id: selected.id, reason })}
                      disabled={!reason.trim() || reject.isPending}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
                      style={{ background: '#FF5C7A', color: 'white' }}
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <button onClick={() => setSelected(null)} className="w-full py-2.5 text-sm rounded-xl transition-colors" style={{ color: '#8B8B9A', border: '1px solid #2E2E3A', background: '#1C1C22' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
