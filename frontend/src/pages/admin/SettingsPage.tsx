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
            <h1 className="font-manrope font-bold text-2xl" style={{ color: '#F2F0EB' }}>Platform Settings</h1>
            <p className="text-sm mt-1" style={{ color: '#8B8B9A' }}>Configure global platform behaviour</p>
          </div>
          <button
            onClick={() => updateSettings.mutate()}
            disabled={!hasChanges || updateSettings.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
            style={{ background: '#C8FF4D', color: '#0A1A00' }}
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
              <div key={i} className="rounded-2xl p-6" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
                <div className="h-5 w-32 rounded mb-4 animate-pulse" style={{ background: '#1C1C22' }} />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-10 rounded-xl animate-pulse" style={{ background: '#1C1C22' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(rawGroups).length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
            <p style={{ color: '#52525E' }}>No settings configured yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(rawGroups).map(([group, settings]) => (
              <div key={group} className="rounded-2xl" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid #2E2E3A' }}>
                  <h2 className="font-manrope font-semibold" style={{ color: '#F2F0EB' }}>{groupLabel(group)}</h2>
                </div>
                <div className="p-6 space-y-4">
                  {settings.map((s) => (
                    <div key={s.key} className="grid grid-cols-[1fr_auto] gap-4 items-start">
                      <div>
                        <label className="text-sm font-medium block mb-0.5" style={{ color: '#F2F0EB' }}>
                          {s.label || s.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </label>
                        {s.description && (
                          <p className="text-xs" style={{ color: '#52525E' }}>{s.description}</p>
                        )}
                      </div>
                      {s.type === 'boolean' ? (
                        <button
                          onClick={() => setLocal(prev => ({ ...prev, [s.key]: prev[s.key] === '1' ? '0' : '1' }))}
                          className="relative w-11 h-6 rounded-full transition-colors mt-0.5"
                          style={{ background: local[s.key] === '1' ? '#C8FF4D' : '#2E2E3A' }}
                        >
                          <span className="absolute top-1 w-4 h-4 rounded-full shadow transition-all"
                            style={{
                              background: local[s.key] === '1' ? '#0A1A00' : '#52525E',
                              left: local[s.key] === '1' ? '1.5rem' : '0.25rem',
                            }}
                          />
                        </button>
                      ) : (
                        <input
                          type={s.type === 'number' ? 'number' : 'text'}
                          value={local[s.key] ?? ''}
                          onChange={e => setLocal(prev => ({ ...prev, [s.key]: e.target.value }))}
                          className="w-48 rounded-xl px-3 py-2 text-sm text-right"
                          style={{ background: '#1C1C22', border: '1px solid #2E2E3A', color: '#F2F0EB', outline: 'none' }}
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
