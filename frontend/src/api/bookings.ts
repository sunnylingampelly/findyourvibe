import api from './client'

export const bookingsApi = {
  getMyBookings: (role: 'requester' | 'companion' = 'requester') =>
    api.get('/bookings', { params: { role } }),

  createBooking: (data: {
    companion_id: string
    service_id: string | number
    proposed_date: string
    proposed_time: string
    notes?: string
    duration_hours?: string
    location_notes?: string
    agreed_rate?: number
  }) => api.post('/bookings', data),

  updateBooking: (id: string, status: 'accepted' | 'declined' | 'cancelled', companion_response_note?: string) =>
    api.patch(`/bookings/${id}`, { status, companion_response_note }),

  updatePricing: (services: { service_id: number; price_per_session?: number; price_currency?: string; price_unit?: string }[]) =>
    api.put('/companion/pricing', { services }),
}
