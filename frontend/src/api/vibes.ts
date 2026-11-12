import api from './client'

export const vibesApi = {
  received: () => api.get('/swipes/received'),
}
