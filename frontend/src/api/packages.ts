import api from './client'

export interface PackagePayload {
  title: string
  description?: string
  price: number
  currency?: string
  duration_hours?: number
  location_type?: string
  is_active?: boolean
  sort_order?: number
}

export const packagesApi = {
  forCompanion: (companionId: string) => api.get(`/companions/${companionId}/packages`),
  mine: () => api.get('/me/packages'),
  create: (data: PackagePayload) => api.post('/me/packages', data),
  update: (id: string, data: Partial<PackagePayload>) => api.put(`/me/packages/${id}`, data),
  remove: (id: string) => api.delete(`/me/packages/${id}`),
}
