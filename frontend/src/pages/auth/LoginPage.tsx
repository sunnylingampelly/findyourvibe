import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/ui/Toast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { toast } = useToast()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data)
      const { user, token } = res.data.data
      setAuth(user, token)
      if (!user.onboarding_completed_at) navigate('/onboarding')
      else if (user.role === 'super_admin') navigate('/admin')
      else navigate('/discover')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed'
      toast(message, 'error')
    }
  }

  return (
    <div className="app-container min-h-dvh bg-[#FAF9F6] flex flex-col">
      <div className="p-4 pt-safe">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#E8EAE6] text-[#24332F]">
          <ArrowLeft size={20} />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 px-6 pb-10">
        <div className="mb-8">
          <h1 className="font-manrope font-extrabold text-3xl text-[#24332F] mb-2">Welcome back</h1>
          <p className="text-[#77817C]">Sign in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            leftIcon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button type="button" onClick={() => setShowPw(s => !s)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-[#236B63] font-medium">Forgot password?</Link>
          </div>

          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">Sign In</Button>
        </form>

        <p className="text-center text-[#77817C] text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#236B63] font-semibold">Sign up</Link>
        </p>
      </motion.div>
    </div>
  )
}
