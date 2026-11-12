import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Star, Bookmark, Heart, Flag, MessageCircle, Languages, Clock, CheckCircle2, CalendarDays, IndianRupee, UserPlus, Lock, Send, Play, Pause, Mic } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { discoverApi } from '../../api/discover'
import { connectionsApi } from '../../api/connections'
import { profileApi } from '../../api/profile'
import { bookingsApi } from '../../api/bookings'
import { reviewsApi } from '../../api/reviews'
import { packagesApi } from '../../api/packages'
import { useToast } from '../../components/ui/Toast'
import { Skeleton } from '../../components/ui/Skeleton'
import Button from '../../components/ui/Button'
import BottomSheet from '../../components/ui/BottomSheet'
import { staticMapUrl } from '../../components/ui/PlacesAutocomplete'
import { getInitials } from '../../lib/utils'
import type { PublicProfile, Service, Review, ExperiencePackage } from '../../types'

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

type Tab = 'about' | 'services' | 'reviews'

function VoicePlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E8EAE6] p-4 flex items-center gap-3">
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full bg-[#236B63] flex items-center justify-center shrink-0"
      >
        {playing ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#24332F] font-manrope flex items-center gap-1.5">
          <Mic size={11} className="text-[#236B63]" /> Voice Intro
        </p>
        <p className="text-[10px] text-[#A1AAA5] mt-0.5">Tap to listen</p>
      </div>
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
    </div>
  )
}

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [showConnect, setShowConnect] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showBook, setShowBook] = useState(false)
  const [bookingService, setBookingService] = useState<Service | null>(null)
  const [connectMessage, setConnectMessage] = useState('')
  const [tab, setTab] = useState<Tab>('about')
  const [bookDate, setBookDate] = useState('')
  const [bookTime, setBookTime] = useState('')
  const [bookDuration, setBookDuration] = useState('2')
  const [bookNotes, setBookNotes] = useState('')
  const [bookPlusOneName, setBookPlusOneName] = useState('')
  const [bookPlusOnePhone, setBookPlusOnePhone] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<ExperiencePackage | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => discoverApi.getProfile(id!),
    enabled: !!id,
  })

  // Check accepted connections
  const { data: connsData } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsApi.getConnections(),
  })
  const connections: Array<{ id: string; other_user: { id: string }; conversation_id?: string }> =
    connsData?.data?.data ?? []
  const myConnection = connections.find(c => c.other_user?.id === id)

  // Check pending sent requests
  const { data: sentData } = useQuery({
    queryKey: ['connections-sent'],
    queryFn: () => connectionsApi.getSent(),
  })
  const sentRequests: Array<{ id: string; receiver: { id: string } }> =
    sentData?.data?.data ?? []
  const pendingRequest = sentRequests.find(r => r.receiver?.id === id)

  // 3-state: connected | pending | none
  const connState: 'connected' | 'pending' | 'none' =
    myConnection ? 'connected' : pendingRequest ? 'pending' : 'none'

  const profile: PublicProfile | undefined = data?.data?.data

  const { data: reviewsData } = useQuery({
    queryKey: ['profile-reviews', id],
    queryFn: () => reviewsApi.forProfile(id!),
    enabled: !!id,
  })
  const reviews: Review[] = reviewsData?.data?.data ?? []

  const { data: packagesData } = useQuery({
    queryKey: ['companion-packages', id],
    queryFn: () => packagesApi.forCompanion(id!),
    enabled: !!id,
  })
  const packages: ExperiencePackage[] = packagesData?.data?.data ?? []

  // bookLocation derived AFTER profile is available
  const bookLocation = [profile?.city?.name, profile?.country?.name].filter(Boolean).join(', ')

  // Saved profiles — derive save state from query (never stale local boolean)
  const { data: savedData } = useQuery({
    queryKey: ['saved-profiles'],
    queryFn: () => discoverApi.getSavedProfiles(),
  })
  const savedRecord: { id: string } | undefined =
    savedData?.data?.data?.find((s: { id: string; user: { id: string } }) => s.user?.id === id)
  const isSaved = !!savedRecord

  const connectMutation = useMutation({
    mutationFn: () => connectionsApi.sendRequest(id!, connectMessage),
    onSuccess: () => {
      toast('Connection request sent! 🎉', 'success')
      setShowConnect(false)
      qc.invalidateQueries({ queryKey: ['connections-sent'] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg ?? 'Could not send request', 'error')
    },
  })

  const bookMutation = useMutation({
    mutationFn: () => bookingsApi.createBooking({
      companion_id: id!,
      service_id: Number(bookingService!.id),
      package_id: selectedPackage?.id,
      proposed_date: bookDate,
      proposed_time: bookTime,
      duration_hours: selectedPackage?.duration_hours ? String(selectedPackage.duration_hours) : bookDuration,
      notes: bookNotes,
      location_notes: bookLocation,
      agreed_rate: selectedPackage?.price ?? bookingService?.price_per_session ?? undefined,
      plus_one_name: bookPlusOneName || undefined,
      plus_one_phone: bookPlusOnePhone || undefined,
    }),
    onSuccess: async () => {
      setShowBook(false)
      qc.invalidateQueries({ queryKey: ['bookings'] })

      try {
        const convsRes = await connectionsApi.getConversations()
        const convs: Array<{ id: string; other_user?: { id: string } }> = convsRes.data?.data ?? []
        const existingConv = convs.find(c => c.other_user?.id === id)

        if (existingConv) {
          navigate(`/messages/${existingConv.id}`)
          return
        }

        if (myConnection) {
          const newConvRes = await connectionsApi.createConversation(myConnection.id)
          const convId = newConvRes.data?.data?.id
          qc.invalidateQueries({ queryKey: ['conversations'] })
          if (convId) { navigate(`/messages/${convId}`); return }
        }

        toast('Booking sent! 🎉 Chat to coordinate details', 'success')
        navigate('/messages')
      } catch {
        toast('Booking sent! 🎉', 'success')
        navigate('/messages')
      }
    },
    onError: () => toast('Could not send booking request', 'error'),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved && savedRecord) {
        await discoverApi.unsaveProfile(savedRecord.id)
      } else {
        await discoverApi.saveProfile(id!)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-profiles'] })
      toast(isSaved ? 'Removed from saved' : 'Profile saved! 🔖', 'success')
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      if (msg === 'Profile already saved.') {
        qc.invalidateQueries({ queryKey: ['saved-profiles'] })
        return
      }
      toast(msg ?? 'Could not update saved', 'error')
    },
  })

  if (isLoading || !profile) {
    return (
      <div className="app-container min-h-dvh bg-[#FAF9F6]">
        <div className="h-[55vh] skeleton" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="mt-5 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  const hasAbout = !!(profile.introduction || profile.bio || (profile.interests && profile.interests.length > 0) || (profile.languages && profile.languages.length > 0))
  const hasServices = !!(profile.services && profile.services.length > 0)

  return (
    <div className="app-container min-h-dvh bg-[#FAF9F6] overflow-y-auto screen-scroll">
      {/* Full-bleed hero */}
      <div className="relative" style={{ height: '62vh', minHeight: 320 }}>
        {profile.profile_photo_url ? (
          <img src={profile.profile_photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#A8C5B5] to-[#194E49] flex items-center justify-center">
            <span className="font-manrope font-extrabold text-7xl text-white">{getInitials(profile.display_name)}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/15" />

        {/* Nav buttons */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 pt-safe">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-black/35 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-opacity disabled:opacity-60 ${isSaved ? 'bg-[#236B63] border-[#236B63] text-white' : 'bg-black/35 border-white/10 text-white'}`}
            >
              <Bookmark size={18} fill={isSaved ? 'white' : 'none'} />
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="w-10 h-10 bg-black/35 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10"
            >
              <Flag size={18} />
            </button>
          </div>
        </div>

        {/* Identity bar — frosted glass over hero */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
          {/* Rating badge */}
          {profile.avg_rating && profile.avg_rating > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              {[1,2,3,4,5].map(n => (
                <Star
                  key={n}
                  size={13}
                  className={Number(profile.avg_rating) >= n ? 'text-[#D9A45B] fill-[#D9A45B]' : 'text-white/30'}
                />
              ))}
              <span className="text-white/80 text-xs ml-1">{Number(profile.avg_rating).toFixed(1)} · {profile.rating_count ?? 0} reviews</span>
            </div>
          )}

          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="font-manrope font-extrabold text-[1.75rem] text-white leading-tight tracking-tight">
                  {profile.display_name}{profile.age ? `, ${profile.age}` : ''}
                </h1>
                {profile.companion_verification_status === 'approved' && (
                  <CheckCircle2 size={20} className="text-[#4D9274] fill-white shrink-0" />
                )}
                {profile.identity_verified && (
                  <span className="text-[9px] font-bold bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/30 shrink-0">
                    🆔 ID Verified
                  </span>
                )}
              </div>
              {profile.city && (
                <p className="text-white/70 text-sm flex items-center gap-1">
                  <MapPin size={13} />
                  {profile.city.name}{profile.country ? `, ${profile.country.name}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Interest tags on hero */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {profile.interests.slice(0, 4).map(i => (
                <span key={i.id} className="text-xs bg-white/15 backdrop-blur-sm text-white px-3 py-1 rounded-full border border-white/15">
                  {i.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E8EAE6]">
        <div className="flex">
          {(['about', 'services', 'reviews'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3.5 text-sm font-semibold font-manrope capitalize relative transition-colors ${
                tab === t ? 'text-[#236B63]' : 'text-[#A1AAA5]'
              }`}
            >
              {t}
              {tab === t && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#236B63] rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="px-4 py-5 pb-32"
        >
          {tab === 'about' && (
            <div className="space-y-5">
              {!hasAbout && !profile.voice_intro_url && !(profile.prompt_1_q && profile.prompt_1_a) && (
                <p className="text-[#A1AAA5] text-sm text-center py-8">No profile details yet.</p>
              )}

              {/* Voice intro */}
              {profile.voice_intro_url && (
                <VoicePlayer url={profile.voice_intro_url} />
              )}

              {/* Profile prompts */}
              {([
                { q: profile.prompt_1_q, a: profile.prompt_1_a },
                { q: profile.prompt_2_q, a: profile.prompt_2_a },
                { q: profile.prompt_3_q, a: profile.prompt_3_a },
              ] as Array<{ q?: string; a?: string }>).filter(p => p.q && p.a).map((p, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#E8EAE6] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1AAA5] mb-1">{p.q}</p>
                  <p className="text-[#24332F] leading-relaxed text-[0.925rem]">{p.a}</p>
                </div>
              ))}

              {profile.introduction && (
                <div className="bg-white rounded-2xl p-4 border border-[#E8EAE6]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1AAA5] mb-2">Introduction</p>
                  <p className="text-[#24332F] leading-relaxed text-[0.925rem]">{profile.introduction}</p>
                </div>
              )}

              {profile.bio && (
                <div className="bg-white rounded-2xl p-4 border border-[#E8EAE6]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1AAA5] mb-2">About</p>
                  <p className="text-[#24332F] leading-relaxed text-[0.925rem]">{profile.bio}</p>
                </div>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1AAA5] mb-3">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map(i => (
                      <span key={i.id} className="px-3.5 py-1.5 bg-[#E8F0EA] text-[#236B63] rounded-full text-sm font-medium border border-[#C8DDD2]">
                        {i.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.languages && profile.languages.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1AAA5] mb-3 flex items-center gap-1.5">
                    <Languages size={11} /> Languages
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map(l => (
                      <span key={l.id} className="px-3.5 py-1.5 bg-[#F4F1EA] text-[#77817C] rounded-full text-sm border border-[#E8E5DC]">
                        {l.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* City location map */}
              {profile.city && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1AAA5] mb-3 flex items-center gap-1.5">
                    <MapPin size={11} /> Location
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-[#E8EAE6] relative">
                    <img
                      src={staticMapUrl(profile.city.name, profile.country?.name)}
                      alt={`Map of ${profile.city.name}`}
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                      <p className="text-white text-sm font-semibold flex items-center gap-1.5">
                        <MapPin size={13} />
                        {profile.city.name}{profile.country ? `, ${profile.country.name}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'services' && (
            <div className="space-y-3">
              {/* Experience packages */}
              {packages.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1AAA5] mb-3 flex items-center gap-1.5">
                    ✨ Experience Packages
                  </p>
                  <div className="space-y-3">
                    {packages.map(pkg => (
                      <div key={pkg.id} className="bg-gradient-to-br from-[#E8F0EA] to-[#F4F9F7] rounded-2xl p-4 border border-[#C8DDD2]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-manrope font-semibold text-[#24332F] text-sm">{pkg.title}</p>
                            {pkg.description && (
                              <p className="text-[#77817C] text-xs mt-0.5 leading-relaxed">{pkg.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-[#236B63] text-xs font-bold">
                                {pkg.currency === 'INR' ? '₹' : pkg.currency}{Number(pkg.price).toLocaleString('en-IN')}
                              </span>
                              {pkg.duration_hours && (
                                <span className="text-[#77817C] text-xs flex items-center gap-0.5">
                                  <Clock size={10} /> {pkg.duration_hours}h
                                </span>
                              )}
                              {pkg.location_type && (
                                <span className="text-[#77817C] text-xs">{pkg.location_type}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {profile.companion_verification_status === 'approved' && myConnection && (
                          <button
                            onClick={() => {
                              setSelectedPackage(pkg)
                              setBookDuration(pkg.duration_hours ? String(pkg.duration_hours) : '2')
                              setBookingService(profile.services?.[0] ?? null)
                              setShowBook(true)
                            }}
                            className="mt-3 w-full py-2 rounded-xl bg-[#236B63] text-white text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                          >
                            <CalendarDays size={15} /> Book this package
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!hasServices ? (
                <p className="text-[#A1AAA5] text-sm text-center py-8">No services listed yet.</p>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1AAA5] mb-4 flex items-center gap-1.5">
                    <Clock size={11} /> Available For
                  </p>
                  {profile.services!.map(s => (
                    <div key={s.id} className="bg-white rounded-2xl p-4 border border-[#E8EAE6]">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-[#E8F0EA] rounded-xl flex items-center justify-center text-xl shrink-0">
                          {SERVICE_ICONS[s.slug] || '✨'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-manrope font-semibold text-[#24332F] text-sm">{s.name}</p>
                          {s.price_per_session != null && (
                            <p className="text-[#236B63] text-xs font-semibold mt-0.5 flex items-center gap-0.5">
                              <IndianRupee size={11} />{Number(s.price_per_session).toLocaleString('en-IN')}
                              <span className="text-[#A1AAA5] font-normal ml-0.5">
                                {s.price_unit === 'per_hour' ? '/hr' : s.price_unit === 'negotiable' ? '(negotiable)' : '/session'}
                              </span>
                            </p>
                          )}
                          {s.description && (
                            <p className="text-[#A1AAA5] text-xs mt-0.5 leading-relaxed">{s.description}</p>
                          )}
                        </div>
                      </div>
                      {profile.companion_verification_status === 'approved' && (
                        myConnection ? (
                          <button
                            onClick={() => { setBookingService(s); setSelectedPackage(null); setShowBook(true) }}
                            className="mt-3 w-full py-2 rounded-xl bg-[#E8F0EA] text-[#236B63] text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                          >
                            <CalendarDays size={15} /> Book this service
                          </button>
                        ) : (
                          <div className="mt-3 w-full py-2 rounded-xl bg-[#F4F1EA] border border-[#E8EAE6] flex items-center justify-center gap-1.5">
                            <Lock size={13} className="text-[#A1AAA5]" />
                            <span className="text-[#A1AAA5] text-xs font-semibold">Connect first to book</span>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="space-y-4">
              {profile.avg_rating && profile.avg_rating > 0 ? (
                <div className="bg-white rounded-2xl p-5 border border-[#E8EAE6] text-center">
                  <div className="font-manrope font-extrabold text-5xl text-[#24332F] mb-1">{Number(profile.avg_rating).toFixed(1)}</div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={16} className={Number(profile.avg_rating) >= n ? 'text-[#D9A45B] fill-[#D9A45B]' : 'text-[#E8EAE6]'} />
                    ))}
                  </div>
                  <p className="text-[#A1AAA5] text-sm">{profile.rating_count ?? 0} reviews</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-[#E8F0EA] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Star size={22} className="text-[#236B63]" />
                  </div>
                  <p className="text-[#A1AAA5] text-sm">No reviews yet</p>
                  <p className="text-[#A1AAA5] text-xs mt-1">Reviews appear after both parties submit one</p>
                </div>
              )}
              {reviews.length > 0 && (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl border border-[#E8EAE6] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} size={13} className={n <= r.rating ? 'text-[#D9A45B] fill-[#D9A45B]' : 'text-[#E8EAE6]'} />
                          ))}
                        </div>
                        <span className="text-[10px] text-[#A1AAA5]">{r.created_at}</span>
                      </div>
                      {r.body && <p className="text-sm text-[#24332F] leading-relaxed mb-2">{r.body}</p>}
                      <p className="text-[10px] text-[#A1AAA5] capitalize">{r.reviewer_role} · {r.reviewer_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur-xl border-t border-[#E8EAE6] p-4 pb-safe">
        <div className="flex gap-3">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-all disabled:opacity-60 ${
              isSaved ? 'bg-[#E8F0EA] border-[#C8DDD2] text-[#236B63]' : 'bg-white border-[#E8EAE6] text-[#A1AAA5]'
            }`}
          >
            <Heart size={20} fill={isSaved ? '#236B63' : 'none'} />
          </button>
          {connState === 'connected' && (
            <Button
              className="flex-1 !h-12"
              onClick={async () => {
                try {
                  const convsRes = await connectionsApi.getConversations()
                  const convs: Array<{ id: string; other_user?: { id: string } }> = convsRes.data?.data ?? []
                  const conv = convs.find(c => c.other_user?.id === id)
                  if (conv) { navigate(`/messages/${conv.id}`); return }
                  const newConv = await connectionsApi.createConversation(myConnection!.id)
                  navigate(`/messages/${newConv.data?.data?.id}`)
                } catch { navigate('/messages') }
              }}
            >
              <MessageCircle size={18} /> Message {profile.display_name.split(' ')[0]}
            </Button>
          )}
          {connState === 'pending' && (
            <div className="flex-1 h-12 rounded-2xl bg-[#FFF8EE] border border-[#F5D99A] flex items-center justify-center gap-2">
              <Send size={16} className="text-[#D9A45B]" />
              <span className="text-[#D9A45B] font-semibold text-sm">Request Sent</span>
            </div>
          )}
          {connState === 'none' && (
            <Button className="flex-1 !h-12" onClick={() => setShowConnect(true)}>
              <UserPlus size={18} /> Connect with {profile.display_name.split(' ')[0]}
            </Button>
          )}
        </div>
      </div>

      {/* Connect sheet */}
      <BottomSheet open={showConnect} onClose={() => setShowConnect(false)} title="Send Connection Request">
        <div className="space-y-4">
          {connState === 'pending' ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-[#FFF8EE] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Send size={22} className="text-[#D9A45B]" />
              </div>
              <p className="font-semibold text-[#24332F] mb-1">Request Already Sent</p>
              <p className="text-sm text-[#77817C]">
                You've already sent a connection request to <strong>{profile.display_name}</strong>. Wait for them to accept.
              </p>
            </div>
          ) : connState === 'connected' ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-[#E8F0EA] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={22} className="text-[#236B63]" />
              </div>
              <p className="font-semibold text-[#24332F] mb-1">Already Connected</p>
              <p className="text-sm text-[#77817C]">You are already connected with {profile.display_name}.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#77817C] leading-relaxed">
                Add a personal message to increase your chances of connecting with <strong className="text-[#24332F]">{profile.display_name}</strong>.
              </p>
              <textarea
                value={connectMessage}
                onChange={e => setConnectMessage(e.target.value)}
                placeholder={`Hey ${profile.display_name.split(' ')[0]}! I'd love to connect…`}
                rows={4}
                className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none"
              />
              <Button size="lg" loading={connectMutation.isPending} onClick={() => connectMutation.mutate()}>
                Send Request
              </Button>
            </>
          )}
        </div>
      </BottomSheet>

      {/* Report sheet */}
      <BottomSheet open={showReport} onClose={() => setShowReport(false)} title="Report Profile">
        <div className="space-y-2">
          {['Inappropriate behaviour', 'Fake profile', 'Harassment', 'Suspicious activity', 'Misleading information', 'Other'].map(cat => (
            <button
              key={cat}
              className="w-full text-left px-4 py-3 rounded-2xl border border-[#E8EAE6] text-sm text-[#24332F] hover:bg-[#FFF0EE] hover:border-[#D76D6D] transition-colors"
              onClick={() => {
                profileApi.report(id!, cat.toLowerCase().replace(/ /g, '_'), cat)
                toast('Report submitted', 'success')
                setShowReport(false)
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Booking sheet */}
      <BottomSheet open={showBook} onClose={() => { setShowBook(false); setSelectedPackage(null); setBookPlusOneName(''); setBookPlusOnePhone('') }} title={selectedPackage ? `Book: ${selectedPackage.title}` : `Book ${bookingService?.name ?? 'Service'}`}>
        <div className="space-y-4">
          {bookingService && (
            <div className="bg-[#E8F0EA] rounded-2xl p-3 flex items-center gap-3">
              <span className="text-2xl">{SERVICE_ICONS[bookingService.slug] || '✨'}</span>
              <div>
                <p className="font-semibold text-[#24332F] text-sm">{bookingService.name}</p>
                {bookingService.price_per_session != null && (
                  <p className="text-[#236B63] text-xs font-semibold flex items-center gap-0.5">
                    <IndianRupee size={10} />{Number(bookingService.price_per_session).toLocaleString('en-IN')}
                    <span className="text-[#77817C] font-normal ml-0.5">
                      {bookingService.price_unit === 'per_hour' ? '/hr' : bookingService.price_unit === 'negotiable' ? '(negotiable)' : '/session'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Date *</label>
              <input
                type="date"
                value={bookDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setBookDate(e.target.value)}
                className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] focus:outline-none focus:border-[#236B63]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Time *</label>
              <input
                type="time"
                value={bookTime}
                onChange={e => setBookTime(e.target.value)}
                className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] focus:outline-none focus:border-[#236B63]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Duration (hours)</label>
            <select
              value={bookDuration}
              onChange={e => setBookDuration(e.target.value)}
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] focus:outline-none focus:border-[#236B63] bg-white"
            >
              {['1', '2', '3', '4', '5', '6', '8'].map(h => (
                <option key={h} value={h}>{h} hour{h !== '1' ? 's' : ''}</option>
              ))}
            </select>
          </div>

          {/* Companion's location — not user-selectable */}
          {bookLocation && (
            <div className="bg-[#F4F9F7] border border-[#C8DDD2] rounded-xl px-4 py-3 flex items-center gap-2.5">
              <MapPin size={15} className="text-[#236B63] shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-[#A1AAA5] uppercase tracking-wide">Companion's location</p>
                <p className="text-sm font-medium text-[#24332F]">{bookLocation}</p>
              </div>
            </div>
          )}
          <p className="text-xs text-[#77817C] -mt-1 ml-0.5">
            The companion operates from their location. You'll arrange the exact meeting spot over chat.
          </p>

          <div>
            <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Your message</label>
            <textarea
              value={bookNotes}
              onChange={e => setBookNotes(e.target.value)}
              placeholder="Tell them what you're looking for, any preferences..."
              rows={3}
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none"
            />
          </div>

          {/* Bring a friend */}
          <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-[#E8EAE6]">
            <p className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-3">Bringing a friend? (optional)</p>
            <div className="space-y-2.5">
              <input
                value={bookPlusOneName}
                onChange={e => setBookPlusOneName(e.target.value)}
                placeholder="Friend's name"
                className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63]"
              />
              <input
                value={bookPlusOnePhone}
                onChange={e => setBookPlusOnePhone(e.target.value)}
                placeholder="Friend's phone (optional)"
                type="tel"
                className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63]"
              />
            </div>
          </div>

          <p className="text-xs text-[#A1AAA5] leading-relaxed">
            No payment required. You'll coordinate details directly with {profile.display_name.split(' ')[0]} after they accept.
          </p>

          <Button
            size="lg"
            loading={bookMutation.isPending}
            disabled={!bookDate || !bookTime}
            onClick={() => bookMutation.mutate()}
          >
            <CalendarDays size={18} /> Send Booking Request
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
