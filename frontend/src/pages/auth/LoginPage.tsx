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
import { LogoMark } from '../../components/ui/Logo'
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
    <div className="app-container min-h-dvh bg-[#0D0D12] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center px-4 pt-safe pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-[#8B8B9A] hover:bg-[#1C1C22] transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex-1 px-6 pb-10 flex flex-col"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <LogoMark size={32} />
          <span className="font-manrope font-bold text-[#F2F0EB] text-lg tracking-tight">FindYourVibe</span>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="font-manrope font-extrabold text-[2rem] text-[#F2F0EB] leading-tight tracking-[-0.5px]">
            Welcome back
          </h1>
          <p className="text-[#8B8B9A] mt-1.5 text-base">Sign in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email address"
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
              <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex justify-end -mt-1">
            <Link to="/forgot-password" className="text-sm text-[#C8FF4D] font-semibold">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" size="lg" loading={isSubmitting} className="mt-1">
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#2E2E3A]" />
          <span className="text-xs text-[#52525E] font-medium">or</span>
          <div className="flex-1 h-px bg-[#2E2E3A]" />
        </div>

        <p className="text-center text-[#8B8B9A] text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#C8FF4D] font-bold">Sign up free</Link>
        </p>
      </motion.div>
    </div>
  )
}
