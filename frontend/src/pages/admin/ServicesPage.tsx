import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import AdminLayout from './AdminLayout'

const SERVICE_ICONS: Record<string, string> = {
  'movie-companion': '🎬', 'coffee-buddy': '☕', 'event-companion': '🎭',
  'travel-buddy': '✈️', 'shopping-companion': '🛍️', 'food-explorer': '🍜',
  'city-explorer': '🗺️', 'weekend-companion': '🌅', 'adventure-companion': '🏔️', 'gaming-buddy': '🎮',
}

export default function ServicesPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => api.get('/admin/services'),
  })

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => api.put(`/admin/services/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-services'] }),
  })

  const services = data?.data?.data ?? []

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-manrope font-bold text-2xl" style={{ color: '#F2F0EB' }}>Service Catalogue</h1>
          <p className="text-sm" style={{ color: '#8B8B9A' }}>Manage the 10 approved experience categories</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {isLoading ? Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 h-28 animate-pulse" style={{ background: '#141418', border: '1px solid #2E2E3A' }} />
          )) : services.map((s: { id: string; slug: string; name: string; description?: string; is_active: boolean }) => (
            <div key={s.id} className="rounded-2xl p-5 flex items-start gap-4" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
              <span className="text-3xl">{SERVICE_ICONS[s.slug] || '✨'}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-manrope font-semibold" style={{ color: '#F2F0EB' }}>{s.name}</h3>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#52525E' }}>{s.description || 'No description'}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => toggle.mutate({ id: s.id, is_active: !s.is_active })}
                    className="relative w-10 h-5 rounded-full transition-colors"
                    style={{ background: s.is_active ? '#C8FF4D' : '#2E2E3A' }}
                  >
                    <span className="absolute top-0.5 w-4 h-4 rounded-full shadow transition-all"
                      style={{
                        background: s.is_active ? '#0A1A00' : '#52525E',
                        left: s.is_active ? '1.25rem' : '0.125rem',
                      }}
                    />
                  </button>
                  <span className="text-xs font-medium" style={{ color: s.is_active ? '#C8FF4D' : '#52525E' }}>
                    {s.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
