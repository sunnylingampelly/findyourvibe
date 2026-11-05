import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bell, Search, Star, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { discoverApi } from '../../api/discover'
import { useAuthStore } from '../../stores/authStore'
import AppShell from '../../components/layout/AppShell'
import { ProfileCardSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { normalizeProfile, getInitials, truncate } from '../../lib/utils'
import { type PublicProfile, type Service } from '../../types'
import { Bookmark, MapPin as MapPinSm } from 'lucide-react'

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

const SERVICE_COLORS: Record<string, string> = {
  'movie-companion': '#4F46E5',
  'coffee-buddy': '#B45309',
  'event-companion': '#7C3AED',
  'travel-buddy': '#0369A1',
  'shopping-companion': '#BE185D',
  'food-explorer': '#B45309',
  'city-explorer': '#065F46',
  'weekend-companion': '#D97706',
  'adventure-companion': '#1D4ED8',
  'gaming-buddy': '#6D28D9',
}

function FeaturedCard({ profile, onSave, saved }: { profile: PublicProfile; onSave: () => void; saved: boolean }) {
  const navigate = useNavigate()
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="relative w-44 h-64 rounded-3xl overflow-hidden shrink-0 cursor-pointer shadow-lg"
      onClick={() => navigate(`/profiles/${profile.id}`)}
    >
      {profile.profile_photo_url ? (
        <img src={profile.profile_photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#A8C5B5] to-[#236B63] flex items-center justify-center">
          <span className="text-4xl font-bold text-white">{getInitials(profile.display_name)}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      <button
        onClick={e => { e.stopPropagation(); onSave() }}
        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm ${saved ? 'bg-[#236B63]' : 'bg-white/25'}`}
      >
        <Bookmark size={14} className="text-white" fill={saved ? 'white' : 'none'} />
      </button>

      {profile.companion_verification_status === 'approved' && (
        <div className="absolute top-3 left-3 bg-[#236B63] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Verified</div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-manrope font-bold text-white text-sm leading-tight">
          {profile.display_name}{profile.age ? `, ${profile.age}` : ''}
        </p>
        {profile.city && (
          <p className="text-white/70 text-xs flex items-center gap-0.5 mt-0.5">
            <MapPinSm size={9} />{profile.city.name}
          </p>
        )}
        {profile.avg_rating && profile.avg_rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={10} className="text-[#D9A45B] fill-[#D9A45B]" />
            <span className="text-xs text-white font-semibold">{Number(profile.avg_rating).toFixed(1)}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ProfileListCard({ profile, onSave, saved }: { profile: PublicProfile; onSave: () => void; saved: boolean }) {
  const navigate = useNavigate()
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#F0EDE8] cursor-pointer"
      onClick={() => navigate(`/profiles/${profile.id}`)}
    >
      <div className="relative h-56">
        {profile.profile_photo_url ? (
          <img src={profile.profile_photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#A8C5B5] to-[#236B63] flex items-center justify-center">
            <span className="text-5xl font-manrope font-bold text-white">{getInitials(profile.display_name)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {profile.companion_verification_status === 'approved' && (
            <span className="bg-[#236B63] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">✓ Verified</span>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={e => { e.stopPropagation(); onSave() }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${saved ? 'bg-[#236B63]' : 'bg-white/25'}`}
        >
          <Bookmark size={16} className="text-white" fill={saved ? 'white' : 'none'} />
        </button>

        {/* Name overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-manrope font-bold text-white text-lg leading-tight">
            {profile.display_name}{profile.age ? `, ${profile.age}` : ''}
          </h3>
          {profile.city && (
            <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
              <MapPinSm size={10} />{profile.city.name}
            </p>
          )}
        </div>
      </div>

      <div className="p-3.5">
        {/* Rating row */}
        {profile.avg_rating && profile.avg_rating > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={12}
                  className={n <= Math.round(Number(profile.avg_rating)) ? 'text-[#D9A45B] fill-[#D9A45B]' : 'text-[#E8EAE6] fill-[#E8EAE6]'}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-[#24332F]">{Number(profile.avg_rating).toFixed(1)}</span>
            <span className="text-xs text-[#A1AAA5]">({profile.rating_count})</span>
          </div>
        )}

        {profile.bio && (
          <p className="text-sm text-[#77817C] leading-relaxed mb-2.5">{truncate(profile.bio, 80)}</p>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 3).map(i => (
              <span key={i.id} className="text-xs px-2.5 py-1 bg-[#E8F0EA] text-[#236B63] rounded-full font-medium">{i.name}</span>
            ))}
            {profile.interests.length > 3 && (
              <span className="text-xs px-2.5 py-1 bg-[#F4F1EA] text-[#77817C] rounded-full">+{profile.interests.length - 3} more</span>
            )}
          </div>
        )}

        {/* Services */}
        {profile.services && profile.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.services.slice(0, 2).map(s => (
              <span key={s.id} className="text-xs px-2.5 py-1 bg-[#FAF9F6] border border-[#E8EAE6] text-[#77817C] rounded-full">
                {SERVICE_ICONS[s.slug] || '✨'} {s.name.replace(' Companion', '').replace(' Buddy', '').replace(' Explorer', '')}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
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

  const savedIds = new Set<string>(savedData?.data?.data?.map((s: { saved_user: { id: string } }) => s.saved_user?.id) ?? [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = user?.display_name || user?.name?.split(' ')[0] || 'there'

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

  const profiles: PublicProfile[] = (data?.data?.data ?? []).map(normalizeProfile) as PublicProfile[]
  const services: Service[] = servicesData?.data?.data ?? []

  const featured = profiles.filter(p => p.companion_verification_status === 'approved').slice(0, 6)
  const allProfiles = profiles

  return (
    <AppShell>
      <div className="screen-scroll h-dvh overflow-y-auto bg-[#FAF9F6]">

        {/* Sticky header */}
        <div className="px-4 pt-safe pb-2 bg-[#FAF9F6] sticky top-0 z-40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[#A1AAA5] text-xs font-medium tracking-wide uppercase">{greeting}</p>
              <h1 className="font-manrope font-extrabold text-xl text-[#24332F]">{displayName} 👋</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/notifications" className="relative w-9 h-9 flex items-center justify-center bg-white rounded-xl border border-[#E8EAE6]">
                <Bell size={18} className="text-[#24332F]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D76D6D] rounded-full" />
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1AAA5]" />
            <input
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search companions by name, bio…"
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#E8EAE6] rounded-2xl text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] shadow-sm"
            />
          </div>

          {/* Service chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => setSelectedService(null)}
              className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold font-manrope transition-all ${!selectedService ? 'bg-[#236B63] text-white shadow-md' : 'bg-white border border-[#E8EAE6] text-[#77817C]'}`}
            >
              All ✨
            </button>
            {services.map(s => {
              const isActive = selectedService === s.slug
              const color = SERVICE_COLORS[s.slug] || '#236B63'
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(isActive ? null : s.slug)}
                  style={isActive ? { backgroundColor: color, color: 'white' } : {}}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold font-manrope transition-all ${isActive ? 'shadow-md' : 'bg-white border border-[#E8EAE6] text-[#77817C]'}`}
                >
                  <span className="text-sm">{SERVICE_ICONS[s.slug] || '✨'}</span>
                  {s.name.replace(' Companion', '').replace(' Buddy', '').replace(' Explorer', '')}
                </button>
              )
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="px-4 pb-4 space-y-3 mt-2">
            {Array.from({ length: 4 }).map((_, i) => <ProfileCardSkeleton key={i} />)}
          </div>
        ) : allProfiles.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-manrope font-semibold text-[#24332F] mb-2">No companions found</h3>
            <p className="text-[#77817C] text-sm px-8">Try a different search term or category</p>
          </motion.div>
        ) : (
          <>
            {/* Featured companions */}
            {featured.length > 0 && !search && !selectedService && (
              <div className="mt-1 mb-4">
                <div className="flex items-center justify-between px-4 mb-3">
                  <h2 className="font-manrope font-bold text-[#24332F] text-base">⭐ Featured</h2>
                  <button className="text-xs text-[#236B63] font-semibold flex items-center gap-0.5">
                    See all <ChevronRight size={14} />

                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
                  {featured.map(p => (
                    <FeaturedCard
                      key={p.id}
                      profile={p}
                      onSave={() => handleSave(p)}
                      saved={savedIds.has(p.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All companions */}
            <div className="px-4 pb-4">
              <h2 className="font-manrope font-bold text-[#24332F] text-base mb-3">
                {search ? `Results for "${search}"` : selectedService ? 'Companions' : '🌍 Discover All'}
              </h2>
              <div className="space-y-3">
                {allProfiles.map((profile, i) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  >
                    <ProfileListCard
                      profile={profile}
                      onSave={() => handleSave(profile)}
                      saved={savedIds.has(profile.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
