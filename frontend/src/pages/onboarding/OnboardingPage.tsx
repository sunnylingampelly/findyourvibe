import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Camera, Check, Trash2, Star } from 'lucide-react'
import { profileApi } from '../../api/profile'
import { discoverApi } from '../../api/discover'
import { useToast } from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { GenderPicker, DobPicker } from '../../components/ui/FormPickers'
import { useAuthStore } from '../../stores/authStore'
import type { Interest, Language, Service } from '../../types'

const TOTAL_STEPS = 7

interface ProfilePhoto { id: number; url: string; is_primary: boolean; sort_order: number }

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setUser } = useAuthStore()
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    display_name: '',
    date_of_birth: '',
    gender: '',
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

  // Map frontend step → backend onboarding step (photos handled client-side only)
  const backendStep = step >= 3 ? step - 1 : step

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

  const next = async () => {
    if (step === 2) {
      // Photo step — just advance (photos already uploaded via API)
      if (photos.length < 2) { toast('Please upload at least 2 photos', 'error'); return }
      setStep(s => s + 1)
      return
    }
    if (step < TOTAL_STEPS) {
      try {
        await save.mutateAsync(form)
        setStep(s => s + 1)
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        toast(msg || 'Could not save. Please try again.', 'error')
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

  const isNextDisabled = () => {
    if (step === 1 && !form.display_name) return true
    return false
  }

  return (
    <div className="app-container min-h-dvh bg-[#FAF9F6] flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-safe pt-6 pb-4">
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < step ? 'bg-[#236B63]' : i === step - 1 ? 'bg-[#A8C5B5]' : 'bg-[#E8EAE6]'}`} />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#A1AAA5] font-medium">Step {step} of {TOTAL_STEPS}</span>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="text-xs text-[#77817C] flex items-center gap-1">
              <ArrowLeft size={12} /> Back
            </button>
          )}
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="flex-1 px-6 pb-6 overflow-y-auto"
        >
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#24332F] mb-1">Basic Info</h2>
                <p className="text-[#77817C] text-sm">Let people know who you are</p>
              </div>
              <Input label="Display Name" placeholder="How you want to be known" value={form.display_name} onChange={e => update('display_name', e.target.value)} />
              <DobPicker value={form.date_of_birth} onChange={v => update('date_of_birth', v)} />
              <GenderPicker value={form.gender} onChange={v => update('gender', v)} />
            </div>
          )}

          {/* Step 2: Photos */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#24332F] mb-1">Your Photos</h2>
                <p className="text-[#77817C] text-sm">Upload 2–5 photos. The first becomes your main photo.</p>
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, i) => (
                  <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden bg-[#E8F0EA]">
                    <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    {/* Primary badge */}
                    {photo.is_primary && (
                      <div className="absolute top-1.5 left-1.5 bg-[#236B63] rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Star size={9} className="text-white fill-white" />
                        <span className="text-[9px] text-white font-semibold">Main</span>
                      </div>
                    )}
                    {/* Actions */}
                    <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                      {!photo.is_primary && (
                        <button onClick={() => handleSetPrimary(photo.id)} className="w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Star size={11} className="text-white" />
                        </button>
                      )}
                      <button onClick={() => handlePhotoDelete(photo.id)} className="w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Trash2 size={11} className="text-white" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add photo slot */}
                {photos.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="aspect-square rounded-2xl border-2 border-dashed border-[#A8C5B5] flex flex-col items-center justify-center gap-1.5 bg-[#F4F9F7] active:bg-[#E8F0EA] transition-colors"
                  >
                    {uploadingPhoto ? (
                      <div className="w-5 h-5 border-2 border-[#236B63] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Camera size={20} className="text-[#236B63]" />
                        <span className="text-[10px] text-[#77817C] font-medium">Add photo</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoAdd} />

              <p className="text-xs text-[#A1AAA5]">
                {photos.length}/5 photos · {Math.max(0, 2 - photos.length) > 0 ? `${2 - photos.length} more required` : 'Minimum met ✓'}
              </p>
              <p className="text-xs text-[#A1AAA5]">Tap ★ on any photo to set it as your main photo.</p>
            </div>
          )}

          {/* Step 3: About You */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#24332F] mb-1">About You</h2>
                <p className="text-[#77817C] text-sm">Write a short introduction to help others connect with you</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#24332F] font-manrope">Introduction</label>
                <textarea value={form.introduction} onChange={e => update('introduction', e.target.value)} placeholder="Hi! I'm someone who loves exploring new places…" rows={3} className="mt-1.5 w-full border-[1.5px] border-[#E8EAE6] rounded-[12px] px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#24332F] font-manrope">About Me</label>
                <textarea value={form.bio} onChange={e => update('bio', e.target.value)} placeholder="Share more about your personality and hobbies…" rows={5} className="mt-1.5 w-full border-[1.5px] border-[#E8EAE6] rounded-[12px] px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none" />
              </div>
            </div>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#24332F] mb-1">Your Interests</h2>
                <p className="text-[#77817C] text-sm">Pick what you're passionate about</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.map(interest => (
                  <button key={interest.id} onClick={() => toggle('interest_ids', interest.id)} className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${form.interest_ids.includes(interest.id) ? 'bg-[#236B63] text-white' : 'bg-white border border-[#E8EAE6] text-[#77817C]'}`}>
                    {form.interest_ids.includes(interest.id) && <Check size={12} className="inline mr-1" />}
                    {interest.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#A1AAA5]">{form.interest_ids.length} selected</p>
            </div>
          )}

          {/* Step 5: Languages */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#24332F] mb-1">Languages</h2>
                <p className="text-[#77817C] text-sm">What languages do you speak?</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => (
                  <button key={lang.id} onClick={() => toggle('language_ids', lang.id)} className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${form.language_ids.includes(lang.id) ? 'bg-[#236B63] text-white' : 'bg-white border border-[#E8EAE6] text-[#77817C]'}`}>
                    {form.language_ids.includes(lang.id) && <Check size={12} className="inline mr-1" />}
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Experience preferences */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#24332F] mb-1">Experience Preferences</h2>
                <p className="text-[#77817C] text-sm">What kind of experiences are you open to?</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {services.map(service => {
                  const icon = ServiceIcons[service.slug] || '✨'
                  const selected = form.service_ids.includes(service.id)
                  return (
                    <button key={service.id} onClick={() => toggle('service_ids', service.id)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${selected ? 'border-[#236B63] bg-[#E8F0EA]' : 'border-[#E8EAE6] bg-white'}`}>
                      <span className="text-2xl">{icon}</span>
                      <span className={`text-xs font-semibold leading-tight ${selected ? 'text-[#236B63]' : 'text-[#77817C]'}`}>{service.name}</span>
                      {selected && <Check size={14} className="text-[#236B63]" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 7: Review & Complete */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-manrope font-bold text-2xl text-[#24332F] mb-1">Almost done!</h2>
                <p className="text-[#77817C] text-sm">Review your profile before getting started</p>
              </div>
              <div className="bg-white rounded-3xl border border-[#E8EAE6] p-5 space-y-4">
                {photos.length > 0 ? (
                  <img src={photos.find(p => p.is_primary)?.url ?? photos[0].url} alt="Profile" className="w-20 h-20 rounded-full object-cover mx-auto" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#A8C5B5] to-[#236B63] flex items-center justify-center mx-auto">
                    <span className="font-manrope font-bold text-2xl text-white">{form.display_name ? form.display_name[0].toUpperCase() : '?'}</span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="font-manrope font-bold text-xl text-[#24332F]">{form.display_name || 'Your Name'}</h3>
                </div>
                {form.bio && <p className="text-sm text-[#77817C] text-center">{form.bio}</p>}
                {photos.length > 0 && (
                  <div>
                    <p className="text-xs text-[#A1AAA5] mb-2">Photos ({photos.length})</p>
                    <div className="flex gap-1.5">
                      {photos.slice(0, 5).map(p => (
                        <img key={p.id} src={p.url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ))}
                    </div>
                  </div>
                )}
                {form.interest_ids.length > 0 && (
                  <div>
                    <p className="text-xs text-[#A1AAA5] mb-2">Interests ({form.interest_ids.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.interest_ids.slice(0, 6).map(id => {
                        const interest = interests.find(i => i.id === id)
                        return interest ? <span key={id} className="text-xs bg-[#E8F0EA] text-[#236B63] px-2.5 py-1 rounded-full">{interest.name}</span> : null
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
          {step === TOTAL_STEPS ? '🎉 Complete Setup' : (
            <span className="flex items-center gap-2">Continue <ArrowRight size={18} /></span>
          )}
        </Button>
      </div>
    </div>
  )
}
