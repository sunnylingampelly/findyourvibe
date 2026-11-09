import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, CalendarDays, User, IndianRupee, CheckCircle2, Sparkles,
  Shield, MessageCircle, TrendingUp, ChevronRight, Info, PlusCircle,
  BadgeCheck, Clock, Pencil
} from 'lucide-react'
import { bookingsApi } from '../../api/bookings'
import { profileApi } from '../../api/profile'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/ui/Toast'
import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'
import type { Service } from '../../types'

const SERVICE_ICONS: Record<string, string> = {
  'movie-companion': '🎬', 'coffee-buddy': '☕', 'event-companion': '🎭',
  'travel-buddy': '✈️', 'shopping-companion': '🛍️', 'food-explorer': '🍜',
  'city-explorer': '🗺️', 'weekend-companion': '🌅', 'adventure-companion': '🏔️', 'gaming-buddy': '🎮',
}

const COMPANION_BENEFITS = [
  { icon: BadgeCheck, color: '#236B63', bg: '#E8F0EA', title: 'Verified Badge', desc: 'A green tick on your profile builds instant trust with users.' },
  { icon: TrendingUp, color: '#D9A45B', bg: '#FFF5E6', title: 'Priority Discovery', desc: 'Approved companions rank higher in search and browse results.' },
  { icon: Shield, color: '#4D9274', bg: '#E8F0EA', title: 'Identity Verified', desc: 'Your documents are on file — a signal of authenticity.' },
  { icon: MessageCircle, color: '#6B8CE0', bg: '#EEF1FB', title: 'Booking Requests', desc: 'Users can send you formal service booking requests directly.' },
  { icon: IndianRupee, color: '#236B63', bg: '#E8F0EA', title: 'Set Your Pricing', desc: 'You control what you charge — per session or per hour.' },
  { icon: Sparkles, color: '#D9A45B', bg: '#FFF5E6', title: 'Build Your Reputation', desc: 'Collect reviews and grow as a trusted companion over time.' },
]

interface PricingRow {
  service_id: number
  price_per_session: string
  price_currency: string
  price_unit: string
}

export default function CompanionDashboardPage() {
  const navigate = useNavigate()
  const { user: storeUser, setUser } = useAuthStore()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data: meRes, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => profileApi.getMe(),
    staleTime: 0,
  })

  const { data: bookingsRes } = useQuery({
    queryKey: ['bookings', 'companion'],
    queryFn: () => bookingsApi.getMyBookings('companion'),
  })

  const freshUser = meRes?.data?.data
  const user = freshUser ?? storeUser

  useEffect(() => {
    if (freshUser) setUser(freshUser)
  }, [freshUser, setUser])

  const myServices: Service[] = (freshUser ?? storeUser)?.services ?? []
  const companionBookings = bookingsRes?.data?.data ?? []
  const pendingCount = companionBookings.filter((b: { status: string }) => b.status === 'pending').length
  const totalBookings = companionBookings.length

  const [pricing, setPricing] = useState<PricingRow[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (myServices.length > 0) {
      setPricing(myServices.map(s => ({
        service_id: Number(s.id),
        price_per_session: s.price_per_session != null ? String(s.price_per_session) : '',
        price_currency: s.price_currency ?? 'INR',
        price_unit: s.price_unit ?? 'per_session',
      })))
    }
  }, [meRes])

  const updatePricing = useMutation({
    mutationFn: () =>
      bookingsApi.updatePricing(
        pricing
          .filter(p => p.price_per_session !== '')
          .map(p => ({
            service_id: p.service_id,
            price_per_session: parseFloat(p.price_per_session),
            price_currency: p.price_currency,
            price_unit: p.price_unit,
          }))
      ),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      qc.invalidateQueries({ queryKey: ['me'] })
      qc.invalidateQueries({ queryKey: ['services'] })
    },
    onError: () => toast('Could not save pricing', 'error'),
  })

  const setPricingField = (idx: number, field: keyof PricingRow, value: string) => {
    setSaved(false)
    setPricing(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  const unpricedCount = pricing.filter(p => p.price_per_session === '').length

  return (
    <AppShell>
      <div className="screen-scroll overflow-y-auto h-dvh bg-[#FAF9F6]">
        <PageHeader title="Companion Dashboard" />

        <div className="px-4 pb-12 space-y-4">

          {/* Hero status card */}
          <div className="bg-gradient-to-br from-[#194E49] to-[#2E7D6F] rounded-3xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-0.5">
              <CheckCircle2 size={17} className="text-[#7EC8A8]" />
              <span className="font-manrope font-bold text-base">Verified Companion</span>
            </div>
            <p className="text-white/60 text-xs mb-5">
              Hi {user?.profile?.display_name ?? (user as any)?.display_name ?? user?.name} — your profile is live ✨
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: pendingCount, label: 'Pending', accent: pendingCount > 0 },
                { value: totalBookings, label: 'Total Bookings', accent: false },
                { value: user?.profile?.rating_count ?? (user as any)?.rating_count ?? 0, label: 'Reviews', accent: false },
              ].map(stat => (
                <div key={stat.label} className={`rounded-2xl px-3 py-3 text-center ${stat.accent ? 'bg-[#D9A45B]/30 ring-1 ring-[#D9A45B]/50' : 'bg-white/10'}`}>
                  <p className="font-manrope font-extrabold text-2xl leading-none">{stat.value}</p>
                  <p className="text-[10px] text-white/60 mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/bookings')}
              className="bg-white rounded-2xl border border-[#E8EAE6] p-4 flex items-center gap-3 active:scale-95 transition-transform text-left relative overflow-hidden"
            >
              <div className="w-10 h-10 bg-[#E8F0EA] rounded-xl flex items-center justify-center shrink-0">
                <CalendarDays size={18} className="text-[#236B63]" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#24332F] text-sm">Bookings</p>
                <p className="text-xs text-[#A1AAA5]">{pendingCount > 0 ? `${pendingCount} need response` : 'No pending'}</p>
              </div>
              {pendingCount > 0 && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-[#D9A45B] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/profile/edit?section=services')}
              className="bg-white rounded-2xl border border-[#E8EAE6] p-4 flex items-center gap-3 active:scale-95 transition-transform text-left"
            >
              <div className="w-10 h-10 bg-[#E8F0EA] rounded-xl flex items-center justify-center shrink-0">
                <Pencil size={18} className="text-[#236B63]" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#24332F] text-sm">Edit Profile</p>
                <p className="text-xs text-[#A1AAA5]">Services & info</p>
              </div>
            </button>
          </div>

          {/* Pricing section */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#A1AAA5]">Service Pricing</p>
              {myServices.length > 0 && (
                <button
                  onClick={() => navigate('/profile/edit?section=services')}
                  className="flex items-center gap-1 text-xs text-[#236B63] font-semibold"
                >
                  <PlusCircle size={13} /> Manage services
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl border border-[#E8EAE6] p-6 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#236B63] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myServices.length === 0 ? (
              /* Empty state */
              <div className="bg-white rounded-2xl border-2 border-dashed border-[#D5E0D8] p-6 text-center">
                <div className="w-14 h-14 bg-[#E8F0EA] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <IndianRupee size={22} className="text-[#236B63]" />
                </div>
                <p className="font-manrope font-bold text-[#24332F] text-sm mb-1">No services added yet</p>
                <p className="text-xs text-[#A1AAA5] leading-relaxed max-w-[220px] mx-auto mb-4">
                  Add the services you offer to your profile — then set your price for each one here.
                </p>
                <button
                  onClick={() => navigate('/profile/edit?section=services')}
                  className="inline-flex items-center gap-2 bg-[#236B63] text-white text-sm font-semibold px-5 py-2.5 rounded-2xl active:scale-95 transition-transform"
                >
                  <PlusCircle size={15} /> Add Services
                </button>
              </div>
            ) : (
              /* Pricing cards */
              <div className="bg-white rounded-2xl border border-[#E8EAE6] overflow-hidden">
                {/* Info banner */}
                <div className="flex items-start gap-2.5 px-4 py-3 bg-[#F4F9F7] border-b border-[#E8EAE6]">
                  <Info size={14} className="text-[#236B63] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#4D7A6E] leading-relaxed">
                    Prices are shown to users on your profile. You can leave a price blank to show "Contact to discuss".
                  </p>
                </div>

                <div className="divide-y divide-[#F4F5F4]">
                  {myServices.map((s, idx) => {
                    const row = pricing[idx]
                    if (!row) return null
                    const hasPrice = row.price_per_session !== ''
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className="p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{SERVICE_ICONS[s.slug] || '✨'}</span>
                            <p className="font-semibold text-[#24332F] text-sm">{s.name}</p>
                          </div>
                          {hasPrice ? (
                            <span className="text-[10px] font-bold bg-[#E8F0EA] text-[#236B63] px-2 py-0.5 rounded-full">Priced</span>
                          ) : (
                            <span className="text-[10px] font-bold bg-[#FFF5E6] text-[#D9A45B] px-2 py-0.5 rounded-full">Not set</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1AAA5] text-sm font-medium">₹</span>
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              placeholder="e.g. 500"
                              value={row.price_per_session}
                              onChange={e => setPricingField(idx, 'price_per_session', e.target.value)}
                              className="w-full pl-8 pr-3 py-3 border-[1.5px] border-[#E8EAE6] rounded-xl text-sm text-[#24332F] focus:outline-none focus:border-[#236B63] focus:ring-2 focus:ring-[#236B63]/10 transition-all"
                            />
                          </div>
                          <select
                            value={row.price_unit}
                            onChange={e => setPricingField(idx, 'price_unit', e.target.value)}
                            className="border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-3 text-sm text-[#24332F] focus:outline-none focus:border-[#236B63] bg-white min-w-[110px]"
                          >
                            <option value="per_session">per session</option>
                            <option value="per_hour">per hour</option>
                            <option value="negotiable">Negotiable</option>
                          </select>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="px-4 pb-4 pt-3 border-t border-[#F4F5F4] space-y-2">
                  {unpricedCount > 0 && (
                    <p className="text-xs text-[#D9A45B] text-center flex items-center justify-center gap-1">
                      <Clock size={12} />
                      {unpricedCount} service{unpricedCount > 1 ? 's' : ''} without a price — users will see "Contact to discuss"
                    </p>
                  )}
                  <button
                    onClick={() => updatePricing.mutate()}
                    disabled={updatePricing.isPending || saved}
                    className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${
                      saved
                        ? 'bg-[#4D9274] text-white'
                        : 'bg-[#194E49] text-white active:scale-[0.98]'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {saved ? (
                        <motion.span key="saved" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                          <CheckCircle2 size={16} /> Pricing saved!
                        </motion.span>
                      ) : updatePricing.isPending ? (
                        <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving…
                        </motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                          <IndianRupee size={15} /> Save Pricing
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* What you get as a companion */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#A1AAA5] mb-3 px-1">What You Get as a Companion</p>
            <div className="space-y-2">
              {COMPANION_BENEFITS.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-[#E8EAE6] p-4 flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: b.bg }}>
                    <b.icon size={17} style={{ color: b.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#24332F] text-sm">{b.title}</p>
                    <p className="text-xs text-[#77817C] mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Profile link */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-between bg-white border border-[#E8EAE6] rounded-2xl px-4 py-3.5 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#E8F0EA] rounded-xl flex items-center justify-center">
                <User size={16} className="text-[#236B63]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#24332F] text-sm">View My Profile</p>
                <p className="text-xs text-[#A1AAA5]">See how others see you</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#C8CCC9]" />
          </button>

        </div>
      </div>
    </AppShell>
  )
}
