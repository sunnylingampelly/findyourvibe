import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
  isAdmin: () => boolean
  needsOnboarding: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token })
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      },
      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.role === 'super_admin',
      needsOnboarding: () => !get().user?.onboarding_completed_at,
    }),
    { name: 'fyv-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)
