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
          <h1 className="font-manrope font-bold text-2xl text-[#24332F]">Service Catalogue</h1>
          <p className="text-[#77817C] text-sm">Manage the 10 approved experience categories</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {isLoading ? Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E8EAE6] p-5 skeleton h-28" />
          )) : services.map((s: { id: string; slug: string; name: string; description?: string; is_active: boolean }) => (
            <div key={s.id} className="bg-white rounded-2xl border border-[#E8EAE6] p-5 flex items-start gap-4">
              <span className="text-3xl">{SERVICE_ICONS[s.slug] || '✨'}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-manrope font-semibold text-[#24332F]">{s.name}</h3>
                <p className="text-xs text-[#A1AAA5] mt-0.5 line-clamp-2">{s.description || 'No description'}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => toggle.mutate({ id: s.id, is_active: !s.is_active })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${s.is_active ? 'bg-[#236B63]' : 'bg-[#E8EAE6]'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${s.is_active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  <span className={`text-xs font-medium ${s.is_active ? 'text-[#4D9274]' : 'text-[#A1AAA5]'}`}>
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
