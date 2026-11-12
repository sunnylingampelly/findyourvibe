import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isSuspended: boolean
  suspensionMessage: string | null
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  setSuspended: (message: string) => void
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
      isSuspended: false,
      suspensionMessage: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, isSuspended: false, suspensionMessage: null })
      },
      setUser: (user) => set({ user }),
      setSuspended: (message) => set({ isSuspended: true, suspensionMessage: message }),
      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isSuspended: false, suspensionMessage: null })
      },
      isAuthenticated: () => !!get().token || !!localStorage.getItem('token'),
      isAdmin: () => get().user?.role === 'super_admin',
      needsOnboarding: () => !get().user?.onboarding_completed_at,
    }),
    { name: 'fyv-auth', partialize: (s) => ({ token: s.token, user: s.user, isSuspended: s.isSuspended, suspensionMessage: s.suspensionMessage }) }
  )
)
