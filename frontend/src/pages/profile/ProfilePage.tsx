import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Edit2, Settings, Shield, Users, Bell, LogOut,
  ChevronRight, Star, Bookmark, ShieldCheck, HelpCircle, FileText, CalendarDays, LayoutDashboard
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
  const { user: storeUser, logout, setUser } = useAuthStore()

  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => profileApi.getMe(),
    staleTime: 0,
  })

  useEffect(() => {
    if (data?.data?.data) setUser(data.data.data)
  }, [data, setUser])

  const user: User = data?.data?.data ?? storeUser
  const profile = user?.profile
  const companionStatus = profile?.companion_verification_status
  const isApproved = companionStatus === 'approved'
  const hasPendingApp = companionStatus && !['not_started', 'approved', 'rejected'].includes(companionStatus)

  const companionItems = isApproved
    ? [
        { icon: LayoutDashboard, label: 'Companion Dashboard', to: '/companion/dashboard', highlight: true },
        { icon: CalendarDays, label: 'My Bookings', to: '/bookings', highlight: false },
        { icon: Users, label: 'My Connections', to: '/connections', highlight: false },
      ]
    : hasPendingApp
    ? [
        { icon: Star, label: 'Application Status', to: '/companion/apply', highlight: false },
        { icon: Users, label: 'My Connections', to: '/connections', highlight: false },
      ]
    : [
        { icon: ShieldCheck, label: 'Become a Companion', to: '/companion/apply', highlight: true },
        { icon: Users, label: 'My Connections', to: '/connections', highlight: false },
      ]

  const menuSections = [
    {
      label: 'Account',
      items: [
        { icon: Edit2, label: 'Edit Profile', to: '/profile/edit' },
        { icon: Bookmark, label: 'Saved Profiles', to: '/saved' },
        { icon: Bell, label: 'Notifications', to: '/notifications' },
        { icon: Settings, label: 'Account Settings', to: '/settings' },
      ],
    },
    {
      label: 'Companion',
      items: companionItems,
    },
    {
      label: 'Support',
      items: [
        { icon: Shield, label: 'Privacy Settings', to: '/settings/privacy' },
        { icon: HelpCircle, label: 'Help & Support', to: '/help' },
        { icon: FileText, label: 'Terms & Privacy', to: '/terms' },
      ],
    },
  ]

  const handleLogout = async () => {
    try { await authApi.logout() } finally {
      logout()
      navigate('/welcome')
    }
  }

  const joinedYear = user?.onboarding_completed_at ? new Date(user.onboarding_completed_at).getFullYear() : null

  return (
    <AppShell>
      <div className="screen-scroll overflow-y-auto h-dvh">
        {/* Header banner */}
        <div className="relative">
          <div className="h-28 bg-gradient-to-br from-[#194E49] via-[#236B63] to-[#4D9274]" />

          {/* Edit button */}
          <button
            onClick={() => navigate('/profile/edit')}
            className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30"
          >
            <Edit2 size={12} /> Edit
          </button>

          {/* Avatar row */}
          <div className="px-5 pb-4">
            <div className="-mt-12 mb-3 flex items-end justify-between">
              <div className="relative">
                <Avatar
                  src={profile?.profile_photo_url}
                  name={profile?.display_name || user?.name || 'U'}
                  size="2xl"
                  className="border-4 border-white shadow-lg"
                />
                {profile?.companion_verification_status === 'approved' && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#236B63] rounded-full border-2 border-white flex items-center justify-center">
                    <ShieldCheck size={14} className="text-white" />
                  </div>
                )}
              </div>
            </div>

            <h1 className="font-manrope font-extrabold text-[1.5rem] text-[#24332F] tracking-tight leading-tight">
              {profile?.display_name || user?.name}
            </h1>
            <p className="text-[#77817C] text-sm mt-0.5">{user?.email}</p>

            {profile?.bio && (
              <p className="text-[#77817C] text-sm mt-3 leading-relaxed line-clamp-2">{profile.bio}</p>
            )}

            <div className="flex gap-2 mt-3 flex-wrap">
              {profile?.companion_verification_status === 'approved' && <Badge variant="verified">Verified Companion</Badge>}
              {profile?.companion_verification_status === 'submitted' && <Badge variant="warning">Application Pending</Badge>}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              {[
                {
                  value: profile?.avg_rating && Number(profile.avg_rating) > 0 ? Number(profile.avg_rating).toFixed(1) : '—',
                  label: 'Rating',
                  sub: profile?.rating_count ? `${profile.rating_count} reviews` : '',
                },
                {
                  value: '—',
                  label: 'Connections',
                  sub: '',
                },
                {
                  value: joinedYear ? String(joinedYear) : '—',
                  label: 'Member since',
                  sub: '',
                },
              ].map(({ value, label, sub }) => (
                <div key={label} className="bg-[#F4F1EA] rounded-2xl px-3 py-3 text-center">
                  <div className="font-manrope font-extrabold text-xl text-[#24332F]">{value}</div>
                  <div className="text-[11px] text-[#A1AAA5] mt-0.5 leading-tight">{label}</div>
                  {sub && <div className="text-[10px] text-[#A1AAA5]">{sub}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Menu sections */}
        <div className="px-4 pb-10 space-y-5">
          {menuSections.map(section => (
            <div key={section.label}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#A1AAA5] px-1 mb-2">
                {section.label}
              </p>
              <div className="bg-white rounded-2xl border border-[#E8EAE6] overflow-hidden">
                {section.items.map(({ icon: Icon, label, to, highlight }, idx) => (
                  <motion.button
                    key={to}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(to)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors
                      ${idx < section.items.length - 1 ? 'border-b border-[#F4F1EA]' : ''}
                      ${highlight ? 'bg-gradient-to-r from-[#236B63] to-[#4D9274]' : 'hover:bg-[#FAF9F6]'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${highlight ? 'bg-white/20' : 'bg-[#E8F0EA]'}`}>
                      <Icon size={16} className={highlight ? 'text-white' : 'text-[#236B63]'} />
                    </div>
                    <span className={`flex-1 text-left font-medium text-sm ${highlight ? 'text-white font-semibold' : 'text-[#24332F]'}`}>
                      {label}
                    </span>
                    <ChevronRight size={16} className={highlight ? 'text-white/60' : 'text-[#C8CCC9]'} />
                  </motion.button>
                ))}
              </div>
            </div>
          ))}

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-[#E8EAE6] text-[#D76D6D] hover:bg-[#FFF5F5] transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FDE8E8] flex items-center justify-center">
              <LogOut size={16} className="text-[#D76D6D]" />
            </div>
            <span className="flex-1 text-left font-medium text-sm">Sign Out</span>
          </button>

          <p className="text-center text-[#A1AAA5] text-xs pt-2">FindYourVibe v1.0</p>
        </div>
      </div>
    </AppShell>
  )
}
