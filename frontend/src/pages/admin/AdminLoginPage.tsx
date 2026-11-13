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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#07070A' }}>
      <div className="w-full max-w-sm rounded-3xl p-8" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#C8FF4D' }}>
            <Shield size={28} style={{ color: '#0A1A00' }} />
          </div>
        </div>
        <h1 className="font-manrope font-extrabold text-2xl text-center mb-1" style={{ color: '#F2F0EB' }}>Admin Panel</h1>
        <p className="text-sm text-center mb-6" style={{ color: '#8B8B9A' }}>Find Your Vibe Administration</p>

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
