import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
  withCredentials: true,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      localStorage.removeItem('fyv-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
