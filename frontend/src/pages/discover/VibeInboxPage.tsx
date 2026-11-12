import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Heart, MapPin, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { vibesApi } from '../../api/vibes'
import { discoverApi } from '../../api/discover'
import { useToast } from '../../components/ui/Toast'
import AppShell from '../../components/layout/AppShell'
import Avatar from '../../components/ui/Avatar'
import { getInitials } from '../../lib/utils'

interface ViberProfile {
  swipe_id: string
  id: string
  display_name: string
  age?: number
  profile_photo_url?: string
  city?: { id: string; name: string }
  country?: { id: string; name: string }
  bio?: string
  identity_verified?: boolean
  vibed_at?: string
}

interface MatchData {
  displayName: string
  photoUrl: string | null
  conversationId: string
}

export default function VibeInboxPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['vibes-received'],
    queryFn: () => vibesApi.received(),
    refetchInterval: 30000,
  })

  const vibers: ViberProfile[] = data?.data?.data?.data ?? []

  const handleVibeBack = async (vibe: ViberProfile) => {
    if (pendingIds.has(vibe.id)) return
    setPendingIds(prev => new Set(prev).add(vibe.id))

    try {
      const res = await discoverApi.swipe(vibe.id, 'right')
      const resData = res?.data?.data
      qc.invalidateQueries({ queryKey: ['vibes-received'] })

      if (resData?.matched && resData?.conversation_id) {
        setMatchData({
          displayName: resData.matched_profile?.display_name ?? vibe.display_name,
          photoUrl: resData.matched_profile?.profile_photo_url ?? vibe.profile_photo_url ?? null,
          conversationId: resData.conversation_id,
        })
      } else {
        toast(`You vibed ${vibe.display_name}! 💚`, 'success')
      }
    } catch {
      toast('Could not vibe back', 'error')
    } finally {
      setPendingIds(prev => { const s = new Set(prev); s.delete(vibe.id); return s })
    }
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
            style={{ background: 'linear-gradient(160deg, #1A5750 0%, #236B63 60%, #15453F 100%)' }}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
              className="w-full max-w-xs text-center"
            >
              <div className="text-7xl mb-4">💚</div>
              <h2 className="font-manrope font-extrabold text-4xl text-white mb-2 leading-tight">It's a Match!</h2>
              <p className="text-white/70 text-sm mb-8">
                You and <span className="text-white font-semibold">{matchData.displayName}</span> both vibed!
              </p>
              {matchData.photoUrl ? (
                <img src={matchData.photoUrl} alt={matchData.displayName} className="w-28 h-28 rounded-full object-cover mx-auto mb-8 border-4 border-white/80 shadow-2xl" />
              ) : (
                <div className="w-28 h-28 rounded-full mx-auto mb-8 border-4 border-white/80 bg-white/20 flex items-center justify-center shadow-2xl">
                  <span className="text-3xl font-manrope font-bold text-white">{getInitials(matchData.displayName)}</span>
                </div>
              )}
              <div className="space-y-3 w-full">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setMatchData(null); navigate(`/messages/${matchData.conversationId}`) }}
                  className="w-full py-4 bg-white rounded-2xl font-manrope font-bold text-[#236B63] text-base flex items-center justify-center gap-2 shadow-lg"
                >
                  💬 Say Hello!
                </motion.button>
                <button onClick={() => setMatchData(null)} className="w-full py-3 text-white/60 text-sm font-medium">
                  Keep Browsing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-dvh pt-safe pb-[80px] overflow-y-auto screen-scroll">
        <div className="sticky top-0 z-10 bg-[#FAF9F6] border-b border-[#E8EAE6] px-4 py-3">
          <h1 className="font-manrope font-bold text-lg text-[#24332F]">Vibed You</h1>
          <p className="text-xs text-[#A1AAA5]">People who vibed with you</p>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 skeleton rounded-2xl" />
            ))}
          </div>
        ) : vibers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="text-6xl mb-4">💚</div>
            <h3 className="font-manrope font-semibold text-[#24332F] mb-2">No vibes yet</h3>
            <p className="text-[#77817C] text-sm leading-relaxed">When someone vibes with your profile, they'll appear here. Go swipe to get vibed back!</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {vibers.map(vibe => (
              <motion.div
                key={vibe.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-[#E8EAE6] p-4 flex items-center gap-3 shadow-sm"
              >
                <button onClick={() => navigate(`/profiles/${vibe.id}`)} className="shrink-0">
                  <Avatar
                    src={vibe.profile_photo_url}
                    name={vibe.display_name}
                    size="lg"
                    className="border-2 border-white shadow"
                  />
                </button>

                <button onClick={() => navigate(`/profiles/${vibe.id}`)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-manrope font-semibold text-[#24332F] text-sm truncate">
                      {vibe.display_name}{vibe.age ? `, ${vibe.age}` : ''}
                    </span>
                    {vibe.identity_verified && (
                      <ShieldCheck size={13} className="text-[#236B63] shrink-0" />
                    )}
                  </div>
                  {vibe.city && (
                    <p className="text-xs text-[#A1AAA5] flex items-center gap-1 mb-0.5">
                      <MapPin size={10} />{vibe.city.name}
                    </p>
                  )}
                  {vibe.bio && (
                    <p className="text-xs text-[#77817C] line-clamp-1 leading-relaxed">{vibe.bio}</p>
                  )}
                  {vibe.vibed_at && (
                    <p className="text-[10px] text-[#A1AAA5] mt-0.5">{vibe.vibed_at}</p>
                  )}
                </button>

                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleVibeBack(vibe)}
                  disabled={pendingIds.has(vibe.id)}
                  className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#4D9274] to-[#236B63] flex items-center justify-center shadow disabled:opacity-50"
                >
                  <Heart size={18} className="text-white fill-white" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
