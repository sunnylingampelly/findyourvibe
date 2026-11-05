import api from './client'

export interface RegisterData {
  name: string; email: string; password: string
  password_confirmation: string; mobile?: string; country_code?: string
}
export interface LoginData { email: string; password: string }

export const authApi = {
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
    api.post('/auth/reset-password', data),
  verifyEmail: (hash: string) => api.post('/auth/verify-email', { hash }),
  me: () => api.get('/me'),
}
