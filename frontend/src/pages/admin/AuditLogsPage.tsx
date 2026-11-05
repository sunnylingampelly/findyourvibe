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
          <h1 className="font-manrope font-bold text-2xl text-[#24332F]">Audit Logs</h1>
          <p className="text-[#77817C] text-sm">Administrative action history</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E8EAE6]">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E8EAE6]">
              <tr className="text-left text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide">
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#E8EAE6]">
                  {Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-24" /></td>)}
                </tr>
              )) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-[#A1AAA5]">No audit logs yet</td></tr>
              ) : logs.map((log: { id: string; admin?: { name: string }; action: string; entity_type?: string; entity_id?: string; ip_address: string; created_at: string }) => (
                <tr key={log.id} className="border-b border-[#E8EAE6] hover:bg-[#FAF9F6]">
                  <td className="px-4 py-3 text-[#24332F] font-medium">{log.admin?.name ?? 'System'}</td>
                  <td className="px-4 py-3"><span className="bg-[#E8F0EA] text-[#236B63] px-2 py-0.5 rounded text-xs font-mono">{log.action}</span></td>
                  <td className="px-4 py-3 text-[#77817C]">{log.entity_type ? `${log.entity_type} #${log.entity_id ?? ''}` : '—'}</td>
                  <td className="px-4 py-3 text-[#A1AAA5] font-mono text-xs">{log.ip_address}</td>
                  <td className="px-4 py-3 text-[#77817C]">{new Date(log.created_at).toLocaleString()}</td>
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
    </AdminLayout>
  )
}
