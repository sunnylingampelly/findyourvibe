import api from './client'

export const safeMeetApi = {
  get: (bookingId: string) => api.get(`/bookings/${bookingId}/safe-meet`),
  setup: (bookingId: string, data: { trusted_name: string; trusted_phone: string }) =>
    api.post(`/bookings/${bookingId}/safe-meet`, data),
  action: (safeMeetId: string, action: 'checkin' | 'checkout' | 'sos') =>
    api.patch(`/safe-meets/${safeMeetId}`, { action }),
}
