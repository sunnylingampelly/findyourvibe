import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react'
import api from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/ui/Toast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })
type FormData = z.infer<typeof schema>

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { toast } = useToast()
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/admin/auth/login', data)
      const { user, token } = res.data.data
      if (user.role !== 'super_admin') { toast('Access denied', 'error'); return }
      setAuth(user, token)
      navigate('/admin')
    } catch {
      toast('Invalid credentials', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E8EAE6] p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#194E49] to-[#4D9274] rounded-2xl flex items-center justify-center">
            <Shield size={28} className="text-white" />
          </div>
        </div>
        <h1 className="font-manrope font-extrabold text-2xl text-[#24332F] text-center mb-1">Admin Panel</h1>
        <p className="text-[#77817C] text-sm text-center mb-6">Find Your Vibe Administration</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email" type="email" placeholder="admin@findyourvibe.com" leftIcon={<Mail size={16} />} error={errors.email?.message} {...register('email')} />
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="Password"
            leftIcon={<Lock size={16} />}
            rightIcon={<button type="button" onClick={() => setShowPw(s => !s)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" size="lg" loading={isSubmitting}>Sign In to Admin</Button>
        </form>
      </div>
    </div>
  )
}
