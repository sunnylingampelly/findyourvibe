import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, RefreshCw } from 'lucide-react'
import api from '../../api/client'
import AdminLayout from './AdminLayout'

interface PlatformSetting {
  id: number
  key: string
  value: string | null
  label?: string
  description?: string
  group: string
  type?: string
}

type GroupedSettings = Record<string, PlatformSetting[]>

function groupLabel(group: string): string {
  return group.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const [local, setLocal] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings'),
  })

  const rawGroups: GroupedSettings = data?.data?.data ?? {}

  useEffect(() => {
    const flat: Record<string, string> = {}
    Object.values(rawGroups).flat().forEach(s => {
      flat[s.key] = s.value ?? ''
    })
    setLocal(flat)
  }, [data])

  const updateSettings = useMutation({
    mutationFn: () => api.put('/admin/settings', {
      settings: Object.entries(local).map(([key, value]) => ({ key, value: value || null })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const hasChanges = (() => {
    const flat: Record<string, string> = {}
    Object.values(rawGroups).flat().forEach(s => { flat[s.key] = s.value ?? '' })
    return Object.entries(local).some(([k, v]) => v !== (flat[k] ?? ''))
  })()

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-manrope font-bold text-2xl text-[#24332F]">Platform Settings</h1>
            <p className="text-[#77817C] text-sm mt-1">Configure global platform behaviour</p>
          </div>
          <button
            onClick={() => updateSettings.mutate()}
            disabled={!hasChanges || updateSettings.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#236B63] text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-[#194E49] transition-colors"
          >
            {updateSettings.isPending ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E8EAE6] p-6">
                <div className="skeleton h-5 w-32 rounded mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="skeleton h-10 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(rawGroups).length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8EAE6] p-12 text-center">
            <p className="text-[#A1AAA5]">No settings configured yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(rawGroups).map(([group, settings]) => (
              <div key={group} className="bg-white rounded-2xl border border-[#E8EAE6]">
                <div className="px-6 py-4 border-b border-[#E8EAE6]">
                  <h2 className="font-manrope font-semibold text-[#24332F]">{groupLabel(group)}</h2>
                </div>
                <div className="p-6 space-y-4">
                  {settings.map((s) => (
                    <div key={s.key} className="grid grid-cols-[1fr_auto] gap-4 items-start">
                      <div>
                        <label className="text-sm font-medium text-[#24332F] block mb-0.5">
                          {s.label || s.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </label>
                        {s.description && (
                          <p className="text-xs text-[#A1AAA5]">{s.description}</p>
                        )}
                      </div>
                      {s.type === 'boolean' ? (
                        <button
                          onClick={() => setLocal(prev => ({ ...prev, [s.key]: prev[s.key] === '1' ? '0' : '1' }))}
                          className={`relative w-11 h-6 rounded-full transition-colors mt-0.5 ${local[s.key] === '1' ? 'bg-[#236B63]' : 'bg-[#E8EAE6]'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${local[s.key] === '1' ? 'left-6' : 'left-1'}`} />
                        </button>
                      ) : (
                        <input
                          type={s.type === 'number' ? 'number' : 'text'}
                          value={local[s.key] ?? ''}
                          onChange={e => setLocal(prev => ({ ...prev, [s.key]: e.target.value }))}
                          className="w-48 border border-[#E8EAE6] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#236B63] text-right"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
