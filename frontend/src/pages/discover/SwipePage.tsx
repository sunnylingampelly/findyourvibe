import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence, type PanInfo } from 'framer-motion'
import { X, Heart, Info, Bookmark, MapPin, Star, MessageCircle, Undo2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { discoverApi } from '../../api/discover'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/ui/Toast'
import AppShell from '../../components/layout/AppShell'
import { getInitials } from '../../lib/utils'
import { computeVibeScore, vibeScoreLabel } from '../../lib/vibeScore'
import type { PublicProfile, Service } from '../../types'

const SERVICE_ICONS: Record<string, string> = {
  'movie-companion': '🎬', 'coffee-buddy': '☕', 'event-companion': '🎭',
  'travel-buddy': '✈️', 'shopping-companion': '🛍️', 'food-explorer': '🍜',
  'city-explorer': '🗺️', 'weekend-companion': '🌅', 'adventure-companion': '🏔️', 'gaming-buddy': '🎮',
}

function generateIcebreakers(profile: PublicProfile): string[] {
  const breakers: string[] = []
  if (profile.interests && profile.interests.length > 0) {
    const interest = profile.interests[0].name
    breakers.push(`What do you love most about ${interest}?`)
  }
  if (profile.city) {
    breakers.push(`What's your favourite spot in ${profile.city.name}?`)
  }
  if (profile.services && profile.services.length > 0) {
    const svc = profile.services[0].name
    breakers.push(`I'd love to try ${svc} with you! Where would we go?`)
  }
  breakers.push(`Hey ${profile.display_name.split(' ')[0]}, what are you up to this weekend?`)
  return breakers.slice(0, 3)
}

interface MatchData {
  displayName: string
  photoUrl: string | null
  conversationId: string
  icebreakers: string[]
}

function SwipeCard({ profile, onSwipe, isTop, vibeScore }: { profile: PublicProfile; onSwipe: (dir: 'left' | 'right') => void; isTop: boolean; vibeScore?: number }) {
  const navigate = useNavigate()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-28, 28])
  const likeOpacity = useTransform(x, [15, 90], [0, 1])
  const passOpacity = useTransform(x, [-90, -15], [1, 0])
  const controls = useAnimation()

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x
    if (offset > 100 || velocity > 500) {
      await controls.start({
        x: 600, opacity: 0, rotate: 20,
        transition: { type: 'spring', stiffness: 260, damping: 22 },
      })
      onSwipe('right')
    } else if (offset < -100 || velocity < -500) {
      await controls.start({
        x: -600, opacity: 0, rotate: -20,
        transition: { type: 'spring', stiffness: 260, damping: 22 },
      })
      onSwipe('left')
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 320, damping: 30 } })
    }
  }

  if (!isTop) {
    return (
      <motion.div className="absolute inset-0 rounded-3xl overflow-hidden" style={{ scale: 0.95 }}>
        <CardContent profile={profile} onInfo={() => {}} />
      </motion.div>
    )
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing shadow-2xl"
      style={{ x, rotate }}
      animate={controls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
    >
      {/* VIBE stamp — top-left, fades in when dragging right */}
      <motion.div
        className="absolute top-7 left-5 z-10 pointer-events-none"
        style={{ opacity: likeOpacity }}
      >
        <div
          className="rounded-2xl px-4 py-2"
          style={{
            border: '3.5px solid #C8FF4D',
            background: 'rgba(200,255,77,0.12)',
            transform: 'rotate(-18deg)',
          }}
        >
          <span className="font-manrope font-extrabold text-2xl" style={{ color: '#C8FF4D', letterSpacing: 2 }}>
            VIBE ✓
          </span>
        </div>
      </motion.div>

      {/* PASS stamp — top-right, fades in when dragging left */}
      <motion.div
        className="absolute top-7 right-5 z-10 pointer-events-none"
        style={{ opacity: passOpacity }}
      >
        <div
          className="rounded-2xl px-4 py-2"
          style={{
            border: '3.5px solid #FF5C7A',
            background: 'rgba(255,92,122,0.12)',
            transform: 'rotate(18deg)',
          }}
        >
          <span className="font-manrope font-extrabold text-2xl" style={{ color: '#FF5C7A', letterSpacing: 2 }}>
            PASS ✗
          </span>
        </div>
      </motion.div>

      <CardContent profile={profile} onInfo={() => navigate(`/profiles/${profile.id}`)} vibeScore={vibeScore} />
    </motion.div>
  )
}

function CardContent({ profile, onInfo, vibeScore }: { profile: PublicProfile; onInfo: () => void; vibeScore?: number }) {
  const label = vibeScore != null ? vibeScoreLabel(vibeScore) : null
  const distanceKm = (profile as PublicProfile & { distance_km?: number; distance?: number }).distance_km
    ?? (profile as PublicProfile & { distance_km?: number; distance?: number }).distance

  return (
    <div className="w-full h-full relative bg-[#141418]">
      {profile.profile_photo_url ? (
        <img src={profile.profile_photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#1C1C22] to-[#252530] flex items-center justify-center">
          <span className="text-7xl font-manrope font-bold" style={{ color: '#C8FF4D' }}>{getInitials(profile.display_name)}</span>
        </div>
      )}
      {/* Gradient for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

      {/* Info button top-right */}
      <button
        onClick={e => { e.stopPropagation(); onInfo() }}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20"
      >
        <Info size={18} />
      </button>

      {/* Distance badge — below info button when available */}
      {distanceKm != null && (
        <div
          className="absolute top-16 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
          style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: '#F2F0EB' }}
        >
          <MapPin size={11} style={{ color: '#C8FF4D' }} />
          {Math.round(distanceKm)} km
        </div>
      )}

      {/* Top-left: verified + vibe score */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5">
        {profile.companion_verification_status === 'approved' && (
          <div className="text-white text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#8B7CFF' }}>
            ✓ Verified
          </div>
        )}
        {label && (
          <div className="text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm"
            style={{ background: label.bg }}>
            {label.emoji} {vibeScore}% Vibe
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
        <div className="flex items-end justify-between mb-1">
          <h2 className="font-manrope font-extrabold text-2xl text-white leading-tight">
            {profile.display_name}{profile.age ? `, ${profile.age}` : ''}
          </h2>
          {profile.avg_rating && profile.avg_rating > 0 && (
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full mb-1">
              <Star size={12} className="text-[#D9A45B] fill-[#D9A45B]" />
              <span className="text-white text-xs font-bold">{Number(profile.avg_rating).toFixed(1)}</span>
            </div>
          )}
        </div>
        {profile.city && (
          <p className="text-white/80 text-sm flex items-center gap-1 mb-2">
            <MapPin size={13} />{profile.city.name}
          </p>
        )}
        {profile.bio && (
          <p className="text-white/75 text-sm mb-3 line-clamp-2 leading-relaxed">{profile.bio}</p>
        )}

        {/* Vibe activity tags (services) — lime pills */}
        {profile.services && profile.services.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {profile.services.slice(0, 3).map(s => (
              <span
                key={s.id}
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: 'rgba(200,255,77,0.18)', color: '#C8FF4D', border: '1px solid rgba(200,255,77,0.3)' }}
              >
                {SERVICE_ICONS[s.slug] ?? '✨'} {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Interests — white pills */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {profile.interests.slice(0, 3).map(i => (
              <span key={i.id} className="text-xs bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full border border-white/20">
                {i.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SwipePage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [index, setIndex] = useState(0)
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<PublicProfile[]>([])
  const swipedRef = useRef(new Set<string>())

  const myInterestIds = (user?.interests ?? []).map(i => String(i.id))
  const myLanguageIds = (user?.languages ?? []).map(l => String(l.id))
  const myServiceIds = (user?.services ?? []).map(s => String(s.id))

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => discoverApi.getServices(),
    staleTime: 60000,
  })
  const allServices: Service[] = servicesData?.data?.data ?? []

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['swipe-profiles', selectedService],
    queryFn: () => discoverApi.getProfiles({ per_page: 20, ...(selectedService ? { service_id: selectedService } : {}) }),
  })

  const profiles: PublicProfile[] = data?.data?.data ?? []
  const remaining = profiles.slice(index)

  const handleSwipe = async (direction: 'left' | 'right') => {
    const profile = remaining[0]
    if (!profile || swipedRef.current.has(profile.id)) return
    swipedRef.current.add(profile.id)

    if (direction === 'left') {
      setUndoStack(prev => [profile, ...prev].slice(0, 3))
    }

    setIndex(i => i + 1)
    if (index >= profiles.length - 3) refetch()

    try {
      const res = await discoverApi.swipe(profile.id, direction)
      const resData = res?.data?.data
      if (direction === 'right') {
        if (resData?.matched && resData?.conversation_id) {
          setMatchData({
            displayName: resData.matched_profile?.display_name ?? profile.display_name,
            photoUrl: resData.matched_profile?.profile_photo_url ?? profile.profile_photo_url ?? null,
            conversationId: resData.conversation_id,
            icebreakers: generateIcebreakers(profile),
          })
        } else {
          toast(`You vibed ${profile.display_name}! 💚`, 'success')
        }
      }
    } catch { /* ignore */ }
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return
    const [restored, ...rest] = undoStack
    swipedRef.current.delete(restored.id)
    setUndoStack(rest)
    setIndex(i => Math.max(0, i - 1))
    toast('Last skip undone ↩', 'success')
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-dvh">
          <div className="w-80 h-[500px] skeleton rounded-3xl" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* Match overlay */}
      <AnimatePresence>
        {matchData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
            style={{ background: 'linear-gradient(160deg, #0D0D12 0%, #141418 60%, #1C1C22 100%)' }}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
              className="w-full max-w-xs text-center"
            >
              <div className="text-7xl mb-4">⚡</div>
              <h2 className="font-manrope font-extrabold text-4xl text-white mb-2 leading-tight">It's a Match!</h2>
              <p className="text-white/70 text-sm mb-8">
                You and <span className="text-white font-semibold">{matchData.displayName}</span> both vibed!
              </p>

              {matchData.photoUrl ? (
                <img
                  src={matchData.photoUrl}
                  alt={matchData.displayName}
                  className="w-28 h-28 rounded-full object-cover mx-auto mb-8 border-4 border-white/80 shadow-2xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full mx-auto mb-8 border-4 border-white/80 bg-white/20 flex items-center justify-center shadow-2xl">
                  <span className="text-3xl font-manrope font-bold text-white">{getInitials(matchData.displayName)}</span>
                </div>
              )}

              {matchData.icebreakers.length > 0 && (
                <div className="w-full mb-6">
                  <p className="text-white/50 text-xs mb-2 text-center uppercase tracking-wider">Break the ice</p>
                  <div className="space-y-2">
                    {matchData.icebreakers.map((ice, i) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          const convId = matchData.conversationId
                          setMatchData(null)
                          navigate(`/messages/${convId}`, { state: { prefill: ice } })
                        }}
                        className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white/90 text-xs font-medium text-left transition-colors"
                      >
                        {ice}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 w-full">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setMatchData(null); navigate(`/messages/${matchData.conversationId}`) }}
                  className="w-full py-4 rounded-2xl font-manrope font-bold text-base flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: '#C8FF4D', color: '#0A1A00' }}
                >
                  <MessageCircle size={18} /> Say Hello!
                </motion.button>
                <button
                  onClick={() => setMatchData(null)}
                  className="w-full py-3 text-white/60 text-sm font-medium"
                >
                  Keep Vibing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center h-dvh pt-safe pb-[80px]">
        <div className="w-full px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-manrope font-bold text-lg text-[#F2F0EB]">Discover</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#52525E]">{remaining.length} profiles</span>
              <AnimatePresence>
                {undoStack.length > 0 && (
                  <motion.button
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    onClick={handleUndo}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: 'rgba(139,124,255,0.15)', border: '1px solid rgba(139,124,255,0.3)' }}
                    title="Undo last skip"
                  >
                    <Undo2 size={15} style={{ color: '#8B7CFF' }} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
          {/* Activity filter pills */}
          {allServices.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                onClick={() => { setSelectedService(null); setIndex(0); swipedRef.current.clear(); setUndoStack([]) }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${!selectedService ? 'border-[#C8FF4D] text-[#0A1A00]' : 'bg-[#1C1C22] text-[#8B8B9A] border-[#2E2E3A]'}`}
                style={!selectedService ? { background: '#C8FF4D' } : {}}
              >
                All
              </button>
              {allServices.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(String(s.id)); setIndex(0); swipedRef.current.clear(); setUndoStack([]) }}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedService === String(s.id) ? 'border-[#C8FF4D] text-[#0A1A00]' : 'bg-[#1C1C22] text-[#8B8B9A] border-[#2E2E3A]'}`}
                  style={selectedService === String(s.id) ? { background: '#C8FF4D' } : {}}
                >
                  <span>{SERVICE_ICONS[s.slug] ?? '✨'}</span> {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Card stack */}
        <div className="relative flex-1 w-[86%] max-w-sm mx-auto">
          {remaining.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: 'rgba(200,255,77,0.1)', border: '1px solid rgba(200,255,77,0.2)' }}>
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="font-manrope font-bold text-[#F2F0EB] text-lg mb-2">You've seen everyone!</h3>
              <p className="text-[#8B8B9A] text-sm leading-relaxed mb-6">Check back tomorrow for new companions near you</p>
              <div className="flex flex-col gap-3 w-full max-w-[200px]">
                <button
                  onClick={() => navigate('/discover')}
                  className="px-6 py-3 rounded-2xl text-sm font-semibold font-manrope active:scale-95 transition-transform"
                  style={{ background: '#C8FF4D', color: '#0A1A00' }}
                >
                  Browse Discover
                </button>
                <button
                  onClick={() => { setIndex(0); setUndoStack([]); swipedRef.current.clear(); refetch() }}
                  className="px-6 py-3 rounded-2xl border text-sm font-semibold font-manrope active:scale-95 transition-transform"
                  style={{ background: '#1C1C22', borderColor: '#2E2E3A', color: '#8B8B9A' }}
                >
                  Refresh
                </button>
              </div>
            </div>
          ) : (
            [...remaining.slice(0, 3)].reverse().map((profile, i, arr) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                onSwipe={handleSwipe}
                isTop={i === arr.length - 1}
                vibeScore={i === arr.length - 1 ? computeVibeScore(
                  myInterestIds, myLanguageIds, myServiceIds,
                  (profile.interests ?? []).map(x => String(x.id)),
                  (profile.languages ?? []).map(x => String(x.id)),
                  (profile.services ?? []).map(x => String(x.id)),
                ) : undefined}
              />
            ))
          )}
        </div>

        {/* Action buttons */}
        {remaining.length > 0 && (
          <div className="flex items-center justify-center gap-5 pb-4 pt-2">
            <motion.button
              whileTap={{ scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: '#1C1C22', border: '2px solid #2E2E3A' }}
            >
              <X size={26} style={{ color: '#FF5C7A' }} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => { const p = remaining[0]; if (p) discoverApi.saveProfile(p.id).then(() => toast('Saved! 🔖', 'success')) }}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow"
              style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}
            >
              <Bookmark size={18} style={{ color: '#8B8B9A' }} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => handleSwipe('right')}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: '#C8FF4D', boxShadow: '0 4px 24px rgba(200,255,77,0.35)' }}
            >
              <Heart size={26} style={{ color: '#0A1A00', fill: '#0A1A00' }} />
            </motion.button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
