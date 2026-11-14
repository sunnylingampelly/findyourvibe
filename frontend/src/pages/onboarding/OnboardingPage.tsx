import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Camera, Check, Trash2, Star, MapPin } from 'lucide-react'
import { profileApi } from '../../api/profile'
import { discoverApi } from '../../api/discover'
import { useToast } from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { GenderPicker, DobPicker } from '../../components/ui/FormPickers'
import { PlacesAutocomplete } from '../../components/ui/PlacesAutocomplete'
import { useAuthStore } from '../../stores/authStore'
import type { Interest, Language, Service } from '../../types'

const TOTAL_STEPS = 8

interface ProfilePhoto { id: number; url: string; is_primary: boolean; sort_order: number }

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setUser } = useAuthStore()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [form, setForm] = useState({
    display_name: '',
    date_of_birth: '',
    gender: '',
    location: '',      // city/area string from Google Places
    bio: '',
    introduction: '',
    interest_ids: [] as string[],
    language_ids: [] as string[],
    service_ids: [] as string[],
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photos, setPhotos] = useState<ProfilePhoto[]>([])

  const { data: interestsData } = useQuery({ queryKey: ['interests'], queryFn: () => discoverApi.getInterests() })
  const { data: languagesData } = useQuery({ queryKey: ['languages'], queryFn: () => discoverApi.getLanguages() })
  const { data: servicesData } = useQuery({ queryKey: ['services'], queryFn: () => discoverApi.getServices() })

  const interests: Interest[] = interestsData?.data?.data ?? []
  const languages: Language[] = languagesData?.data?.data ?? []
  const services: Service[] = servicesData?.data?.data ?? []

  // Map frontend step → backend onboarding step (photos + location handled separately)
  const backendStep = step >= 4 ? step - 2 : step >= 3 ? step - 1 : step

  const save = useMutation({
    mutationFn: (data: Record<string, unknown>) => profileApi.updateOnboarding({ ...data, step: backendStep }),
  })

  const complete = useMutation({
    mutationFn: () => profileApi.updateOnboarding({ ...form, step: 6, complete: true }),
    onSuccess: (res) => {
      const user = res.data.data
      setUser(user)
      qc.invalidateQueries({ queryKey: ['me'] })
      navigate('/discover')
    },
    onError: () => toast('Failed to complete setup', 'error'),
  })

  const update = (key: string, val: unknown) => setForm(f => ({ ...f, [key]: val }))
  const toggle = (key: 'interest_ids' | 'language_ids' | 'service_ids', id: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter(x => x !== id) : [...f[key], id],
    }))
  }

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photos.length >= 5) { toast('Maximum 5 photos', 'error'); return }
    setUploadingPhoto(true)
    try {
      const res = await profileApi.addPhoto(file)
      setPhotos(prev => [...prev, res.data.data])
    } catch {
      toast('Could not upload photo', 'error')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const handlePhotoDelete = async (id: number) => {
    try {
      await profileApi.deletePhoto(id)
      setPhotos(prev => prev.filter(p => p.id !== id))
    } catch {
      toast('Could not remove photo', 'error')
    }
  }

  const handleSetPrimary = async (id: number) => {
    try {
      await profileApi.setPrimaryPhoto(id)
      setPhotos(prev => prev.map(p => ({ ...p, is_primary: p.id === id })))
    } catch {
      toast('Could not update primary photo', 'error')
    }
  }

  const goBack = () => { setDirection(-1); setStep(s => s - 1) }
  const advance = () => { setDirection(1); setStep(s => s + 1) }

  const next = async () => {
    setDirection(1)
    if (step === 1) {
      if (form.date_of_birth && !isDobValid(form.date_of_birth)) {
        toast('You must be at least 18 years old to join.', 'error')
        return
      }
    }
    if (step === 2) {
      // Location step — mandatory
      if (!form.location.trim()) { toast('Please select your city or area', 'error'); return }
      advance()
      return
    }
    if (step === 3) {
      // Photo step — just advance (photos already uploaded via API)
      if (photos.length < 2) { toast('Please upload at least 2 photos', 'error'); return }
      advance()
      return
    }
    if (step < TOTAL_STEPS) {
      try {
        await save.mutateAsync(form)
        advance()
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        toast(msg || 'Could not save. Please try again.', 'error')
        setDirection(0)
      }
    } else {
      complete.mutate()
    }
  }

  const ServiceIcons: Record<string, string> = {
    'movie-companion': '🎬', 'coffee-buddy': '☕', 'event-companion': '🎭',
    'travel-buddy': '✈️', 'shopping-companion': '🛍️', 'food-explorer': '🍜',
    'city-explorer': '🗺️', 'weekend-companion': '🌅', 'adventure-companion': '🏔️', 'gaming-buddy': '🎮',
  }

  const isDobValid = (dob: string) => {
    if (!dob) return false
    const today = new Date()
    const d = (() => { const [y, m, day] = dob.split('-').map(Number); return new Date(y, m - 1, day) })()
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
    return d <= maxDate && d >= minDate
  }

  const isNextDisabled = () => {
    if (step === 1) {
      if (!form.display_name.trim()) return true
      if (form.date_of_birth && !isDobValid(form.date_of_birth)) return true
    }
    if (step === 2 && !form.location.trim()) return true
    return false
  }

  return (
    <div className="app-container min-h-dvh bg-[#0D0D12] flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-safe pt-6 pb-4">
        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const s = i + 1
            const done = s < step
            const active = s === step
            return (
              <motion.div
                key={s}
                animate={{
                  width: active ? 24 : 6,
                  background: done || active ? '#C8FF4D' : '#2E2E3A',
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-1.5 rounded-full"
              />
            )
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#52525E] font-medium">Step {step} of {TOTAL_STEPS}</span>
          {step > 1 && (
            <button onClick={goBack} className="text-xs text-[#8B8B9A] flex items-center gap-1 active:text-[#F2F0EB] transition-colors">
              <ArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: d >= 0 ? 60 : -60, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d >= 0 ? -60 : 60, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="flex-1 px-6 pb-6 overflow-y-auto"
        >
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#F2F0EB] mb-1">Basic Info</h2>
                <p className="text-[#8B8B9A] text-sm">Let people know who you are</p>
              </div>
              <Input label="Display Name" placeholder="How you want to be known" value={form.display_name} onChange={e => update('display_name', e.target.value)} />
              <DobPicker value={form.date_of_birth} onChange={v => update('date_of_birth', v)} />
              <GenderPicker value={form.gender} onChange={v => update('gender', v)} />
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#F2F0EB] mb-1">Your Location</h2>
                <p className="text-[#8B8B9A] text-sm">Help companions and users find you. This will appear on your profile.</p>
              </div>

              <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(200,255,77,0.08)', border: '1px solid rgba(200,255,77,0.2)' }}>
                <MapPin size={18} style={{ color: '#C8FF4D' }} className="mt-0.5 shrink-0" />
                <p className="text-sm text-[#F2F0EB] leading-relaxed">
                  Your city or area is shown publicly so people know where you're based. It helps match you with nearby companions and experiences.
                </p>
              </div>

              <PlacesAutocomplete
                value={form.location}
                onChange={v => update('location', v)}
                placeholder="Search your city, district or area…"
                label="City / Area"
                required
                showLocateButton
              />

              {form.location && (
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#C8FF4D' }}>
                  <Check size={16} style={{ color: '#C8FF4D' }} />
                  <span>{form.location}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Photos */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#F2F0EB] mb-1">Your Photos</h2>
                <p className="text-[#8B8B9A] text-sm">Upload 2–5 photos. The first becomes your main profile photo.</p>
              </div>

              {/* Large circular primary photo picker */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-dashed transition-all active:scale-95"
                  style={{ borderColor: photos.length > 0 ? '#C8FF4D' : 'rgba(200,255,77,0.4)', background: '#1C1C22' }}
                >
                  {photos.length > 0 ? (
                    <>
                      <img
                        src={photos.find(p => p.is_primary)?.url ?? photos[0].url}
                        alt="Main"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                      </div>
                    </>
                  ) : uploadingPhoto ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#C8FF4D', borderTopColor: 'transparent' }} />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Camera size={28} style={{ color: '#C8FF4D' }} />
                      <span className="text-[10px] font-semibold text-[#8B8B9A]">Add Photo</span>
                    </div>
                  )}
                </button>
                {photos.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#C8FF4D' }}>
                    <Star size={12} fill="#C8FF4D" />
                    Main photo
                  </div>
                )}
              </div>

              {/* Additional photos grid (shown after at least 1 photo) */}
              {photos.length > 0 && (
                <div>
                  <p className="text-xs text-[#52525E] mb-2 font-medium">All photos</p>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((photo, i) => (
                      <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#1C1C22]">
                        <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        {photo.is_primary && (
                          <div className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#C8FF4D' }}>
                            <Star size={8} style={{ color: '#0A1A00', fill: '#0A1A00' }} />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 flex gap-0.5">
                          {!photo.is_primary && (
                            <button onClick={() => handleSetPrimary(photo.id)} className="w-5 h-5 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <Star size={9} className="text-white" />
                            </button>
                          )}
                          <button onClick={() => handlePhotoDelete(photo.id)} className="w-5 h-5 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Trash2 size={9} className="text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors"
                        style={{ borderColor: 'rgba(200,255,77,0.3)', background: 'rgba(200,255,77,0.04)' }}
                      >
                        {uploadingPhoto ? (
                          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#C8FF4D', borderTopColor: 'transparent' }} />
                        ) : (
                          <Camera size={16} style={{ color: '#C8FF4D' }} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoAdd} />

              <div className="flex items-center justify-between text-xs text-[#52525E]">
                <span>{photos.length}/5 photos</span>
                <span style={{ color: photos.length >= 2 ? '#C8FF4D' : '#52525E' }}>
                  {photos.length >= 2 ? '✓ Minimum met' : `${2 - photos.length} more required`}
                </span>
              </div>
              <p className="text-xs text-[#52525E]">Tap ★ on any photo to set it as your main photo.</p>
            </div>
          )}

          {/* Step 4: About You */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#F2F0EB] mb-1">About You</h2>
                <p className="text-[#8B8B9A] text-sm">Write a short introduction to help others connect with you</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#8B8B9A] font-manrope">Introduction</label>
                <textarea value={form.introduction} onChange={e => update('introduction', e.target.value)} placeholder="Hi! I'm someone who loves exploring new places…" rows={3} className="mt-1.5 w-full border-[1.5px] border-[#2E2E3A] rounded-[12px] px-4 py-3 text-sm text-[#F2F0EB] placeholder:text-[#52525E] focus:outline-none focus:border-[#C8FF4D] resize-none bg-[#1C1C22]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#8B8B9A] font-manrope">About Me</label>
                <textarea value={form.bio} onChange={e => update('bio', e.target.value)} placeholder="Share more about your personality and hobbies…" rows={5} className="mt-1.5 w-full border-[1.5px] border-[#2E2E3A] rounded-[12px] px-4 py-3 text-sm text-[#F2F0EB] placeholder:text-[#52525E] focus:outline-none focus:border-[#C8FF4D] resize-none bg-[#1C1C22]" />
              </div>
            </div>
          )}

          {/* Step 5: Interests */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#F2F0EB] mb-1">Your Interests</h2>
                <p className="text-[#8B8B9A] text-sm">Pick what you're passionate about</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.map(interest => {
                  const sel = form.interest_ids.includes(interest.id)
                  return (
                    <button key={interest.id} onClick={() => toggle('interest_ids', interest.id)}
                      className="px-4 py-2 rounded-2xl text-sm font-medium transition-all border"
                      style={sel ? { background: 'rgba(200,255,77,0.15)', borderColor: '#C8FF4D', color: '#C8FF4D' } : { background: '#1C1C22', borderColor: '#2E2E3A', color: '#8B8B9A' }}>
                      {sel && <Check size={12} className="inline mr-1" />}
                      {interest.name}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-[#52525E]">{form.interest_ids.length} selected</p>
            </div>
          )}

          {/* Step 6: Languages */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#F2F0EB] mb-1">Languages</h2>
                <p className="text-[#8B8B9A] text-sm">What languages do you speak?</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => {
                  const sel = form.language_ids.includes(lang.id)
                  return (
                    <button key={lang.id} onClick={() => toggle('language_ids', lang.id)}
                      className="px-4 py-2 rounded-2xl text-sm font-medium transition-all border"
                      style={sel ? { background: 'rgba(200,255,77,0.15)', borderColor: '#C8FF4D', color: '#C8FF4D' } : { background: '#1C1C22', borderColor: '#2E2E3A', color: '#8B8B9A' }}>
                      {sel && <Check size={12} className="inline mr-1" />}
                      {lang.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 7: Experience preferences */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#F2F0EB] mb-1">Experience Preferences</h2>
                <p className="text-[#8B8B9A] text-sm">What kind of experiences are you open to?</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {services.map(service => {
                  const icon = ServiceIcons[service.slug] || '✨'
                  const selected = form.service_ids.includes(service.id)
                  return (
                    <button key={service.id} onClick={() => toggle('service_ids', service.id)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center"
                      style={selected ? { borderColor: '#C8FF4D', background: 'rgba(200,255,77,0.1)' } : { borderColor: '#2E2E3A', background: '#1C1C22' }}>
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs font-semibold leading-tight" style={{ color: selected ? '#C8FF4D' : '#8B8B9A' }}>{service.name}</span>
                      {selected && <Check size={14} style={{ color: '#C8FF4D' }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 8: Review & Complete */}
          {step === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#F2F0EB] mb-1">Almost done!</h2>
                <p className="text-[#8B8B9A] text-sm">Review your profile before getting started</p>
              </div>
              <div className="rounded-3xl p-5 space-y-4" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
                {photos.length > 0 ? (
                  <img src={photos.find(p => p.is_primary)?.url ?? photos[0].url} alt="Profile" className="w-20 h-20 rounded-full object-cover mx-auto" />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: '#1C1C22', border: '2px solid #C8FF4D' }}>
                    <span className="font-manrope font-bold text-2xl" style={{ color: '#C8FF4D' }}>{form.display_name ? form.display_name[0].toUpperCase() : '?'}</span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="font-manrope font-bold text-xl text-[#F2F0EB]">{form.display_name || 'Your Name'}</h3>
                </div>
                {form.bio && <p className="text-sm text-[#8B8B9A] text-center">{form.bio}</p>}
                {photos.length > 0 && (
                  <div>
                    <p className="text-xs text-[#52525E] mb-2">Photos ({photos.length})</p>
                    <div className="flex gap-1.5">
                      {photos.slice(0, 5).map(p => (
                        <img key={p.id} src={p.url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ))}
                    </div>
                  </div>
                )}
                {form.interest_ids.length > 0 && (
                  <div>
                    <p className="text-xs text-[#52525E] mb-2">Interests ({form.interest_ids.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.interest_ids.slice(0, 6).map(id => {
                        const interest = interests.find(i => i.id === id)
                        return interest ? <span key={id} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(200,255,77,0.15)', color: '#C8FF4D' }}>{interest.name}</span> : null
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="px-6 pb-safe pb-6 shrink-0">
        <Button
          size="lg"
          loading={save.isPending || complete.isPending || uploadingPhoto}
          onClick={next}
          disabled={isNextDisabled()}
        >
          {step === TOTAL_STEPS
            ? '🎉 Complete Setup'
            : step === 2
              ? <span className="flex items-center gap-2">Set My Location <ArrowRight size={18} /></span>
              : <span className="flex items-center gap-2">Continue <ArrowRight size={18} /></span>
          }
        </Button>
      </div>
    </div>
  )
}
