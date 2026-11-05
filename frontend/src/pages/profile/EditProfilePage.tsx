import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Camera } from 'lucide-react'
import { profileApi } from '../../api/profile'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/layout/PageHeader'
import Avatar from '../../components/ui/Avatar'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>()

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
      qc.invalidateQueries({ queryKey: ['me'] })
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
        {/* Photo */}
        <div className="flex justify-center py-6">
          <label className="relative cursor-pointer">
            <Avatar src={profile?.profile_photo_url} name={profile?.display_name || 'User'} size="2xl" />
            <div className="absolute bottom-0 right-0 w-9 h-9 bg-[#236B63] rounded-full border-2 border-white flex items-center justify-center">
              <Camera size={16} className="text-white" />
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>

        <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4">
          <Input label="Display Name" placeholder="How you appear to others" error={errors.display_name?.message} {...register('display_name', { required: 'Required' })} />

          <div>
            <label className="text-sm font-medium text-[#24332F] font-manrope">Gender</label>
            <select {...register('gender')} className="mt-1.5 w-full border-[1.5px] border-[#E8EAE6] rounded-[12px] px-4 py-3 text-sm text-[#24332F] bg-white focus:outline-none focus:border-[#236B63]">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <Input label="Date of Birth" type="date" error={errors.date_of_birth?.message} {...register('date_of_birth')} />

          <div>
            <label className="text-sm font-medium text-[#24332F] font-manrope">Introduction</label>
            <textarea
              {...register('introduction')}
              placeholder="A brief introduction about yourself"
              rows={3}
              className="mt-1.5 w-full border-[1.5px] border-[#E8EAE6] rounded-[12px] px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#24332F] font-manrope">About Me</label>
            <textarea
              {...register('bio')}
              placeholder="Tell people more about who you are…"
              rows={4}
              className="mt-1.5 w-full border-[1.5px] border-[#E8EAE6] rounded-[12px] px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none"
            />
          </div>

          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">Save Changes</Button>
        </form>
      </div>
    </div>
  )
}
