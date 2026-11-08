import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bell, Search, Star, MapPin, CheckCircle2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { discoverApi } from '../../api/discover'
import { useAuthStore } from '../../stores/authStore'
import AppShell from '../../components/layout/AppShell'
import { useToast } from '../../components/ui/Toast'
import { normalizeProfile, getInitials } from '../../lib/utils'
import { type PublicProfile, type Service } from '../../types'

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

      {/* Rating */}
      {profile.avg_rating && profile.avg_rating > 0 && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <Star size={9} className="text-[#D9A45B] fill-[#D9A45B]" />
          <span className="text-white text-[10px] font-bold">{Number(profile.avg_rating).toFixed(1)}</span>
        </div>
      )}

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
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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

  const { data: savedData, refetch: refetchSaved } = useQuery({
    queryKey: ['saved-profiles'],
    queryFn: () => discoverApi.getSavedProfiles(),
  })

  const savedIds = new Set<string>(
    savedData?.data?.data?.map((s: { saved_user: { id: string } }) => s.saved_user?.id) ?? []
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
        const saved = savedData?.data?.data?.find((s: { saved_user: { id: string }; id: string }) => s.saved_user?.id === profile.id)
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
            <Link
              to="/notifications"
              className="relative w-10 h-10 bg-white rounded-2xl border border-[#E8EAE6] flex items-center justify-center shadow-sm"
            >
              <Bell size={18} className="text-[#24332F]" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#D76D6D] rounded-full border border-white" />
            </Link>
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
    </AppShell>
  )
}
