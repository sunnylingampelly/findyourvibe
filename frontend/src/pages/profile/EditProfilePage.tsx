import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { Camera, Check, ShieldCheck, Clock, Upload, Mic, MicOff, Play, Pause, Trash2, ChevronDown } from 'lucide-react'
import { profileApi } from '../../api/profile'
import { discoverApi } from '../../api/discover'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/layout/PageHeader'
import Avatar from '../../components/ui/Avatar'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { GenderPicker, DobPicker } from '../../components/ui/FormPickers'
import type { Service, User } from '../../types'

const PROMPT_OPTIONS = [
  'What makes me laugh',
  'My favourite way to spend a weekend',
  'The best trip I ever took',
  'A hidden gem in my city',
  'The activity I could do for hours',
  'My go-to conversation starter',
  'Something most people don\'t know about me',
  'What I\'m looking for in a companion',
]

const SERVICE_ICONS: Record<string, string> = {
  'movie-companion': '🎬', 'coffee-buddy': '☕', 'event-companion': '🎭',
  'travel-buddy': '✈️', 'shopping-companion': '🛍️', 'food-explorer': '🍜',
  'city-explorer': '🗺️', 'weekend-companion': '🌅', 'adventure-companion': '🏔️', 'gaming-buddy': '🎮',
}

interface FormData {
  display_name: string
  bio: string
  introduction: string
  gender: string
  date_of_birth: string
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const qc = useQueryClient()
  const servicesRef = useRef<HTMLDivElement>(null)

  const { user: storeUser } = useAuthStore()
  const { data } = useQuery({ queryKey: ['me'], queryFn: () => profileApi.getMe(), staleTime: 0 })
  const user: User = data?.data?.data ?? storeUser

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => discoverApi.getServices(),
  })
  const allServices: Service[] = servicesData?.data?.data ?? []

  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set())
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [specialtyTags, setSpecialtyTags] = useState<string[]>([])

  // Voice intro
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const playbackRef = useRef<HTMLAudioElement | null>(null)
  const recordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Prompts
  const [prompts, setPrompts] = useState<Array<{ q: string; a: string }>>([
    { q: '', a: '' }, { q: '', a: '' }, { q: '', a: '' },
  ])

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    if (user?.profile) {
      reset({
        display_name: user.profile.display_name ?? '',
        bio: user.profile.bio ?? '',
        introduction: user.profile.introduction ?? '',
        gender: user.profile.gender ?? '',
        date_of_birth: user.profile.date_of_birth ?? '',
      })
    }
    if (user?.services) {
      setSelectedServiceIds(new Set(user.services.map(s => String(s.id))))
    }
    if (user?.profile) {
      setPrompts([
        { q: user.profile.prompt_1_q ?? '', a: user.profile.prompt_1_a ?? '' },
        { q: user.profile.prompt_2_q ?? '', a: user.profile.prompt_2_a ?? '' },
        { q: user.profile.prompt_3_q ?? '', a: user.profile.prompt_3_a ?? '' },
      ])
      setSpecialtyTags((user.profile as unknown as { specialty_tags?: string[] }).specialty_tags ?? [])
    }
  }, [user, reset])

  // Scroll to services section if deep-linked from companion dashboard
  useEffect(() => {
    if (searchParams.get('section') === 'services' && servicesRef.current) {
      setTimeout(() => {
        servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    }
  }, [searchParams, allServices.length])

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const fromDashboard = searchParams.get('section') === 'services'

  const uploadSelfie = useMutation({
    mutationFn: (file: File) => profileApi.uploadSelfie(file),
    onSuccess: () => {
      toast('Selfie submitted! We\'ll review within 24 hours.', 'success')
      setSelfieFile(null)
      qc.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => toast('Failed to upload selfie', 'error'),
  })

  const save = useMutation({
    mutationFn: (formData: FormData) =>
      profileApi.updateProfile({
        ...(formData as unknown as Record<string, unknown>),
        service_ids: Array.from(selectedServiceIds),
        specialty_tags: specialtyTags,
        prompt_1_q: prompts[0].q || null,
        prompt_1_a: prompts[0].a || null,
        prompt_2_q: prompts[1].q || null,
        prompt_2_a: prompts[1].a || null,
        prompt_3_q: prompts[2].q || null,
        prompt_3_a: prompts[2].a || null,
      }),
    onSuccess: () => {
      toast('Profile updated!', 'success')
      qc.invalidateQueries({ queryKey: ['me'] })
      navigate(fromDashboard ? '/companion/dashboard' : '/profile')
    },
    onError: () => toast('Failed to save', 'error'),
  })

  const uploadVoice = useMutation({
    mutationFn: (blob: Blob) => {
      const file = new File([blob], 'voice-intro.webm', { type: blob.type })
      return profileApi.uploadVoiceIntro(file)
    },
    onSuccess: () => {
      toast('Voice intro saved!', 'success')
      setRecordedBlob(null)
      qc.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => toast('Failed to upload voice intro', 'error'),
  })

  const deleteVoice = useMutation({
    mutationFn: () => profileApi.deleteVoiceIntro(),
    onSuccess: () => {
      toast('Voice intro removed', 'success')
      qc.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => toast('Failed to remove voice intro', 'error'),
  })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      audioChunksRef.current = []
      mr.ondataavailable = e => audioChunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setIsRecording(true)
      recordTimerRef.current = setTimeout(() => stopRecording(), 30000)
    } catch {
      toast('Microphone access required', 'error')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    if (recordTimerRef.current) clearTimeout(recordTimerRef.current)
  }

  const togglePlayback = () => {
    if (!recordedBlob) return
    if (!playbackRef.current) {
      playbackRef.current = new Audio(URL.createObjectURL(recordedBlob))
      playbackRef.current.onended = () => setIsPlaying(false)
    }
    if (isPlaying) { playbackRef.current.pause(); setIsPlaying(false) }
    else { playbackRef.current.play(); setIsPlaying(true) }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await profileApi.updatePhoto(file)
      // refetchQueries awaits the full refetch so Avatar shows the new photo immediately
      await qc.refetchQueries({ queryKey: ['me'] })
      toast('Photo updated!', 'success')
    } catch {
      toast('Failed to upload photo', 'error')
    }
  }

  const profile = user?.profile

  return (
    <div className="app-container min-h-dvh bg-[#0D0D12]">
      <PageHeader title={fromDashboard ? 'Edit Profile & Services' : 'Edit Profile'} back />

      <div className="px-4 pb-10">
        {/* Photo upload */}
        <div className="flex justify-center py-6">
          <label className="relative cursor-pointer group">
            <Avatar
              src={profile?.profile_photo_url}
              name={profile?.display_name || user?.name || 'U'}
              size="2xl"
              className="border-4 border-white shadow-elevated"
            />
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={22} className="text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-md" style={{ background: '#C8FF4D', borderColor: '#0D0D12' }}>
              <Camera size={17} style={{ color: '#0A1A00' }} />
            </div>
            <input type="file" accept="image/*,.heic,.heif" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>

        <p className="text-center text-xs text-[#52525E] -mt-2 mb-6">Tap to change your photo</p>

        <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-5">
          <Input
            label="Display Name"
            placeholder="How others see you"
            error={errors.display_name?.message}
            {...register('display_name', { required: 'Display name is required' })}
          />

          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <GenderPicker value={field.value} onChange={field.onChange} />
            )}
          />

          <Controller
            name="date_of_birth"
            control={control}
            rules={{
              validate: v => {
                if (!v) return true
                const age = new Date().getFullYear() - parseInt(v.split('-')[0])
                return age >= 18 || 'You must be at least 18 years old'
              }
            }}
            render={({ field }) => (
              <DobPicker
                value={field.value}
                onChange={field.onChange}
                error={errors.date_of_birth?.message}
              />
            )}
          />

          <div>
            <label className="block text-sm font-semibold text-[#8B8B9A] font-manrope mb-1.5">Introduction</label>
            <textarea
              {...register('introduction')}
              placeholder="A brief introduction about yourself…"
              rows={3}
              className="w-full border-[1.5px] border-[#2E2E3A] rounded-2xl px-4 py-3 text-sm text-[#F2F0EB] placeholder:text-[#52525E] focus:outline-none focus:border-[#C8FF4D] resize-none bg-[#1C1C22]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#8B8B9A] font-manrope mb-1.5">About Me</label>
            <textarea
              {...register('bio')}
              placeholder="Tell people more about who you are…"
              rows={4}
              className="w-full border-[1.5px] border-[#2E2E3A] rounded-2xl px-4 py-3 text-sm text-[#F2F0EB] placeholder:text-[#52525E] focus:outline-none focus:border-[#C8FF4D] resize-none bg-[#1C1C22]"
            />
          </div>

          {/* Services section */}
          {allServices.length > 0 && (
            <div ref={servicesRef} className="scroll-mt-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-[#F2F0EB] font-manrope">
                  Services I Offer
                </label>
                {selectedServiceIds.size > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,255,77,0.15)', color: '#C8FF4D' }}>
                    {selectedServiceIds.size} selected
                  </span>
                )}
              </div>
              <p className="text-xs text-[#52525E] mb-3 leading-relaxed">
                Tap to select the services you offer. These appear on your public profile and users can book them.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {allServices.map(service => {
                  const icon = SERVICE_ICONS[service.slug] || '✨'
                  const selected = selectedServiceIds.has(String(service.id))
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(String(service.id))}
                      className="relative flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border-2 text-center transition-all active:scale-95"
                      style={selected ? { borderColor: '#C8FF4D', background: 'rgba(200,255,77,0.1)' } : { borderColor: '#2E2E3A', background: '#1C1C22' }}
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs font-semibold leading-tight" style={{ color: selected ? '#C8FF4D' : '#8B8B9A' }}>
                        {service.name}
                      </span>
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-sm" style={{ background: '#C8FF4D' }}>
                          <Check size={11} style={{ color: '#0A1A00' }} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {selectedServiceIds.size === 0 && (
                <p className="text-xs text-[#FF5C7A] text-center mt-3 flex items-center justify-center gap-1">
                  <span>⚠️</span> Select at least one service to show on your profile
                </p>
              )}
            </div>
          )}

          {/* Profile prompts */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-[#F2F0EB] font-manrope mb-0.5">Profile Prompts</label>
              <p className="text-xs text-[#52525E] mb-3">Add up to 3 Q&A cards to spark conversations on your profile.</p>
            </div>
            {prompts.map((p, i) => (
              <div key={i} className="rounded-2xl p-4 space-y-2" style={{ background: '#141418', border: '1.5px solid #2E2E3A' }}>
                <div className="relative">
                  <select
                    value={p.q}
                    onChange={e => setPrompts(prev => prev.map((pp, ii) => ii === i ? { ...pp, q: e.target.value } : pp))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none appearance-none pr-8"
                    style={{ background: '#1C1C22', border: '1.5px solid #2E2E3A', color: p.q ? '#F2F0EB' : '#52525E' }}
                  >
                    <option value="">Choose a prompt…</option>
                    {PROMPT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#52525E' }} />
                </div>
                {p.q && (
                  <textarea
                    value={p.a}
                    onChange={e => setPrompts(prev => prev.map((pp, ii) => ii === i ? { ...pp, a: e.target.value } : pp))}
                    placeholder="Your answer…"
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-xl px-3 py-2.5 text-sm placeholder:text-[#52525E] focus:outline-none resize-none"
                    style={{ background: '#1C1C22', border: '1.5px solid #2E2E3A', color: '#F2F0EB' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Voice intro */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: '#141418', border: '1.5px solid #2E2E3A' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic size={18} style={{ color: '#C8FF4D' }} />
                <span className="text-sm font-semibold text-[#F2F0EB] font-manrope">Voice Intro</span>
              </div>
              {profile?.voice_intro_url && !recordedBlob && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'rgba(200,255,77,0.15)', color: '#C8FF4D' }}>
                  <Check size={11} strokeWidth={3} /> Saved
                </span>
              )}
            </div>
            <p className="text-xs text-[#52525E] leading-relaxed">
              Record a 30-second voice intro. It plays on your profile so people can hear your personality before connecting.
            </p>

            {/* Existing voice intro playback */}
            {profile?.voice_intro_url && !recordedBlob && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#8B8B9A] flex-1">Current voice intro saved</span>
                <button
                  type="button"
                  onClick={() => deleteVoice.mutate()}
                  disabled={deleteVoice.isPending}
                  className="text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  style={{ color: '#FF5C7A' }}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            )}

            {/* Recorded blob controls */}
            {recordedBlob && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(200,255,77,0.15)' }}
                >
                  {isPlaying ? <Pause size={15} style={{ color: '#C8FF4D' }} /> : <Play size={15} style={{ color: '#C8FF4D' }} className="ml-0.5" />}
                </button>
                <span className="text-xs text-[#8B8B9A] flex-1">Recording ready</span>
                <Button
                  type="button"
                  size="sm"
                  loading={uploadVoice.isPending}
                  onClick={() => uploadVoice.mutate(recordedBlob)}
                >
                  Save
                </Button>
                <button type="button" onClick={() => { setRecordedBlob(null); playbackRef.current = null }} style={{ color: '#52525E' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            )}

            {/* Record button */}
            {!recordedBlob && (
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
                style={isRecording
                  ? { background: 'rgba(255,92,122,0.2)', color: '#FF5C7A', animation: 'pulse 2s infinite' }
                  : { background: 'rgba(200,255,77,0.1)', color: '#C8FF4D' }}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                {isRecording ? 'Stop Recording' : (profile?.voice_intro_url ? 'Record New Intro' : 'Start Recording')}
              </button>
            )}
            {isRecording && (
              <p className="text-xs text-center text-[#52525E]">Recording… (max 30 sec)</p>
            )}
          </div>

          {/* Identity verification */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: '#141418', border: '1.5px solid #2E2E3A' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} style={{ color: '#8B7CFF' }} />
                <span className="text-sm font-semibold text-[#F2F0EB] font-manrope">Identity Verification</span>
              </div>
              {profile?.identity_verified ? (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(139,124,255,0.15)', color: '#8B7CFF' }}>
                  <Check size={11} strokeWidth={3} /> Verified
                </span>
              ) : profile?.selfie_pending ? (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,159,67,0.15)', color: '#FF9F43' }}>
                  <Clock size={11} /> Pending Review
                </span>
              ) : (
                <span className="text-xs text-[#52525E]">Not verified</span>
              )}
            </div>

            {!profile?.identity_verified && (
              <>
                <p className="text-xs text-[#52525E] leading-relaxed">
                  {profile?.selfie_pending
                    ? 'Your selfie has been submitted. Our team verifies IDs within 24 hours.'
                    : 'Submit a clear selfie photo. Our team verifies IDs within 24 hours. A verified badge appears on your profile.'}
                </p>
                {!profile?.selfie_pending && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer rounded-xl px-4 py-3 transition-colors" style={{ border: '1.5px dashed #2E2E3A' }}>
                      <Upload size={16} style={{ color: '#52525E' }} />
                      <span className="text-sm text-[#52525E]">
                        {selfieFile ? selfieFile.name : 'Choose selfie photo…'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        className="hidden"
                        onChange={e => setSelfieFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {selfieFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={uploadSelfie.isPending}
                        onClick={() => uploadSelfie.mutate(selfieFile)}
                        className="w-full"
                      >
                        Submit for Verification
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Specialty tags */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: '#141418', border: '1.5px solid #2E2E3A' }}>
            <div>
              <label className="block text-sm font-semibold text-[#F2F0EB] font-manrope mb-0.5">Specialty Tags</label>
              <p className="text-xs text-[#52525E] leading-relaxed">Pick tags that describe your vibe — these show on your profile card.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Great for first-timers', 'Night out expert', 'Foodie guide', 'Culture lover',
                'Adventure seeker', 'City explorer', 'Chill & low-key', 'Great conversationalist',
                'Pet-friendly', 'Kid-friendly', 'Multilingual', 'LGBTQ+ friendly',
              ].map(tag => {
                const selected = specialtyTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSpecialtyTags(prev =>
                      selected ? prev.filter(t => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
                    )}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95"
                    style={selected
                      ? { background: 'rgba(200,255,77,0.15)', borderColor: '#C8FF4D', color: '#C8FF4D' }
                      : { background: '#1C1C22', borderColor: '#2E2E3A', color: '#8B8B9A' }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
            {specialtyTags.length >= 5 && (
              <p className="text-xs text-[#52525E]">Maximum 5 tags selected</p>
            )}
          </div>

          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
            {fromDashboard ? 'Save & Go to Pricing' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  )
}
