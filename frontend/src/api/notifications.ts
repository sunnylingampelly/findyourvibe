import api from './client'

export interface AppNotification {
  id: string
  type: 'connection_request' | 'connection_accepted' | 'profile_saved' | string
  actor: { id: string; name: string; display_name: string; photo_url: string | null } | null
  message: string
  read: boolean
  created_at: string
}

export const notificationsApi = {
  list: () => api.get<{ success: boolean; data: AppNotification[]; meta: { total: number; unread_count: number } }>('/notifications'),
  unreadCount: () => api.get<{ success: boolean; data: { count: number } }>('/notifications/unread-count'),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
}
