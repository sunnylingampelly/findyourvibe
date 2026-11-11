import api from './client'

export const connectionsApi = {
  sendRequest: (receiver_id: string, message?: string) =>
    api.post('/connections/requests', { receiver_id, message }),
  getReceived: () => api.get('/connections/requests/received'),
  getSent: () => api.get('/connections/requests/sent'),
  accept: (id: string) => api.post(`/connections/requests/${id}/accept`),
  decline: (id: string) => api.post(`/connections/requests/${id}/decline`),
  withdraw: (id: string) => api.post(`/connections/requests/${id}/withdraw`),
  getConnections: () => api.get('/connections'),
  createConversation: (connection_id: string) => api.post('/conversations', { connection_id }),
  getConversations: () => api.get('/conversations'),
  getMessages: (conversationId: string) => api.get(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, body: string) =>
    api.post(`/conversations/${conversationId}/messages`, { body }),
  markRead: (messageId: string) => api.post(`/messages/${messageId}/read`),
  deleteMessage: (conversationId: string, messageId: string) =>
    api.delete(`/conversations/${conversationId}/messages/${messageId}`),
}
