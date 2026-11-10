import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { Camera, Check } from 'lucide-react'
import { profileApi } from '../../api/profile'
import { discoverApi } from '../../api/discover'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/layout/PageHeader'
import Avatar from '../../components/ui/Avatar'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { GenderPicker, DobPicker } from '../../components/ui/FormPickers'
import type { Service, User } from '../../types'

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

  const { data } = useQuery({ queryKey: ['me'], queryFn: () => profileApi.getMe(), staleTime: 0 })
  const user: User = data?.data?.data

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => discoverApi.getServices(),
  })
  const allServices: Service[] = servicesData?.data?.data ?? []

  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set())

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

  const save = useMutation({
    mutationFn: (formData: FormData) =>
      profileApi.updateProfile({
        ...(formData as unknown as Record<string, unknown>),
        service_ids: Array.from(selectedServiceIds),
      }),
    onSuccess: () => {
      toast('Profile updated!', 'success')
      qc.invalidateQueries({ queryKey: ['me'] })
      navigate(fromDashboard ? '/companion/dashboard' : '/profile')
    },
    onError: () => toast('Failed to save', 'error'),
  })

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await profileApi.updatePhoto(file)
      await qc.invalidateQueries({ queryKey: ['me'] })
      toast('Photo updated!', 'success')
    } catch {
      toast('Failed to upload photo', 'error')
    }
  }

  const profile = user?.profile

  return (
    <div className="app-container min-h-dvh bg-[#FAF9F6]">
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
            <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#236B63] rounded-full border-2 border-white flex items-center justify-center shadow-md">
              <Camera size={17} className="text-white" />
            </div>
            <input type="file" accept="image/*,.heic,.heif" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>

        <p className="text-center text-xs text-[#A1AAA5] -mt-2 mb-6">Tap to change your photo</p>

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
            <label className="block text-sm font-semibold text-[#24332F] font-manrope mb-1.5">Introduction</label>
            <textarea
              {...register('introduction')}
              placeholder="A brief introduction about yourself…"
              rows={3}
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#24332F] font-manrope mb-1.5">About Me</label>
            <textarea
              {...register('bio')}
              placeholder="Tell people more about who you are…"
              rows={4}
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none bg-white"
            />
          </div>

          {/* Services section */}
          {allServices.length > 0 && (
            <div ref={servicesRef} className="scroll-mt-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-[#24332F] font-manrope">
                  Services I Offer
                </label>
                {selectedServiceIds.size > 0 && (
                  <span className="text-xs font-bold text-[#236B63] bg-[#E8F0EA] px-2 py-0.5 rounded-full">
                    {selectedServiceIds.size} selected
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A1AAA5] mb-3 leading-relaxed">
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
                      className={`relative flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border-2 text-center transition-all active:scale-95 ${
                        selected
                          ? 'border-[#236B63] bg-[#E8F0EA] shadow-sm'
                          : 'border-[#E8EAE6] bg-white'
                      }`}
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className={`text-xs font-semibold leading-tight ${selected ? 'text-[#236B63]' : 'text-[#24332F]'}`}>
                        {service.name}
                      </span>
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-[#236B63] rounded-full flex items-center justify-center shadow-sm">
                          <Check size={11} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {selectedServiceIds.size === 0 && (
                <p className="text-xs text-[#D9A45B] text-center mt-3 flex items-center justify-center gap-1">
                  <span>⚠️</span> Select at least one service to show on your profile
                </p>
              )}
            </div>
          )}

          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
            {fromDashboard ? 'Save & Go to Pricing' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  )
}
