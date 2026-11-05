import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bell, Search, SlidersHorizontal, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { discoverApi } from '../../api/discover'
import { useAuthStore } from '../../stores/authStore'
import AppShell from '../../components/layout/AppShell'
import ProfileCard from '../../components/profile/ProfileCard'
import { ProfileCardSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { normalizeProfile } from '../../lib/utils'
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

export default function DiscoverPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => discoverApi.getServices(),
    staleTime: Infinity,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['discover', selectedService, search],
    queryFn: () => discoverApi.getProfiles({
      service: selectedService,
      search: search || undefined,
    }),
  })

  const { data: savedData, refetch: refetchSaved } = useQuery({
    queryKey: ['saved-profiles'],
    queryFn: () => discoverApi.getSavedProfiles(),
  })

  const savedIds = new Set<string>(savedData?.data?.data?.map((s: { id: string; saved_user: { id: string } }) => s.saved_user?.id) ?? [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = user?.display_name || user?.name?.split(' ')[0] || 'there'

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

  return (
    <AppShell>
      <div className="screen-scroll h-dvh overflow-y-auto">
        {/* Header */}
        <div className="px-4 pt-safe pb-2 bg-[#FAF9F6] sticky top-0 z-40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[#77817C] text-xs font-medium">{greeting},</p>
              <h1 className="font-manrope font-extrabold text-xl text-[#24332F]">{displayName} 👋</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-[#77817C] bg-[#F4F1EA] px-3 py-1.5 rounded-full">
                <MapPin size={12} className="text-[#236B63]" />
                <span>Mumbai</span>
              </div>
              <Link to="/notifications" className="w-9 h-9 flex items-center justify-center bg-white rounded-xl border border-[#E8EAE6] relative">
                <Bell size={18} className="text-[#24332F]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D76D6D] rounded-full" />
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1AAA5]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Find your kind of company…"
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E8EAE6] rounded-2xl text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63]"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77817C]">
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {/* Service filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedService(null)}
              className={`shrink-0 px-3 py-1.5 rounded-2xl text-xs font-semibold font-manrope transition-all ${!selectedService ? 'bg-[#236B63] text-white' : 'bg-white border border-[#E8EAE6] text-[#77817C]'}`}
            >
              All
            </button>
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedService(selectedService === s.slug ? null : s.slug)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold font-manrope transition-all ${selectedService === s.slug ? 'bg-[#236B63] text-white' : 'bg-white border border-[#E8EAE6] text-[#77817C]'}`}
              >
                <span>{SERVICE_ICONS[s.slug] || '✨'}</span>
                {s.name.replace(' Companion', '').replace(' Buddy', '').replace(' Explorer', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Profile grid */}
        <div className="px-4 pb-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <ProfileCardSkeleton key={i} />)
          ) : profiles.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-manrope font-semibold text-[#24332F] mb-2">No companions found</h3>
              <p className="text-[#77817C] text-sm">Try adjusting your filters or search term</p>
            </motion.div>
          ) : (
            profiles.map((profile, i) => (
              <motion.div key={profile.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ProfileCard
                  profile={profile}
                  onSave={() => handleSave(profile)}
                  saved={savedIds.has(profile.id)}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
