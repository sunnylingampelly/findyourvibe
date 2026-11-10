import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, MessageCircle, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { bookingsApi } from '../../api/bookings'
import { connectionsApi } from '../../api/connections'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/ui/Toast'
import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'
import Avatar from '../../components/ui/Avatar'
import BottomSheet from '../../components/ui/BottomSheet'
import Button from '../../components/ui/Button'
import type { Booking } from '../../types'

const SERVICE_ICONS: Record<string, string> = {
  'movie-companion': '🎬', 'coffee-buddy': '☕', 'event-companion': '🎭',
  'travel-buddy': '✈️', 'shopping-companion': '🛍️', 'food-explorer': '🍜',
  'city-explorer': '🗺️', 'weekend-companion': '🌅', 'adventure-companion': '🏔️', 'gaming-buddy': '🎮',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#D9A45B', bg: '#FFF5E6' },
  accepted:  { label: 'Confirmed', color: '#236B63', bg: '#E8F0EA' },
  declined:  { label: 'Declined',  color: '#D76D6D', bg: '#FFF0EE' },
  cancelled: { label: 'Cancelled', color: '#A1AAA5', bg: '#F4F6F8' },
  completed: { label: 'Completed', color: '#4D9274', bg: '#E8F0EA' },
}

export default function BookingsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()
  // Check nested profile (new sessions) OR flat root fields (old cached sessions)
  const isCompanion = (user?.profile?.is_companion ?? (user as any)?.is_companion) &&
    ((user?.profile?.companion_verification_status ?? (user as any)?.companion_verification_status) === 'approved')

  const [tab, setTab] = useState<'sent' | 'received'>('sent')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [responseNote, setResponseNote] = useState('')

  const role = tab === 'received' ? 'companion' : 'requester'
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', role],
    queryFn: () => bookingsApi.getMyBookings(role),
  })

  const bookings: Booking[] = data?.data?.data ?? []

  const updateBooking = useMutation({
    mutationFn: ({ status }: { status: 'accepted' | 'declined' | 'cancelled' }) =>
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

  return (
    <AppShell>
      <div className="screen-scroll overflow-y-auto h-dvh bg-[#FAF9F6]">
        <PageHeader title="My Bookings" />

        {/* Tabs */}
        {isCompanion && (
          <div className="flex gap-2 px-4 pb-4">
            {(['sent', 'received'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  tab === t ? 'bg-[#236B63] text-white' : 'bg-white text-[#77817C] border border-[#E8EAE6]'
                }`}
              >
                {t === 'sent' ? 'My Requests' : 'Incoming'}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 px-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[#E8EAE6]">
                <div className="skeleton h-4 w-32 rounded mb-2" />
                <div className="skeleton h-3 w-48 rounded" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 bg-[#E8F0EA] rounded-2xl flex items-center justify-center mb-4">
              <Calendar size={24} className="text-[#236B63]" />
            </div>
            <h3 className="font-manrope font-bold text-[#24332F] mb-2">No bookings yet</h3>
            <p className="text-[#A1AAA5] text-sm leading-relaxed max-w-[220px]">
              {tab === 'sent' ? 'Browse companions and send a booking request' : 'Booking requests from users will appear here'}
            </p>
            {tab === 'sent' && (
              <button onClick={() => navigate('/discover')}
                className="mt-5 flex items-center gap-2 bg-[#236B63] text-white text-sm font-semibold px-5 py-3 rounded-2xl">
                Discover Companions <ChevronRight size={16} />
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3 px-4 pb-10">
            <AnimatePresence>
              {bookings.map((booking, i) => {
                const other = tab === 'sent' ? booking.companion : booking.requester
                const st = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending
                const icon = SERVICE_ICONS[booking.service?.slug ?? ''] ?? '✨'

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-[#E8EAE6] overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar src={other?.profile_photo_url} name={other?.display_name ?? 'U'} size="md" className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-[#24332F] text-sm truncate">{other?.display_name}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                              style={{ color: st.color, background: st.bg }}>
                              {st.label}
                            </span>
                          </div>
                          <p className="text-xs text-[#77817C] mt-0.5">{icon} {booking.service?.name}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-[#77817C]">
                          <Calendar size={12} className="text-[#A1AAA5]" />
                          {new Date(booking.proposed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#77817C]">
                          <Clock size={12} className="text-[#A1AAA5]" />
                          {booking.proposed_time}{booking.duration_hours ? ` · ${booking.duration_hours}h` : ''}
                        </div>
                        {booking.location_notes && (
                          <div className="flex items-center gap-1.5 text-xs text-[#77817C]">
                            <MapPin size={12} className="text-[#A1AAA5]" />
                            {booking.location_notes}
                          </div>
                        )}
                        {booking.agreed_rate && (
                          <span className="text-xs font-bold text-[#236B63]">
                            ₹{Number(booking.agreed_rate).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {booking.notes && (
                        <p className="mt-2 text-xs text-[#77817C] italic bg-[#FAF9F6] rounded-xl px-3 py-2 leading-relaxed">
                          "{booking.notes}"
                        </p>
                      )}
                      {booking.companion_response_note && (
                        <p className="mt-2 text-xs text-[#236B63] bg-[#E8F0EA] rounded-xl px-3 py-2 leading-relaxed">
                          Response: "{booking.companion_response_note}"
                        </p>
                      )}
                    </div>

                    {booking.status === 'pending' && (
                      <div className="border-t border-[#F4F1EA] px-4 py-2.5 flex gap-2">
                        {tab === 'received' ? (
                          <>
                            <button
                              onClick={() => { setSelected(booking); setResponseNote('') }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#236B63] text-white rounded-xl text-xs font-bold"
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
                              className="flex items-center justify-center gap-1.5 py-2 px-4 border border-[#E8EAE6] text-[#236B63] rounded-xl text-xs font-semibold">
                              <MessageCircle size={13} /> Chat
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => cancelBooking.mutate(booking.id)}
                            disabled={cancelBooking.isPending}
                            className="flex items-center gap-1.5 py-2 px-4 border border-[#E8EAE6] text-[#A1AAA5] rounded-xl text-xs font-semibold disabled:opacity-50"
                          >
                            <XCircle size={13} /> Cancel Request
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Accept/Decline sheet */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title="Respond to Booking">
        {selected && (
          <div className="space-y-4">
            <div className="bg-[#FAF9F6] rounded-xl p-3 text-sm text-[#24332F]">
              <p className="font-semibold mb-1">{selected.requester?.display_name} wants to book {selected.service?.name}</p>
              <p className="text-xs text-[#77817C]">
                {new Date(selected.proposed_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at {selected.proposed_time}
                {selected.duration_hours ? ` · ${selected.duration_hours}h` : ''}
              </p>
              {selected.location_notes && <p className="text-xs text-[#77817C] mt-0.5">📍 {selected.location_notes}</p>}
              {selected.notes && <p className="text-xs text-[#77817C] mt-1 italic">"{selected.notes}"</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-[#77817C] block mb-1">Your response (optional)</label>
              <textarea value={responseNote} onChange={e => setResponseNote(e.target.value)} rows={3}
                placeholder="Add a note — confirm a meetup spot, ask a question…"
                className="w-full border border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#236B63] resize-none" />
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" loading={updateBooking.isPending} onClick={() => updateBooking.mutate({ status: 'accepted' })}>
                <CheckCircle size={15} /> Accept
              </Button>
              <button
                onClick={() => updateBooking.mutate({ status: 'declined' })}
                disabled={updateBooking.isPending}
                className="flex-1 py-3 bg-white border border-[#D76D6D] text-[#D76D6D] rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle size={15} /> Decline
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </AppShell>
  )
}
