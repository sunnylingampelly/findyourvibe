import api from './client'

export const reviewsApi = {
  submit: (bookingId: string, data: { rating: number; body?: string }) =>
    api.post(`/bookings/${bookingId}/reviews`, data),
  mine: (bookingId: string) =>
    api.get(`/bookings/${bookingId}/reviews/mine`),
  forProfile: (userId: string) =>
    api.get(`/profiles/${userId}/reviews`),
}
