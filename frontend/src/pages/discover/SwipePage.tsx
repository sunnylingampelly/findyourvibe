import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useMotionValue, useTransform, useAnimation, type PanInfo } from 'framer-motion'
import { X, Heart, Info, Bookmark, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { discoverApi } from '../../api/discover'
import { useToast } from '../../components/ui/Toast'
import AppShell from '../../components/layout/AppShell'
import { getInitials } from '../../lib/utils'
import type { PublicProfile } from '../../types'

function SwipeCard({ profile, onSwipe, isTop }: { profile: PublicProfile; onSwipe: (dir: 'left' | 'right') => void; isTop: boolean }) {
  const navigate = useNavigate()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const passOpacity = useTransform(x, [-100, -20], [1, 0])
  const controls = useAnimation()

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x
    if (offset > 100 || velocity > 500) {
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } })
      onSwipe('right')
    } else if (offset < -100 || velocity < -500) {
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } })
      onSwipe('left')
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } })
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
      {/* Like overlay */}
      <motion.div className="absolute inset-0 bg-[#236B63]/60 z-10 flex items-center justify-center rounded-3xl" style={{ opacity: likeOpacity }}>
        <div className="border-4 border-white rounded-2xl px-8 py-3 rotate-[-15deg]">
          <span className="font-manrope font-extrabold text-4xl text-white">VIBE</span>
        </div>
      </motion.div>
      {/* Pass overlay */}
      <motion.div className="absolute inset-0 bg-[#D98D7A]/60 z-10 flex items-center justify-center rounded-3xl" style={{ opacity: passOpacity }}>
        <div className="border-4 border-white rounded-2xl px-8 py-3 rotate-[15deg]">
          <span className="font-manrope font-extrabold text-4xl text-white">PASS</span>
        </div>
      </motion.div>
      <CardContent profile={profile} onInfo={() => navigate(`/profiles/${profile.id}`)} />
    </motion.div>
  )
}

function CardContent({ profile, onInfo }: { profile: PublicProfile; onInfo: () => void }) {
  return (
    <div className="w-full h-full relative bg-[#A8C5B5]">
      {profile.profile_photo_url ? (
        <img src={profile.profile_photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#A8C5B5] to-[#236B63] flex items-center justify-center">
          <span className="text-7xl font-manrope font-bold text-white">{getInitials(profile.display_name)}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h2 className="font-manrope font-extrabold text-2xl text-white">
          {profile.display_name}{profile.age ? `, ${profile.age}` : ''}
        </h2>
        {profile.city && (
          <p className="text-white/80 text-sm flex items-center gap-1 mt-1"><MapPin size={13} />{profile.city.name}</p>
        )}
        {profile.bio && <p className="text-white/70 text-sm mt-2 line-clamp-2">{profile.bio}</p>}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {profile.interests.slice(0, 3).map(i => (
              <span key={i.id} className="text-xs bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">{i.name}</span>
            ))}
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); onInfo() }} className="absolute top-[-180px] right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
          <Info size={18} />
        </button>
      </div>
    </div>
  )
}

export default function SwipePage() {
  const { toast } = useToast()
  const [index, setIndex] = useState(0)
  const swipedRef = useRef(new Set<string>())

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['swipe-profiles'],
    queryFn: () => discoverApi.getProfiles({ per_page: 20 }),
  })

  const profiles: PublicProfile[] = data?.data?.data ?? []
  const remaining = profiles.slice(index)

  const handleSwipe = async (direction: 'left' | 'right') => {
    const profile = remaining[0]
    if (!profile || swipedRef.current.has(profile.id)) return
    swipedRef.current.add(profile.id)

    try {
      await discoverApi.swipe(profile.id, direction)
      if (direction === 'right') toast(`You liked ${profile.display_name}! 💚`, 'success')
    } catch { /* ignore */ }

    setIndex(i => i + 1)
    if (index >= profiles.length - 3) refetch()
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
      <div className="flex flex-col items-center h-dvh pt-safe pb-[80px]">
        <div className="text-center py-3">
          <h1 className="font-manrope font-bold text-lg text-[#24332F]">Discover</h1>
          <p className="text-xs text-[#A1AAA5]">{remaining.length} profiles nearby</p>
        </div>

        {/* Card stack */}
        <div className="relative flex-1 w-full max-w-sm mx-auto px-4">
          {remaining.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="font-manrope font-semibold text-[#24332F] mb-2">You've seen everyone!</h3>
              <p className="text-[#77817C] text-sm mb-6">Check back later for new companions in your area.</p>
              <button onClick={() => { setIndex(0); swipedRef.current.clear(); refetch() }} className="text-[#236B63] font-semibold text-sm">Refresh</button>
            </div>
          ) : (
            /* Render back-to-front: last in DOM = visually on top */
            [...remaining.slice(0, 3)].reverse().map((profile, i, arr) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                onSwipe={handleSwipe}
                isTop={i === arr.length - 1}
              />
            ))
          )}
        </div>

        {/* Action buttons */}
        {remaining.length > 0 && (
          <div className="flex items-center gap-6 pb-4">
            <motion.button
              whileTap={{ scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => handleSwipe('left')}
              className="w-14 h-14 bg-white border-2 border-[#E8EAE6] rounded-full flex items-center justify-center shadow-md"
            >
              <X size={24} className="text-[#D98D7A]" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => { const p = remaining[0]; if (p) discoverApi.saveProfile(p.id).then(() => toast('Saved!', 'success')) }}
              className="w-10 h-10 bg-white border border-[#E8EAE6] rounded-full flex items-center justify-center shadow"
            >
              <Bookmark size={18} className="text-[#A1AAA5]" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.82 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => handleSwipe('right')}
              className="w-14 h-14 bg-[#236B63] rounded-full flex items-center justify-center shadow-md"
            >
              <Heart size={24} className="text-white" />
            </motion.button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
