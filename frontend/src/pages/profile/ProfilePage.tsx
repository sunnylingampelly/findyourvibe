import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Edit2, Settings, Shield, Users, Bell, LogOut,
  ChevronRight, Star, Bookmark, ShieldCheck
} from 'lucide-react'
import { profileApi } from '../../api/profile'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import AppShell from '../../components/layout/AppShell'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import type { User } from '../../types'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user: storeUser, logout } = useAuthStore()

  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => profileApi.getMe(),
  })

  const user: User = data?.data?.data ?? storeUser
  const profile = user?.profile

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      logout()
      navigate('/welcome')
    }
  }

  const menuItems = [
    { icon: Edit2, label: 'Edit Profile', to: '/profile/edit' },
    { icon: Bookmark, label: 'Saved Profiles', to: '/saved' },
    { icon: Users, label: 'My Connections', to: '/connections' },
    { icon: Bell, label: 'Notifications', to: '/notifications' },
    { icon: Shield, label: 'Privacy Settings', to: '/settings/privacy' },
    { icon: ShieldCheck, label: 'Become a Companion', to: '/companion/apply', highlight: true },
    { icon: Star, label: 'Companion Status', to: '/companion/status', show: profile?.companion_verification_status !== 'not_started' },
    { icon: Settings, label: 'Account Settings', to: '/settings' },
  ].filter(item => item.show !== false)

  return (
    <AppShell>
      <div className="screen-scroll overflow-y-auto h-dvh">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-[#194E49] to-[#4D9274]" />
          <div className="px-4 pb-4">
            <div className="flex items-end gap-4 -mt-14 mb-4">
              <div className="relative">
                <Avatar
                  src={profile?.profile_photo_url}
                  name={profile?.display_name || user?.name || 'User'}
                  size="2xl"
                  className="border-4 border-white shadow-lg"
                />
                {profile?.companion_verification_status === 'approved' && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#236B63] rounded-full border-2 border-white flex items-center justify-center">
                    <ShieldCheck size={14} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 pb-2">
                <button onClick={() => navigate('/profile/edit')} className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#236B63] bg-[#E8F0EA] px-3 py-1.5 rounded-full float-right">
                  <Edit2 size={12} /> Edit
                </button>
              </div>
            </div>

            <h1 className="font-manrope font-extrabold text-2xl text-[#24332F]">
              {profile?.display_name || user?.name}
            </h1>
            <p className="text-[#77817C] text-sm mt-0.5">{user?.email}</p>

            {profile?.bio && <p className="text-[#77817C] text-sm mt-3 leading-relaxed">{profile.bio}</p>}

            <div className="flex gap-2 mt-3 flex-wrap">
              {profile?.companion_verification_status === 'approved' && <Badge variant="verified">Verified Companion</Badge>}
              {profile?.companion_verification_status === 'submitted' && <Badge variant="warning">Application Pending</Badge>}
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-[#E8EAE6]">
              {[
                { label: 'Rating', value: profile?.avg_rating ? Number(profile.avg_rating).toFixed(1) : '—' },
                { label: 'Reviews', value: profile?.rating_count ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="font-manrope font-bold text-xl text-[#24332F]">{value}</div>
                  <div className="text-xs text-[#A1AAA5]">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="px-4 pb-8 space-y-2">
          {menuItems.map(({ icon: Icon, label, to, highlight }) => (
            <motion.button
              key={to}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(to)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-colors ${highlight ? 'bg-gradient-to-r from-[#236B63] to-[#4D9274] text-white' : 'bg-white border border-[#E8EAE6] text-[#24332F] hover:bg-[#F4F1EA]'}`}
            >
              <Icon size={18} className={highlight ? 'text-white' : 'text-[#236B63]'} />
              <span className={`flex-1 text-left font-medium text-sm ${highlight ? 'text-white' : ''}`}>{label}</span>
              <ChevronRight size={16} className={highlight ? 'text-white/70' : 'text-[#A1AAA5]'} />
            </motion.button>
          ))}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#E8EAE6] text-[#D76D6D] mt-4"
          >
            <LogOut size={18} className="text-[#D76D6D]" />
            <span className="flex-1 text-left font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </AppShell>
  )
}
