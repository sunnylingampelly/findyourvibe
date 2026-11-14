import { useEffect, useMemo } from 'react'
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
        { icon: Edit2, label: 'Edit Profile', to: '/profile/edit', highlight: false },
        { icon: Bookmark, label: 'Saved Profiles', to: '/saved', highlight: false },
        { icon: Bell, label: 'Notifications', to: '/notifications', highlight: false },
        { icon: Settings, label: 'Account Settings', to: '/settings', highlight: false },
      ],
    },
    {
      label: 'Companion',
      items: companionItems,
    },
    {
      label: 'Support',
      items: [
        { icon: Shield, label: 'Privacy Settings', to: '/settings/privacy', highlight: false },
        { icon: HelpCircle, label: 'Help & Support', to: '/help', highlight: false },
        { icon: FileText, label: 'Terms & Privacy', to: '/terms', highlight: false },
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

  const completionPct = useMemo(() => {
    if (!profile && !user) return 0
    const checks = [
      { weight: 25, pass: !!profile?.profile_photo_url },
      { weight: 20, pass: !!(profile?.bio && profile.bio.trim().length > 10) },
      { weight: 20, pass: !!(profile?.interests?.length || (profile as unknown as Record<string, unknown>)?.vibe_tags?.length) },
      { weight: 15, pass: !!(profile?.city || (profile as unknown as Record<string, unknown>)?.location) },
      { weight: 10, pass: !!(profile?.display_name || user?.name) },
      { weight: 10, pass: !!(profile?.date_of_birth || (profile as unknown as Record<string, unknown>)?.age) },
    ]
    return checks.reduce((sum, c) => sum + (c.pass ? c.weight : 0), 0)
  }, [profile, user])

  return (
    <AppShell>
      <div className="screen-scroll overflow-y-auto h-dvh">
        {/* Header banner */}
        <div className="relative">
          <div className="h-28" style={{ background: 'linear-gradient(135deg, #0D1A00 0%, #1A2E00 50%, rgba(200,255,77,0.15) 100%)' }} />

          {/* Edit button */}
          <button
            onClick={() => navigate('/profile/edit')}
            className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border"
            style={{ background: 'rgba(200,255,77,0.15)', borderColor: 'rgba(200,255,77,0.3)', color: '#C8FF4D', backdropFilter: 'blur(8px)' }}
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
                  className="border-4 shadow-lg border-[#0D0D12]"
                />
                {profile?.companion_verification_status === 'approved' && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 flex items-center justify-center" style={{ background: '#8B7CFF', borderColor: '#0D0D12' }}>
                    <ShieldCheck size={14} className="text-white" />
                  </div>
                )}
              </div>
            </div>

            <h1 className="font-manrope font-extrabold text-[1.5rem] text-[#F2F0EB] tracking-tight leading-tight">
              {profile?.display_name || user?.name}
            </h1>
            <p className="text-[#8B8B9A] text-sm mt-0.5">{user?.email}</p>

            {profile?.bio && (
              <p className="text-[#8B8B9A] text-sm mt-3 leading-relaxed line-clamp-2">{profile.bio}</p>
            )}

            <div className="flex gap-2 mt-3 flex-wrap">
              {profile?.companion_verification_status === 'approved' && <Badge variant="verified">Verified Companion</Badge>}
              {profile?.companion_verification_status === 'submitted' && <Badge variant="warning">Application Pending</Badge>}
            </div>

            {/* Profile completion bar */}
            <div className="mt-4 rounded-2xl px-4 py-3" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#8B8B9A]">
                  {completionPct === 100 ? 'Profile complete ✓' : `Profile ${completionPct}% complete`}
                </span>
                {completionPct < 100 && (
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="text-[11px] font-bold"
                    style={{ color: '#C8FF4D' }}
                  >
                    Complete profile →
                  </button>
                )}
                {completionPct === 100 && (
                  <span className="text-[11px] font-bold" style={{ color: '#C8FF4D' }}>✓</span>
                )}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#252530' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: completionPct === 100 ? '#C8FF4D' : 'linear-gradient(90deg, #C8FF4D 0%, #A8E62D 100%)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
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
                <div key={label} className="rounded-2xl px-3 py-3 text-center" style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}>
                  <div className="font-manrope font-extrabold text-xl text-[#F2F0EB]">{value}</div>
                  <div className="text-[11px] text-[#52525E] mt-0.5 leading-tight">{label}</div>
                  {sub && <div className="text-[10px] text-[#52525E]">{sub}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Menu sections */}
        <div className="px-4 pb-10 space-y-5">
          {menuSections.map(section => (
            <div key={section.label}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#52525E] px-1 mb-2">
                {section.label}
              </p>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
                {section.items.map(({ icon: Icon, label, to, highlight }, idx) => (
                  <motion.button
                    key={to}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(to)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors"
                    style={highlight
                      ? { background: 'linear-gradient(90deg, rgba(200,255,77,0.15) 0%, rgba(200,255,77,0.05) 100%)', borderBottom: idx < section.items.length - 1 ? '1px solid #2E2E3A' : undefined }
                      : { borderBottom: idx < section.items.length - 1 ? '1px solid #2E2E3A' : undefined }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={highlight ? { background: 'rgba(200,255,77,0.2)' } : { background: '#252530' }}>
                      <Icon size={16} style={{ color: highlight ? '#C8FF4D' : '#8B8B9A' }} />
                    </div>
                    <span className="flex-1 text-left font-medium text-sm" style={{ color: highlight ? '#C8FF4D' : '#F2F0EB' }}>
                      {label}
                    </span>
                    <ChevronRight size={16} style={{ color: highlight ? 'rgba(200,255,77,0.5)' : '#52525E' }} />
                  </motion.button>
                ))}
              </div>
            </div>
          ))}

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors"
            style={{ background: '#141418', border: '1px solid #2E2E3A' }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,122,0.15)' }}>
              <LogOut size={16} style={{ color: '#FF5C7A' }} />
            </div>
            <span className="flex-1 text-left font-medium text-sm" style={{ color: '#FF5C7A' }}>Sign Out</span>
          </button>

          <p className="text-center text-[#52525E] text-xs pt-2">FindYourVibe v1.0</p>
        </div>
      </div>
    </AppShell>
  )
}
