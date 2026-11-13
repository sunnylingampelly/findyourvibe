import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import AdminLayout from './AdminLayout'

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', page],
    queryFn: () => api.get('/admin/audit-logs', { params: { page } }),
  })

  const logs = data?.data?.data ?? []
  const meta = data?.data?.meta

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-manrope font-bold text-2xl" style={{ color: '#F2F0EB' }}>Audit Logs</h1>
          <p className="text-sm" style={{ color: '#8B8B9A' }}>Administrative action history</p>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
          <table className="w-full text-sm">
            <thead style={{ borderBottom: '1px solid #2E2E3A' }}>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#52525E' }}>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #2E2E3A' }}>
                  {Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded w-24 animate-pulse" style={{ background: '#1C1C22' }} /></td>)}
                </tr>
              )) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12" style={{ color: '#52525E' }}>No audit logs yet</td></tr>
              ) : logs.map((log: { id: string; admin?: { name: string }; action: string; entity_type?: string; entity_id?: string; ip_address: string; created_at: string }) => (
                <tr key={log.id} className="transition-colors" style={{ borderBottom: '1px solid #2E2E3A' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1C1C22')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#F2F0EB' }}>{log.admin?.name ?? 'System'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(200,255,77,0.1)', color: '#C8FF4D' }}>{log.action}</span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#8B8B9A' }}>{log.entity_type ? `${log.entity_type} #${log.entity_id ?? ''}` : '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#52525E' }}>{log.ip_address}</td>
                  <td className="px-4 py-3" style={{ color: '#8B8B9A' }}>{new Date(log.created_at).toLocaleString()}</td>
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
    </AdminLayout>
  )
}
