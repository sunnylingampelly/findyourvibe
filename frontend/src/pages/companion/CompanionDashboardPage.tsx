import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, User, IndianRupee, CheckCircle2,
  ChevronRight, Info, PlusCircle,
  Clock, Pencil, Trash2, Package, Star,
} from 'lucide-react'
import { bookingsApi } from '../../api/bookings'
import { profileApi } from '../../api/profile'
import { packagesApi } from '../../api/packages'
import { discoverApi } from '../../api/discover'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/ui/Toast'
import AppShell from '../../components/layout/AppShell'
import BottomSheet from '../../components/ui/BottomSheet'
import Button from '../../components/ui/Button'
import { getInitials } from '../../lib/utils'
import type { Service, ExperiencePackage } from '../../types'

const SERVICE_ICONS: Record<string, string> = {
  'movie-companion': '🎬', 'coffee-buddy': '☕', 'event-companion': '🎭',
  'travel-buddy': '✈️', 'shopping-companion': '🛍️', 'food-explorer': '🍜',
  'city-explorer': '🗺️', 'weekend-companion': '🌅', 'adventure-companion': '🏔️', 'gaming-buddy': '🎮',
}

interface PricingRow {
  service_id: number
  price_per_session: string
  price_currency: string
  price_unit: string
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-[#A1AAA5] mb-2.5 px-1">{children}</p>
  )
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

  const displayName = user?.profile?.display_name ?? (user as any)?.display_name ?? user?.name ?? 'You'
  const photoUrl = user?.profile?.profile_photo_url
  const avgRating = Number(user?.profile?.avg_rating ?? (user as any)?.avg_rating ?? 0)
  const ratingCount = user?.profile?.rating_count ?? (user as any)?.rating_count ?? 0

  const [pricing, setPricing] = useState<PricingRow[]>([])
  const [saved, setSaved] = useState(false)

  // Stories
  const [showStorySheet, setShowStorySheet] = useState(false)
  const [storyCaption, setStoryCaption] = useState('')
  const [storyColor, setStoryColor] = useState('#236B63')
  const STORY_COLORS = ['#236B63', '#1A4A6B', '#4A1A3A', '#3D1A4A', '#4A3D1A', '#1A3D4A']

  const { data: myStoryRes, refetch: refetchStory } = useQuery({
    queryKey: ['my-story'],
    queryFn: () => discoverApi.getStories(),
    select: (d) => {
      const stories = d?.data?.data ?? []
      return stories.find((s: { user: { id: string } }) => s.user.id === user?.id) ?? null
    },
  })

  const postStory = useMutation({
    mutationFn: () => discoverApi.postStory(storyCaption, storyColor),
    onSuccess: () => { setShowStorySheet(false); refetchStory(); toast('Story posted for 24 hours! ✨', 'success') },
    onError: () => toast('Could not post story', 'error'),
  })

  const deleteStory = useMutation({
    mutationFn: () => discoverApi.deleteMyStory(),
    onSuccess: () => { refetchStory(); toast('Story removed', 'success') },
    onError: () => toast('Could not remove story', 'error'),
  })

  // Availability
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  interface AvailSlot { day_of_week: number; start_time: string; end_time: string; is_active: boolean }
  const DEFAULT_SLOT = { start_time: '10:00', end_time: '20:00', is_active: false }
  const [availSlots, setAvailSlots] = useState<AvailSlot[]>(
    Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, ...DEFAULT_SLOT }))
  )
  const [availSaved, setAvailSaved] = useState(false)

  const { data: availRes } = useQuery({
    queryKey: ['my-availability'],
    queryFn: () => profileApi.getMyAvailability(),
  })

  useEffect(() => {
    const slots: AvailSlot[] = availRes?.data?.data ?? []
    if (slots.length > 0) {
      setAvailSlots(Array.from({ length: 7 }, (_, i) => {
        const existing = slots.find((s: AvailSlot) => s.day_of_week === i)
        return existing
          ? { day_of_week: i, start_time: existing.start_time.slice(0, 5), end_time: existing.end_time.slice(0, 5), is_active: existing.is_active }
          : { day_of_week: i, ...DEFAULT_SLOT }
      }))
    }
  }, [availRes])

  const saveAvailability = useMutation({
    mutationFn: () => profileApi.updateMyAvailability(availSlots),
    onSuccess: () => { setAvailSaved(true); setTimeout(() => setAvailSaved(false), 2000) },
    onError: () => toast('Could not save availability', 'error'),
  })

  // Package management
  const [showPkgSheet, setShowPkgSheet] = useState(false)
  const [editingPkg, setEditingPkg] = useState<ExperiencePackage | null>(null)
  const [pkgTitle, setPkgTitle] = useState('')
  const [pkgDesc, setPkgDesc] = useState('')
  const [pkgPrice, setPkgPrice] = useState('')
  const [pkgDuration, setPkgDuration] = useState('')
  const [pkgLocationType, setPkgLocationType] = useState('')

  const { data: pkgsRes, refetch: refetchPkgs } = useQuery({
    queryKey: ['my-packages'],
    queryFn: () => packagesApi.mine(),
  })
  const myPackages: ExperiencePackage[] = pkgsRes?.data?.data ?? []

  const openPkgSheet = (pkg?: ExperiencePackage) => {
    setEditingPkg(pkg ?? null)
    setPkgTitle(pkg?.title ?? '')
    setPkgDesc(pkg?.description ?? '')
    setPkgPrice(pkg ? String(pkg.price) : '')
    setPkgDuration(pkg?.duration_hours ? String(pkg.duration_hours) : '')
    setPkgLocationType(pkg?.location_type ?? '')
    setShowPkgSheet(true)
  }

  const savePkg = useMutation({
    mutationFn: (): Promise<any> => {
      const payload = {
        title: pkgTitle,
        description: pkgDesc || undefined,
        price: parseFloat(pkgPrice),
        duration_hours: pkgDuration ? parseFloat(pkgDuration) : undefined,
        location_type: pkgLocationType || undefined,
      }
      return editingPkg
        ? packagesApi.update(editingPkg.id, payload)
        : packagesApi.create(payload)
    },
    onSuccess: () => {
      setShowPkgSheet(false)
      refetchPkgs()
      toast(editingPkg ? 'Package updated!' : 'Package created! ✨', 'success')
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg ?? 'Could not save package', 'error')
    },
  })

  const deletePkg = useMutation({
    mutationFn: (id: string) => packagesApi.remove(id),
    onSuccess: () => { refetchPkgs(); toast('Package deleted', 'success') },
    onError: () => toast('Could not delete package', 'error'),
  })

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
      <div className="screen-scroll overflow-y-auto h-dvh bg-[#F3F5F4]">

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#0F3330] via-[#194E49] to-[#226057] px-5 pt-14 pb-6 relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/[0.04] pointer-events-none" />

          {/* Profile row */}
          <div className="flex items-center gap-3 mb-5 relative">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/20 shrink-0 shadow-lg">
              {photoUrl ? (
                <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/15 flex items-center justify-center">
                  <span className="text-xl font-manrope font-bold text-white">{getInitials(displayName)}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-manrope font-extrabold text-[18px] text-white leading-snug truncate">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 size={12} className="text-[#7EC8A8]" />
                <span className="text-[11px] text-[#7EC8A8] font-semibold tracking-wide">Verified Companion</span>
              </div>
            </div>
            {avgRating > 0 && (
              <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm px-3 py-2.5 rounded-2xl shrink-0 gap-0.5">
                <Star size={14} className="text-[#D9A45B] fill-[#D9A45B]" />
                <span className="text-white font-extrabold text-[15px] font-manrope leading-none">{avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 relative">
            {[
              { value: pendingCount, label: 'Pending', accent: pendingCount > 0 },
              { value: totalBookings, label: 'Bookings', accent: false },
              { value: ratingCount, label: 'Reviews', accent: false },
            ].map(stat => (
              <div
                key={stat.label}
                className={`rounded-2xl px-3 py-3.5 text-center ${stat.accent ? 'bg-[#D9A45B]/30 ring-1 ring-[#D9A45B]/50' : 'bg-white/10'}`}
              >
                <p className="font-manrope font-extrabold text-[26px] leading-none text-white">{stat.value}</p>
                <p className="text-[10px] text-white/55 mt-1 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CONTENT ─────────────────────────────────────────────── */}
        <div className="px-4 pb-12 space-y-5 pt-4">

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => navigate('/bookings')}
              className="bg-white rounded-2xl border border-[#E8EAE6] p-3.5 flex flex-col items-center gap-2 active:scale-95 transition-transform relative overflow-hidden shadow-sm"
            >
              <div className="w-10 h-10 bg-[#E8F0EA] rounded-xl flex items-center justify-center">
                <CalendarDays size={18} className="text-[#236B63]" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#24332F] text-xs leading-tight">Bookings</p>
                {pendingCount > 0 && <p className="text-[9px] text-[#D9A45B] font-semibold mt-0.5">{pendingCount} pending</p>}
              </div>
              {pendingCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-[#D9A45B] rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/profile/edit?section=services')}
              className="bg-white rounded-2xl border border-[#E8EAE6] p-3.5 flex flex-col items-center gap-2 active:scale-95 transition-transform shadow-sm"
            >
              <div className="w-10 h-10 bg-[#E8F0EA] rounded-xl flex items-center justify-center">
                <Pencil size={17} className="text-[#236B63]" />
              </div>
              <p className="font-semibold text-[#24332F] text-xs text-center leading-tight">Edit Profile</p>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="bg-white rounded-2xl border border-[#E8EAE6] p-3.5 flex flex-col items-center gap-2 active:scale-95 transition-transform shadow-sm"
            >
              <div className="w-10 h-10 bg-[#E8F0EA] rounded-xl flex items-center justify-center">
                <User size={17} className="text-[#236B63]" />
              </div>
              <p className="font-semibold text-[#24332F] text-xs text-center leading-tight">My Profile</p>
            </button>
          </div>

          {/* ── Moment of the day ───────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <SectionLabel>Moment of the Day</SectionLabel>
              {myStoryRes && (
                <button
                  onClick={() => deleteStory.mutate()}
                  disabled={deleteStory.isPending}
                  className="text-xs text-[#D76D6D] font-semibold disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>

            {myStoryRes ? (
              <div
                className="rounded-2xl p-4 flex items-center gap-3 shadow-sm"
                style={{ background: (myStoryRes as unknown as { bg_color: string }).bg_color }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-xl">✨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {(myStoryRes as unknown as { caption?: string }).caption ?? 'Your story is live'}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">Visible for 24 hours on Discover</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowStorySheet(true)}
                className="w-full border-2 border-dashed border-[#C8DDD2] rounded-2xl p-5 flex items-center gap-3 active:scale-98 transition-transform"
              >
                <div className="w-10 h-10 bg-[#E8F0EA] rounded-xl flex items-center justify-center shrink-0">
                  <PlusCircle size={18} className="text-[#236B63]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#24332F] text-sm">Post a moment</p>
                  <p className="text-xs text-[#A1AAA5]">Share what you're up to — shows on Discover for 24h</p>
                </div>
              </button>
            )}
          </div>

          {/* ── Service Pricing ─────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <SectionLabel>Service Pricing</SectionLabel>
              {myServices.length > 0 && (
                <button
                  onClick={() => navigate('/profile/edit?section=services')}
                  className="flex items-center gap-1 text-xs text-[#236B63] font-semibold"
                >
                  <PlusCircle size={12} /> Manage
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl border border-[#E8EAE6] p-6 flex items-center justify-center shadow-sm">
                <div className="w-5 h-5 border-2 border-[#236B63] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myServices.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-[#D5E0D8] p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-[#E8F0EA] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <IndianRupee size={20} className="text-[#236B63]" />
                </div>
                <p className="font-manrope font-bold text-[#24332F] text-sm mb-1">No services added yet</p>
                <p className="text-xs text-[#A1AAA5] leading-relaxed max-w-[220px] mx-auto mb-4">
                  Add the services you offer, then set your price for each one here.
                </p>
                <button
                  onClick={() => navigate('/profile/edit?section=services')}
                  className="inline-flex items-center gap-2 bg-[#236B63] text-white text-sm font-semibold px-5 py-2.5 rounded-2xl active:scale-95 transition-transform"
                >
                  <PlusCircle size={15} /> Add Services
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8EAE6] overflow-hidden shadow-sm">
                <div className="flex items-start gap-2.5 px-4 py-3 bg-[#F4F9F7] border-b border-[#E8EAE6]">
                  <Info size={14} className="text-[#236B63] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#4D7A6E] leading-relaxed">
                    Prices are shown to users on your profile. Leave blank to show "Contact to discuss".
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
                      {unpricedCount} service{unpricedCount > 1 ? 's' : ''} without a price
                    </p>
                  )}
                  <button
                    onClick={() => updatePricing.mutate()}
                    disabled={updatePricing.isPending || saved}
                    className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${
                      saved ? 'bg-[#4D9274] text-white' : 'bg-[#194E49] text-white active:scale-[0.98]'
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

          {/* ── Experience Packages ──────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <SectionLabel>Experience Packages</SectionLabel>
              {myPackages.length < 5 && (
                <button
                  onClick={() => openPkgSheet()}
                  className="flex items-center gap-1 text-xs text-[#236B63] font-semibold"
                >
                  <PlusCircle size={12} /> Add
                </button>
              )}
            </div>

            {myPackages.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-[#D5E0D8] p-5 text-center shadow-sm">
                <div className="w-12 h-12 bg-[#E8F0EA] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Package size={20} className="text-[#236B63]" />
                </div>
                <p className="font-manrope font-bold text-[#24332F] text-sm mb-1">No packages yet</p>
                <p className="text-xs text-[#A1AAA5] leading-relaxed max-w-[220px] mx-auto mb-4">
                  Create curated experience packages users can book at a fixed price.
                </p>
                <button
                  onClick={() => openPkgSheet()}
                  className="inline-flex items-center gap-2 bg-[#236B63] text-white text-sm font-semibold px-5 py-2.5 rounded-2xl active:scale-95 transition-transform"
                >
                  <PlusCircle size={15} /> Create Package
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {myPackages.map(pkg => (
                  <div key={pkg.id} className="bg-white rounded-2xl border border-[#E8EAE6] p-4 flex items-start gap-3 shadow-sm">
                    <div className="w-9 h-9 bg-[#E8F0EA] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Package size={16} className="text-[#236B63]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#24332F] text-sm">{pkg.title}</p>
                      {pkg.description && <p className="text-xs text-[#77817C] mt-0.5 leading-relaxed line-clamp-2">{pkg.description}</p>}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="text-xs font-bold text-[#236B63]">₹{Number(pkg.price).toLocaleString('en-IN')}</span>
                        {pkg.duration_hours && <span className="text-xs text-[#A1AAA5]">{pkg.duration_hours}h</span>}
                        {!pkg.is_active && <span className="text-[10px] font-bold bg-[#FFF5E6] text-[#D9A45B] px-2 py-0.5 rounded-full">Hidden</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openPkgSheet(pkg)} className="w-8 h-8 rounded-xl bg-[#F4F9F7] flex items-center justify-center">
                        <Pencil size={13} className="text-[#236B63]" />
                      </button>
                      <button onClick={() => deletePkg.mutate(pkg.id)} disabled={deletePkg.isPending} className="w-8 h-8 rounded-xl bg-[#FFF0EE] flex items-center justify-center disabled:opacity-50">
                        <Trash2 size={13} className="text-[#D76D6D]" />
                      </button>
                    </div>
                  </div>
                ))}
                {myPackages.length < 5 && (
                  <button
                    onClick={() => openPkgSheet()}
                    className="w-full py-3 border border-dashed border-[#C8DDD2] rounded-2xl text-sm text-[#236B63] font-semibold flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle size={14} /> Add another ({myPackages.length}/5)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Availability ────────────────────────────────────── */}
          <div>
            <SectionLabel>My Availability</SectionLabel>
            <div className="bg-white rounded-2xl border border-[#E8EAE6] overflow-hidden shadow-sm">
              <div className="flex items-start gap-2.5 px-4 py-3 bg-[#F4F9F7] border-b border-[#E8EAE6]">
                <Info size={14} className="text-[#236B63] mt-0.5 shrink-0" />
                <p className="text-xs text-[#4D7A6E] leading-relaxed">
                  Set your open hours. Users will see "Available today" on your profile.
                </p>
              </div>
              <div className="divide-y divide-[#F4F5F4]">
                {availSlots.map((slot, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAvailSlots(prev => prev.map((s, ii) => ii === i ? { ...s, is_active: !s.is_active } : s))}
                      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${slot.is_active ? 'bg-[#236B63]' : 'bg-[#E8EAE6]'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${slot.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                    <span className={`text-xs font-bold w-7 shrink-0 ${slot.is_active ? 'text-[#24332F]' : 'text-[#A1AAA5]'}`}>
                      {DAY_NAMES[slot.day_of_week]}
                    </span>
                    {slot.is_active && (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={e => setAvailSlots(prev => prev.map((s, ii) => ii === i ? { ...s, start_time: e.target.value } : s))}
                          className="flex-1 min-w-0 border border-[#E8EAE6] rounded-lg px-2 py-1 text-xs text-[#24332F] focus:outline-none focus:border-[#236B63]"
                        />
                        <span className="text-[10px] text-[#A1AAA5]">–</span>
                        <input
                          type="time"
                          value={slot.end_time}
                          onChange={e => setAvailSlots(prev => prev.map((s, ii) => ii === i ? { ...s, end_time: e.target.value } : s))}
                          className="flex-1 min-w-0 border border-[#E8EAE6] rounded-lg px-2 py-1 text-xs text-[#24332F] focus:outline-none focus:border-[#236B63]"
                        />
                      </div>
                    )}
                    {!slot.is_active && <span className="text-xs text-[#C8CCC9] flex-1">Off</span>}
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4 pt-3 border-t border-[#F4F5F4]">
                <button
                  onClick={() => saveAvailability.mutate()}
                  disabled={saveAvailability.isPending || availSaved}
                  className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${
                    availSaved ? 'bg-[#4D9274] text-white' : 'bg-[#194E49] text-white active:scale-[0.98]'
                  }`}
                >
                  {availSaved ? (
                    <><CheckCircle2 size={16} /> Availability saved!</>
                  ) : saveAvailability.isPending ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                  ) : (
                    <><CalendarDays size={15} /> Save Availability</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── View profile row ─────────────────────────────────── */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-between bg-white border border-[#E8EAE6] rounded-2xl px-4 py-3.5 active:scale-[0.98] transition-transform shadow-sm"
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

      {/* Package create/edit sheet */}
      <BottomSheet open={showPkgSheet} onClose={() => setShowPkgSheet(false)} title={editingPkg ? 'Edit Package' : 'New Experience Package'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Package Title *</label>
            <input
              value={pkgTitle}
              onChange={e => setPkgTitle(e.target.value)}
              placeholder="e.g. City Food Tour, Movie + Dinner"
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Description</label>
            <textarea
              value={pkgDesc}
              onChange={e => setPkgDesc(e.target.value)}
              rows={3}
              placeholder="What's included? What makes this special?"
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-3 py-2.5 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Price (₹) *</label>
              <input
                type="number"
                min="0"
                value={pkgPrice}
                onChange={e => setPkgPrice(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] focus:outline-none focus:border-[#236B63]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Duration (hours)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={pkgDuration}
                onChange={e => setPkgDuration(e.target.value)}
                placeholder="e.g. 3"
                className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] focus:outline-none focus:border-[#236B63]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Location type</label>
            <select
              value={pkgLocationType}
              onChange={e => setPkgLocationType(e.target.value)}
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] focus:outline-none focus:border-[#236B63] bg-white"
            >
              <option value="">Not specified</option>
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Both">Both</option>
              <option value="Online">Online</option>
            </select>
          </div>
          <Button
            loading={savePkg.isPending}
            disabled={!pkgTitle || !pkgPrice}
            onClick={() => savePkg.mutate()}
            className="w-full"
          >
            {editingPkg ? 'Save Changes' : 'Create Package ✨'}
          </Button>
        </div>
      </BottomSheet>
      {/* Story posting sheet */}
      <BottomSheet open={showStorySheet} onClose={() => setShowStorySheet(false)} title="Post a Moment">
        <div className="space-y-4">
          <p className="text-xs text-[#77817C] leading-relaxed">
            Share what you're up to today — this appears on the Discover page for 24 hours.
          </p>
          <div>
            <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Your moment *</label>
            <textarea
              value={storyCaption}
              onChange={e => setStoryCaption(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="e.g. Exploring the old city today! DM me if you want to join 🌆"
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none"
            />
            <p className="text-right text-[10px] text-[#A1AAA5] mt-1">{storyCaption.length}/200</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-2 block">Card colour</label>
            <div className="flex gap-2">
              {STORY_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setStoryColor(color)}
                  className={`w-9 h-9 rounded-xl transition-all ${storyColor === color ? 'ring-2 ring-offset-2 ring-[#236B63] scale-110' : ''}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <Button
            size="lg"
            loading={postStory.isPending}
            disabled={!storyCaption.trim()}
            onClick={() => postStory.mutate()}
          >
            Post for 24 hours ✨
          </Button>
        </div>
      </BottomSheet>
    </AppShell>
  )
}
