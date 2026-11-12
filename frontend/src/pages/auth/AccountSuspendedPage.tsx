import { ShieldOff, Mail, LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import api from '../../api/client'

export default function AccountSuspendedPage() {
  const { suspensionMessage, logout } = useAuthStore()

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="app-container min-h-dvh bg-[#FAF9F6] flex flex-col items-center justify-center px-6 text-center">
      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <ShieldOff className="w-12 h-12 text-red-500" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Account Suspended</h1>

      {/* Message */}
      <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-2">
        {suspensionMessage ?? 'Your account has been suspended. Please contact support for more information.'}
      </p>
      <p className="text-gray-400 text-xs max-w-xs mb-8">
        If you believe this is a mistake, our support team will review your case and get back to you within 24–48 hours.
      </p>

      {/* Actions */}
      <a
        href="mailto:support@findyourvibe.com"
        className="w-full max-w-xs flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-[#236B63] text-white font-semibold text-sm mb-3"
      >
        <Mail className="w-4 h-4" />
        Contact Support
      </a>

      <button
        onClick={handleLogout}
        className="w-full max-w-xs flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      <p className="mt-8 text-xs text-gray-300">Find Your Vibe · Account Suspended</p>
    </div>
  )
}
