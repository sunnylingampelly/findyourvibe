import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, MessageCircle, ChevronRight, Shield, Star, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { bookingsApi } from '../../api/bookings'
import { connectionsApi } from '../../api/connections'
import { reviewsApi } from '../../api/reviews'
import { safeMeetApi } from '../../api/safeMeet'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/ui/Toast'
import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'
import Avatar from '../../components/ui/Avatar'
import BottomSheet from '../../components/ui/BottomSheet'
import Button from '../../components/ui/Button'
import type { Booking, SafeMeet } from '../../types'

const SERVICE_ICONS: Record<string, string> = {
  'movie-companion': '🎬', 'coffee-buddy': '☕', 'event-companion': '🎭',
  'travel-buddy': '✈️', 'shopping-companion': '🛍️', 'food-explorer': '🍜',
  'city-explorer': '🗺️', 'weekend-companion': '🌅', 'adventure-companion': '🏔️', 'gaming-buddy': '🎮',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#FF9F43', bg: 'rgba(255,159,67,0.12)' },
  accepted:  { label: 'Confirmed', color: '#C8FF4D', bg: 'rgba(200,255,77,0.12)' },
  declined:  { label: 'Declined',  color: '#FF5C7A', bg: 'rgba(255,92,122,0.12)' },
  cancelled: { label: 'Cancelled', color: '#52525E', bg: 'rgba(82,82,94,0.15)'   },
  completed: { label: 'Completed', color: '#8B7CFF', bg: 'rgba(139,124,255,0.12)' },
}

const inputStyle = { background: '#1C1C22', border: '1px solid #2E2E3A', color: '#F2F0EB' }

function getCountdownLabel(dateStr: string, timeStr?: string | null): { label: string; color: string; bg: string } | null {
  const bookingDate = new Date(dateStr)
  const now = new Date()
  const todayStr = now.toDateString()
  const tomorrowDate = new Date(now); tomorrowDate.setDate(now.getDate() + 1)

  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number)
    bookingDate.setHours(h ?? 0, m ?? 0, 0, 0)
  } else {
    bookingDate.setHours(23, 59, 0, 0)
  }

  const diffMs = bookingDate.getTime() - now.getTime()
  if (diffMs < 0) return null // past

  const diffH = diffMs / (1000 * 60 * 60)
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffH <= 3) return { label: '⏰ Starting soon!', color: '#FF9F43', bg: 'rgba(255,159,67,0.15)' }
  if (diffH <= 24) return { label: '⏰ Starting soon!', color: '#FF9F43', bg: 'rgba(255,159,67,0.15)' }
  if (bookingDate.toDateString() === todayStr) return { label: 'Today! 🎉', color: '#C8FF4D', bg: 'rgba(200,255,77,0.12)' }
  if (bookingDate.toDateString() === tomorrowDate.toDateString()) return { label: 'Tomorrow! 🌟', color: '#C8FF4D', bg: 'rgba(200,255,77,0.12)' }
  if (diffDays <= 7) return { label: `In ${diffDays} days`, color: '#C8FF4D', bg: 'rgba(200,255,77,0.08)' }
  return { label: `In ${diffDays} days`, color: '#8B8B9A', bg: 'rgba(139,139,154,0.08)' }
}

export default function BookingsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()
  const isCompanion = (user?.profile?.is_companion ?? (user as any)?.is_companion) &&
    ((user?.profile?.companion_verification_status ?? (user as any)?.companion_verification_status) === 'approved')

  const [tab, setTab] = useState<'sent' | 'received'>('sent')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [responseNote, setResponseNote] = useState('')

  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')

  const [safeMeetBooking, setSafeMeetBooking] = useState<Booking | null>(null)
  const [safeMeetData, setSafeMeetData] = useState<SafeMeet | null>(null)
  const [trustedName, setTrustedName] = useState('')
  const [trustedPhone, setTrustedPhone] = useState('')

  const role = tab === 'received' ? 'companion' : 'requester'
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', role],
    queryFn: () => bookingsApi.getMyBookings(role),
  })

  const bookings: Booking[] = data?.data?.data ?? []

  const groupedBookings = useMemo(() => {
    const now = new Date()
    const upcoming: Booking[] = []
    const thisWeek: Booking[] = []
    const past: Booking[] = []

    bookings.forEach(b => {
      const bDate = new Date(b.proposed_date)
      const diffDays = Math.ceil((bDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isPast = b.status === 'completed' || b.status === 'cancelled' || b.status === 'declined' || bDate < now
      if (isPast) {
        past.push(b)
      } else if (diffDays <= 7) {
        thisWeek.push(b)
      } else {
        upcoming.push(b)
      }
    })

    const sections: Array<{ title: string; items: Booking[] }> = []
    if (thisWeek.length) sections.push({ title: 'This Week', items: thisWeek })
    if (upcoming.length) sections.push({ title: 'Upcoming', items: upcoming })
    if (past.length) sections.push({ title: 'Past', items: past })
    return sections
  }, [bookings])

  const updateBooking = useMutation({
    mutationFn: ({ status }: { status: 'accepted' | 'declined' | 'cancelled' | 'completed' }) =>
      bookingsApi.updateBooking(selected!.id, status, responseNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      setSelected(null)
      setResponseNote('')
      toast('Booking updated!', 'success')
    },
    onError: () => toast('Could not update booking', 'error'),
  })

  const cancelBooking = useMutation({
    mutationFn: (id: string) => bookingsApi.updateBooking(id, 'cancelled'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookings'] }); toast('Booking cancelled', 'success') },
    onError: () => toast('Could not cancel booking', 'error'),
  })

  const submitReview = useMutation({
    mutationFn: () => reviewsApi.submit(reviewBooking!.id, { rating: reviewRating, body: reviewBody || undefined }),
    onSuccess: (res) => {
      const bothPublished = res.data?.data?.both_published
      toast(bothPublished ? '⭐ Reviews are now live!' : '✓ Review submitted. Waiting for the other party.', 'success')
      setReviewBooking(null)
      setReviewRating(5)
      setReviewBody('')
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg ?? 'Could not submit review', 'error')
    },
  })

  const setupSafeMeet = useMutation({
    mutationFn: () => safeMeetApi.setup(safeMeetBooking!.id, { trusted_name: trustedName, trusted_phone: trustedPhone }),
    onSuccess: (res) => {
      setSafeMeetData(res.data?.data)
      toast('Safe Meet active 🛡️', 'success')
    },
    onError: () => toast('Could not set up Safe Meet', 'error'),
  })

  const safeMeetAction = useMutation({
    mutationFn: (action: 'checkin' | 'checkout' | 'sos') => safeMeetApi.action(safeMeetData!.id, action),
    onSuccess: (res, action) => {
      setSafeMeetData(res.data?.data)
      const msg = action === 'sos' ? '🚨 SOS sent!' : action === 'checkin' ? 'Checked in 🛡️' : 'Checked out ✓'
      toast(msg, action === 'sos' ? 'error' : 'success')
    },
    onError: () => toast('Action failed', 'error'),
  })

  return (
    <AppShell>
      <div className="screen-scroll overflow-y-auto h-dvh bg-[#0D0D12]">
        <PageHeader title="My Bookings" />

        {/* Tabs */}
        {isCompanion && (
          <div className="flex gap-2 px-4 pb-4">
            {(['sent', 'received'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={tab === t
                  ? { background: '#C8FF4D', color: '#0A1A00' }
                  : { background: '#141418', color: '#8B8B9A', border: '1px solid #2E2E3A' }
                }
              >
                {t === 'sent' ? 'My Requests' : 'Incoming'}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 px-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
                <div className="skeleton h-4 w-32 rounded mb-2" />
                <div className="skeleton h-3 w-48 rounded" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(200,255,77,0.1)' }}>
              <Calendar size={24} style={{ color: '#C8FF4D' }} />
            </div>
            <h3 className="font-manrope font-bold text-[#F2F0EB] mb-2">No bookings yet</h3>
            <p className="text-[#8B8B9A] text-sm leading-relaxed max-w-[220px]">
              {tab === 'sent' ? 'Browse companions and send a booking request' : 'Booking requests from users will appear here'}
            </p>
            {tab === 'sent' && (
              <button onClick={() => navigate('/discover')}
                className="mt-5 flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-2xl"
                style={{ background: '#C8FF4D', color: '#0A1A00' }}
              >
                Discover Companions <ChevronRight size={16} />
              </button>
            )}
          </motion.div>
        ) : (
          <div className="px-4 pb-10 space-y-6">
            <AnimatePresence>
              {groupedBookings.map(({ title, items }) => (
                <div key={title}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#52525E' }}>{title}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#1C1C22', color: '#8B8B9A' }}>{items.length}</span>
                    <div className="flex-1 h-px" style={{ background: '#2E2E3A' }} />
                  </div>

                  <div className="space-y-3">
                    {items.map((booking, i) => {
                const other = tab === 'sent' ? booking.companion : booking.requester
                const st = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending
                const icon = SERVICE_ICONS[booking.service?.slug ?? ''] ?? '✨'
                const countdown = (booking.status === 'pending' || booking.status === 'accepted')
                  ? getCountdownLabel(booking.proposed_date, booking.proposed_time)
                  : null

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#141418', border: '1px solid #2E2E3A' }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar src={other?.profile_photo_url} name={other?.display_name ?? 'U'} size="md" className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-[#F2F0EB] text-sm truncate">{other?.display_name}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                              style={{ color: st.color, background: st.bg }}>
                              {st.label}
                            </span>
                          </div>
                          <p className="text-xs text-[#8B8B9A] mt-0.5">{icon} {booking.service?.name}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-[#8B8B9A]">
                          <Calendar size={12} className="text-[#52525E]" />
                          {new Date(booking.proposed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#8B8B9A]">
                          <Clock size={12} className="text-[#52525E]" />
                          {booking.proposed_time}{booking.duration_hours ? ` · ${booking.duration_hours}h` : ''}
                        </div>
                        {booking.location_notes && (
                          <div className="flex items-center gap-1.5 text-xs text-[#8B8B9A]">
                            <MapPin size={12} className="text-[#52525E]" />
                            {booking.location_notes}
                          </div>
                        )}
                        {booking.agreed_rate && (
                          <span className="text-xs font-bold" style={{ color: '#C8FF4D' }}>
                            ₹{Number(booking.agreed_rate).toLocaleString('en-IN')}
                          </span>
                        )}
                        {countdown && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: countdown.color, background: countdown.bg }}>
                            {countdown.label}
                          </span>
                        )}
                      </div>

                      {booking.package && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs rounded-xl px-3 py-2 font-semibold" style={{ color: '#C8FF4D', background: 'rgba(200,255,77,0.08)' }}>
                          ✨ {booking.package.title}
                          {booking.package.duration_hours && ` · ${booking.package.duration_hours}h`}
                        </div>
                      )}
                      {booking.plus_one_name && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#8B8B9A] rounded-xl px-3 py-2" style={{ background: '#252530' }}>
                          👥 Bringing {booking.plus_one_name}{booking.plus_one_phone ? ` (${booking.plus_one_phone})` : ''}
                        </div>
                      )}
                      {booking.notes && (
                        <p className="mt-2 text-xs text-[#8B8B9A] italic rounded-xl px-3 py-2 leading-relaxed" style={{ background: '#252530' }}>
                          "{booking.notes}"
                        </p>
                      )}
                      {booking.companion_response_note && (
                        <p className="mt-2 text-xs rounded-xl px-3 py-2 leading-relaxed" style={{ color: '#C8FF4D', background: 'rgba(200,255,77,0.08)' }}>
                          Response: "{booking.companion_response_note}"
                        </p>
                      )}
                    </div>

                    {/* Pending actions */}
                    {booking.status === 'pending' && (
                      <div className="border-t px-4 py-2.5 flex gap-2" style={{ borderColor: '#2E2E3A' }}>
                        {tab === 'received' ? (
                          <>
                            <button
                              onClick={() => { setSelected(booking); setResponseNote('') }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                              style={{ background: '#C8FF4D', color: '#0A1A00' }}
                            >
                              <CheckCircle size={13} /> Respond
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const convsRes = await connectionsApi.getConversations()
                                  const convs: Array<{ id: string; other_user?: { id: string } }> = convsRes.data?.data ?? []
                                  const otherId = tab === 'received' ? booking.requester?.id : booking.companion?.id
                                  const conv = convs.find(c => c.other_user?.id === otherId)
                                  if (conv) navigate(`/messages/${conv.id}`, { state: { bookingDetails: { service: booking.service, date: booking.proposed_date, time: booking.proposed_time, duration: booking.duration_hours, location: booking.location_notes } } })
                                  else navigate('/messages')
                                } catch { navigate('/messages') }
                              }}
                              className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold"
                              style={{ border: '1px solid #2E2E3A', color: '#C8FF4D', background: 'transparent' }}
                            >
                              <MessageCircle size={13} /> Chat
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => cancelBooking.mutate(booking.id)}
                            disabled={cancelBooking.isPending}
                            className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold disabled:opacity-50"
                            style={{ border: '1px solid #2E2E3A', color: '#8B8B9A', background: 'transparent' }}
                          >
                            <XCircle size={13} /> Cancel Request
                          </button>
                        )}
                      </div>
                    )}

                    {/* Safe Meet button for accepted bookings */}
                    {booking.status === 'accepted' && (
                      <div className="border-t px-4 py-2.5 flex gap-2" style={{ borderColor: '#2E2E3A' }}>
                        <button
                          onClick={() => {
                            setSafeMeetBooking(booking)
                            setTrustedName('')
                            setTrustedPhone('')
                            setSafeMeetData(null)
                          }}
                          className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold"
                          style={{ background: 'rgba(139,124,255,0.12)', color: '#8B7CFF' }}
                        >
                          <Shield size={13} /> Safe Meet
                        </button>
                      </div>
                    )}

                    {/* Leave Review for completed bookings */}
                    {booking.status === 'completed' && (
                      <div className="border-t px-4 py-2.5 flex gap-2" style={{ borderColor: '#2E2E3A' }}>
                        <button
                          onClick={() => { setReviewBooking(booking); setReviewRating(5); setReviewBody('') }}
                          className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold"
                          style={{ background: 'rgba(255,159,67,0.12)', color: '#FF9F43' }}
                        >
                          <Star size={13} /> Leave Review
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Accept/Decline sheet */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title="Respond to Booking">
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl p-3 text-sm" style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}>
              <p className="font-semibold mb-1 text-[#F2F0EB]">{selected.requester?.display_name} wants to book {selected.service?.name}</p>
              <p className="text-xs text-[#8B8B9A]">
                {new Date(selected.proposed_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at {selected.proposed_time}
                {selected.duration_hours ? ` · ${selected.duration_hours}h` : ''}
              </p>
              {selected.location_notes && <p className="text-xs text-[#8B8B9A] mt-0.5">📍 {selected.location_notes}</p>}
              {selected.notes && <p className="text-xs text-[#8B8B9A] mt-1 italic">"{selected.notes}"</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-[#52525E] block mb-1">Your response (optional)</label>
              <textarea value={responseNote} onChange={e => setResponseNote(e.target.value)} rows={3}
                placeholder="Add a note — confirm a meetup spot, ask a question…"
                className="w-full rounded-xl px-3 py-2.5 text-sm placeholder:text-[#52525E] focus:outline-none resize-none"
                style={inputStyle} />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" loading={updateBooking.isPending} onClick={() => updateBooking.mutate({ status: 'accepted' })}>
                <CheckCircle size={15} /> Accept
              </Button>
              <button
                onClick={() => updateBooking.mutate({ status: 'declined' })}
                disabled={updateBooking.isPending}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ border: '1px solid #FF5C7A', color: '#FF5C7A', background: 'transparent' }}
              >
                <XCircle size={15} /> Decline
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Review sheet */}
      <BottomSheet open={!!reviewBooking} onClose={() => setReviewBooking(null)} title="Leave a Review">
        {reviewBooking && (
          <div className="space-y-4">
            <p className="text-sm text-[#8B8B9A]">
              Rate your experience with {tab === 'sent' ? reviewBooking.companion?.display_name : reviewBooking.requester?.display_name}
            </p>
            <div className="flex gap-2 justify-center py-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setReviewRating(n)}>
                  <Star size={32} style={n <= reviewRating ? { color: '#FF9F43', fill: '#FF9F43' } : { color: '#2E2E3A' }} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewBody}
              onChange={e => setReviewBody(e.target.value)}
              rows={3}
              placeholder="Share your experience (optional)…"
              className="w-full rounded-xl px-3 py-2.5 text-sm placeholder:text-[#52525E] focus:outline-none resize-none"
              style={inputStyle}
            />
            <p className="text-xs text-[#52525E]">Your review will only be visible once both parties have submitted theirs.</p>
            <Button loading={submitReview.isPending} onClick={() => submitReview.mutate()} className="w-full">
              Submit Review
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* Safe Meet sheet */}
      <BottomSheet open={!!safeMeetBooking} onClose={() => setSafeMeetBooking(null)} title="Safe Meet 🛡️">
        {safeMeetBooking && (
          <div className="space-y-4">
            {!safeMeetData ? (
              <>
                <p className="text-sm text-[#8B8B9A]">
                  Enter a trusted contact who should be alerted if you trigger SOS during this meet.
                </p>
                <div>
                  <label className="text-xs font-semibold text-[#52525E] block mb-1">Contact Name</label>
                  <input
                    value={trustedName}
                    onChange={e => setTrustedName(e.target.value)}
                    placeholder="e.g. Mom, Best Friend"
                    className="w-full rounded-xl px-3 py-2.5 text-sm placeholder:text-[#52525E] focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#52525E] block mb-1">Contact Phone</label>
                  <input
                    value={trustedPhone}
                    onChange={e => setTrustedPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    type="tel"
                    className="w-full rounded-xl px-3 py-2.5 text-sm placeholder:text-[#52525E] focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <Button
                  loading={setupSafeMeet.isPending}
                  onClick={() => setupSafeMeet.mutate()}
                  disabled={!trustedName || !trustedPhone}
                  className="w-full"
                >
                  Activate Safe Meet
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-xl p-3" style={{ background: 'rgba(139,124,255,0.1)', border: '1px solid rgba(139,124,255,0.2)' }}>
                  <p className="text-xs font-semibold" style={{ color: '#8B7CFF' }}>Safe Meet Active ✓</p>
                  <p className="text-xs text-[#8B8B9A] mt-0.5">
                    Trusted contact: {safeMeetData.trusted_name} ({safeMeetData.trusted_phone})
                  </p>
                </div>
                <div className="space-y-2">
                  {!safeMeetData.checkin_at && (
                    <Button onClick={() => safeMeetAction.mutate('checkin')} loading={safeMeetAction.isPending} className="w-full">
                      <Shield size={15} /> Check In — Start Meet
                    </Button>
                  )}
                  {safeMeetData.checkin_at && !safeMeetData.checkout_at && (
                    <>
                      <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(200,255,77,0.08)', color: '#C8FF4D' }}>
                        ✓ Checked in at {new Date(safeMeetData.checkin_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <button
                        onClick={() => safeMeetAction.mutate('checkout')}
                        disabled={safeMeetAction.isPending}
                        className="w-full py-3 rounded-2xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: 'rgba(200,255,77,0.08)', color: '#C8FF4D', border: '1px solid rgba(200,255,77,0.2)' }}
                      >
                        Check Out — End Meet ✓
                      </button>
                    </>
                  )}
                  {safeMeetData.checkout_at && (
                    <div className="rounded-xl px-3 py-2 text-xs text-center" style={{ background: 'rgba(200,255,77,0.08)', color: '#C8FF4D' }}>
                      Meet completed ✓
                    </div>
                  )}
                  {!safeMeetData.checkout_at && !safeMeetData.sos_triggered_at && (
                    <button
                      onClick={() => safeMeetAction.mutate('sos')}
                      disabled={safeMeetAction.isPending}
                      className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: '#FF5C7A', color: 'white' }}
                    >
                      <AlertTriangle size={15} /> SOS — Send Emergency Alert
                    </button>
                  )}
                  {safeMeetData.sos_triggered_at && (
                    <div className="rounded-xl px-3 py-2 text-xs font-semibold text-center" style={{ background: 'rgba(255,92,122,0.12)', color: '#FF5C7A' }}>
                      🚨 SOS triggered at {new Date(safeMeetData.sos_triggered_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </BottomSheet>
    </AppShell>
  )
}
