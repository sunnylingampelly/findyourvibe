import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, Star, MapPin, CheckCircle2, Download, Share, X, Zap, Wifi, Bookmark } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { discoverApi } from '../../api/discover'
import { notificationsApi } from '../../api/notifications'
import { useAuthStore } from '../../stores/authStore'
import echo from '../../lib/echo'
import AppShell from '../../components/layout/AppShell'
import { useToast } from '../../components/ui/Toast'
import { normalizeProfile, getInitials } from '../../lib/utils'
import { type PublicProfile, type Service } from '../../types'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import { LogoMark } from '../../components/ui/Logo'

const SERVICE_ICONS: Record<string, string> = {
  'movie-companion': '🎬',
  'coffee-buddy': '☕',
  'event-companion': '🎭',
  'travel-buddy': '✈️',
  'shopping-companion': '🛍️',
  'food-explorer': '🍜',
  'city-explorer': '🗺️',
  'weekend-companion': '🌅',
  'adventure-companion': '🏔️',
  'gaming-buddy': '🎮',
}

function GridCard({ profile }: { profile: PublicProfile }) {
  const navigate = useNavigate()
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="relative rounded-[22px] overflow-hidden cursor-pointer"
      style={{ aspectRatio: '3/4' }}
      onClick={() => navigate(`/profiles/${profile.id}`)}
    >
      {profile.profile_photo_url ? (
        <img src={profile.profile_photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#A8C5B5] to-[#194E49] flex items-center justify-center">
          <span className="font-manrope font-extrabold text-white text-3xl">{getInitials(profile.display_name)}</span>
        </div>
      )}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

      {/* Verified badge */}
      {profile.companion_verification_status === 'approved' && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-[#236B63] px-2 py-0.5 rounded-full">
          <CheckCircle2 size={9} className="text-white" />
          <span className="text-white text-[9px] font-bold tracking-wide">PRO</span>
        </div>
      )}

      {/* Online dot or Rating */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
        {profile.is_online && (
          <span className="w-2 h-2 rounded-full bg-[#4ADE80] border border-white shadow-sm" />
        )}
        {profile.avg_rating && profile.avg_rating > 0 && (
          <div className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <Star size={9} className="text-[#D9A45B] fill-[#D9A45B]" />
            <span className="text-white text-[10px] font-bold">{Number(profile.avg_rating).toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Name + location */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="font-manrope font-bold text-white text-sm leading-tight">
          {profile.display_name}{profile.age ? `, ${profile.age}` : ''}
        </h3>
        {profile.city && (
          <p className="flex items-center gap-0.5 text-white/65 text-[10px] mt-0.5">
            <MapPin size={8} />{profile.city.name}
          </p>
        )}
        {profile.specialty_tags && profile.specialty_tags.length > 0 && (
          <p className="text-white/55 text-[9px] mt-0.5 truncate">
            {profile.specialty_tags.slice(0, 2).join(' · ')}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function FeaturedCard({ profile }: { profile: PublicProfile }) {
  const navigate = useNavigate()
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="relative w-36 shrink-0 rounded-2xl overflow-hidden cursor-pointer shadow-md"
      style={{ aspectRatio: '2/3' }}
      onClick={() => navigate(`/profiles/${profile.id}`)}
    >
      {profile.profile_photo_url ? (
        <img src={profile.profile_photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#A8C5B5] to-[#194E49] flex items-center justify-center">
          <span className="font-manrope font-bold text-white text-2xl">{getInitials(profile.display_name)}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="font-manrope font-bold text-white text-xs leading-tight">
          {profile.display_name}
        </p>
        {profile.avg_rating && profile.avg_rating > 0 && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <Star size={8} className="fill-[#D9A45B] text-[#D9A45B]" />
            <span className="text-white/80 text-[9px]">{Number(profile.avg_rating).toFixed(1)}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-[22px] skeleton" style={{ aspectRatio: '3/4' }} />
      ))}
    </div>
  )
}

export default function DiscoverPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { canInstall, hasNativePrompt, isIOS, triggerNativePrompt } = usePWAInstall()
  const [showInstallSheet, setShowInstallSheet] = useState(false)
  const [installing, setInstalling] = useState(false)

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30000,
    staleTime: 20000,
  })
  const unreadCount = unreadData?.data?.data?.count ?? 0

  useEffect(() => {
    if (!user?.id) return
    const channel = echo.private(`App.Models.User.${user.id}`)
    channel.listen('.NotificationCreated', () => {
      qc.invalidateQueries({ queryKey: ['notifications-unread'] })
    })
    return () => { channel.stopListening('.NotificationCreated') }
  }, [user?.id, qc])

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      setInstalling(true)
      await triggerNativePrompt()
      setInstalling(false)
      setShowInstallSheet(false)
    }
  }

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => discoverApi.getServices(),
    staleTime: Infinity,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['discover', selectedService, search],
    queryFn: () => discoverApi.getProfiles({
      service: selectedService ?? undefined,
      search: search || undefined,
    }),
  })

  const { data: trendingData } = useQuery({
    queryKey: ['discover-trending'],
    queryFn: () => discoverApi.getTrending(),
    staleTime: 5 * 60_000,
  })
  const trendingProfiles: PublicProfile[] = (trendingData?.data?.data ?? []).map(normalizeProfile) as PublicProfile[]

  const { data: storiesData } = useQuery({
    queryKey: ['stories'],
    queryFn: () => discoverApi.getStories(),
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000,
  })
  interface Story { id: number; caption?: string; bg_color: string; user: { id: string; display_name: string; profile_photo_url?: string }; expires_at: string }
  const stories: Story[] = storiesData?.data?.data ?? []

  const { data: savedData, refetch: refetchSaved } = useQuery({
    queryKey: ['saved-profiles'],
    queryFn: () => discoverApi.getSavedProfiles(),
  })

  const savedIds = new Set<string>(
    savedData?.data?.data?.map((s: { user: { id: string } }) => s.user?.id) ?? []
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.display_name || user?.name?.split(' ')[0] || 'there'

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setSearch(val), 400)
  }

  const handleSave = async (profile: PublicProfile) => {
    try {
      if (savedIds.has(profile.id)) {
        const saved = savedData?.data?.data?.find((s: { user: { id: string }; id: string }) => s.user?.id === profile.id)
        if (saved) await discoverApi.unsaveProfile(saved.id)
      } else {
        await discoverApi.saveProfile(profile.id)
      }
      refetchSaved()
    } catch {
      toast('Could not update saved profiles', 'error')
    }
  }
  void handleSave

  const profiles: PublicProfile[] = (data?.data?.data ?? []).map(normalizeProfile) as PublicProfile[]
  const services: Service[] = servicesData?.data?.data ?? []
  const featured = profiles.filter(p => p.companion_verification_status === 'approved' && p.avg_rating && Number(p.avg_rating) >= 4).slice(0, 8)
  const showFeatured = !search && !selectedService && featured.length > 0

  return (
    <AppShell>
      <div className="screen-scroll h-dvh overflow-y-auto bg-[#FAF9F6]">

        {/* Sticky top bar */}
        <div className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md">
          {/* Greeting */}
          <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#A1AAA5]">{greeting}</p>
              <h1 className="font-manrope font-extrabold text-[1.35rem] text-[#1A2822] tracking-tight leading-tight">
                {firstName} 👋
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {canInstall && (
                <button
                  onClick={() => setShowInstallSheet(true)}
                  className="flex items-center gap-1.5 bg-[#236B63] text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-sm active:scale-95 transition-transform"
                >
                  <Download size={12} />
                  Install App
                </button>
              )}
              <Link
                to="/saved"
                className="w-10 h-10 bg-white rounded-2xl border border-[#E8EAE6] flex items-center justify-center shadow-sm"
              >
                <Bookmark size={18} className="text-[#24332F]" />
              </Link>
              <Link
                to="/notifications"
                className="relative w-10 h-10 bg-white rounded-2xl border border-[#E8EAE6] flex items-center justify-center shadow-sm"
              >
                <Bell size={18} className="text-[#24332F]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#D76D6D] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1 border border-white leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative px-4 mb-3">
            <Search size={15} className="absolute left-7 top-1/2 -translate-y-1/2 text-[#A1AAA5] pointer-events-none" />
            <input
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by name, vibe, city…"
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#E8EAE6] rounded-2xl text-sm text-[#24332F] placeholder:text-[#B8BDB9] focus:outline-none focus:border-[#236B63] shadow-sm transition-colors"
            />
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
            <button
              onClick={() => setSelectedService(null)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold font-manrope transition-all duration-200 ${
                !selectedService
                  ? 'bg-[#1A2822] text-white shadow-md shadow-black/15'
                  : 'bg-white border border-[#E8EAE6] text-[#77817C] hover:border-[#C0C8C2]'
              }`}
            >
              All
            </button>
            {services.map(s => {
              const isActive = selectedService === s.slug
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(isActive ? null : s.slug)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-manrope transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#236B63] text-white shadow-md shadow-[#236B63]/30'
                      : 'bg-white border border-[#E8EAE6] text-[#77817C] hover:border-[#C0C8C2]'
                  }`}
                >
                  {SERVICE_ICONS[s.slug] || '✨'}{' '}
                  {s.name.replace(' Companion', '').replace(' Buddy', '').replace(' Explorer', '')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="mt-2 pb-6">
            <SkeletonGrid />
          </div>
        ) : profiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 px-8 text-center"
          >
            <div className="w-16 h-16 bg-[#E8F0EA] rounded-2xl flex items-center justify-center mb-4">
              <Search size={24} className="text-[#236B63]" />
            </div>
            <h3 className="font-manrope font-bold text-[#24332F] mb-2">No companions found</h3>
            <p className="text-[#A1AAA5] text-sm leading-relaxed max-w-[220px]">
              Try a different category or clear the search
            </p>
          </motion.div>
        ) : (
          <div className="pb-6">
            {/* Stories strip */}
            {!search && !selectedService && stories.length > 0 && (
              <div className="mb-4">
                <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                  {stories.map(story => (
                    <motion.div
                      key={story.id}
                      whileTap={{ scale: 0.93 }}
                      className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
                      onClick={() => navigate(`/profiles/${story.user.id}`)}
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden border-2 border-transparent"
                        style={{ background: story.bg_color }}
                      >
                        {story.user.profile_photo_url ? (
                          <img src={story.user.profile_photo_url} alt={story.user.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-lg">{story.user.display_name[0]}</span>
                        )}
                        {/* Story ring */}
                        <div className="absolute inset-0 rounded-[14px] border-2 border-[#236B63] pointer-events-none" />
                      </div>
                      <p className="text-[9px] font-semibold text-[#24332F] text-center w-16 truncate">
                        {story.user.display_name.split(' ')[0]}
                      </p>
                      {story.caption && (
                        <p className="text-[8px] text-[#A1AAA5] text-center w-16 truncate">{story.caption}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending companions */}
            {!search && !selectedService && trendingProfiles.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between px-4 mb-3">
                  <div>
                    <h2 className="font-manrope font-extrabold text-[#1A2822] text-base tracking-tight">🔥 Trending</h2>
                    <p className="text-xs text-[#A1AAA5]">Most popular this week</p>
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
                  {trendingProfiles.map(p => (
                    <FeaturedCard key={p.id} profile={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Top rated horizontal scroll */}
            {showFeatured && (
              <div className="mb-5">
                <div className="flex items-center justify-between px-4 mb-3">
                  <div>
                    <h2 className="font-manrope font-extrabold text-[#1A2822] text-base tracking-tight">Top Rated</h2>
                    <p className="text-xs text-[#A1AAA5]">Highest reviewed companions</p>
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
                  {featured.map(p => (
                    <FeaturedCard key={p.id} profile={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Grid heading */}
            <div className="px-4 mb-3">
              <h2 className="font-manrope font-extrabold text-[#1A2822] text-base tracking-tight">
                {search
                  ? `Results for "${search}"`
                  : selectedService
                    ? services.find(s => s.slug === selectedService)?.name ?? 'Companions'
                    : 'Discover Companions'}
              </h2>
              <p className="text-xs text-[#A1AAA5] mt-0.5">{profiles.length} available near you</p>
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-2 gap-3 px-4">
              {profiles.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.04, 0.25) }}
                >
                  <GridCard profile={profile} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Install PWA bottom sheet */}
      <AnimatePresence>
        {showInstallSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[200]"
              onClick={() => setShowInstallSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-[201] px-6 pt-5 pb-10"
            >
              <div className="w-10 h-1 bg-[#E8EAE6] rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#236B63] rounded-2xl flex items-center justify-center shadow-md">
                    <LogoMark size={28} />
                  </div>
                  <div>
                    <p className="font-manrope font-bold text-[#24332F] text-base leading-tight">FindYourVibe</p>
                    <p className="text-[#A1AAA5] text-xs">findyourvibe.com</p>
                  </div>
                </div>
                <button onClick={() => setShowInstallSheet(false)} className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#A1AAA5]">
                  <X size={16} />
                </button>
              </div>

              <div className="bg-[#F9FAF8] rounded-2xl p-4 space-y-3 mb-6">
                {[
                  { icon: Zap, text: 'Faster — loads instantly like a native app' },
                  { icon: Wifi, text: 'Works offline — browse even without internet' },
                  { icon: Bell, text: 'Notifications — never miss a connection request' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E8F0EA] flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-[#236B63]" />
                    </div>
                    <span className="text-sm text-[#24332F] leading-snug">{text}</span>
                  </div>
                ))}
              </div>

              {!isIOS && hasNativePrompt ? (
                <button
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="w-full bg-[#236B63] text-white rounded-2xl py-4 font-manrope font-bold text-base disabled:opacity-60 active:scale-[0.98] transition-transform"
                >
                  {installing ? 'Installing…' : 'Install Now'}
                </button>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#24332F] mb-3">
                    {isIOS ? 'Install on iPhone / iPad' : 'Install from your browser'}
                  </p>
                  <ol className="space-y-3">
                    {isIOS ? (
                      <>
                        <li className="flex items-start gap-3 text-sm text-[#24332F]">
                          <span className="w-6 h-6 rounded-full bg-[#E8F0EA] text-[#236B63] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Tap the <Share size={13} className="inline text-[#236B63] mb-0.5" /> <strong>Share</strong> button in Safari toolbar.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#24332F]">
                          <span className="w-6 h-6 rounded-full bg-[#E8F0EA] text-[#236B63] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Scroll and tap <strong>"Add to Home Screen"</strong>.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#24332F]">
                          <span className="w-6 h-6 rounded-full bg-[#E8F0EA] text-[#236B63] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>Tap <strong>"Add"</strong> to confirm.</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-3 text-sm text-[#24332F]">
                          <span className="w-6 h-6 rounded-full bg-[#E8F0EA] text-[#236B63] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Tap the <strong>⋮ menu</strong> in your browser's top-right corner.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#24332F]">
                          <span className="w-6 h-6 rounded-full bg-[#E8F0EA] text-[#236B63] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.</span>
                        </li>
                      </>
                    )}
                  </ol>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppShell>
  )
}
