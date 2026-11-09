import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { Camera } from 'lucide-react'
import { profileApi } from '../../api/profile'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/layout/PageHeader'
import Avatar from '../../components/ui/Avatar'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { GenderPicker, DobPicker } from '../../components/ui/FormPickers'
import type { User } from '../../types'

interface FormData {
  display_name: string
  bio: string
  introduction: string
  gender: string
  date_of_birth: string
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()

  const { data } = useQuery({ queryKey: ['me'], queryFn: () => profileApi.getMe() })
  const user: User = data?.data?.data

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
  }, [user, reset])

  const save = useMutation({
    mutationFn: (data: FormData) => profileApi.updateProfile(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      toast('Profile updated!', 'success')
      qc.invalidateQueries({ queryKey: ['me'] })
      navigate('/profile')
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
      <PageHeader title="Edit Profile" back />

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
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
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

          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  )
}
