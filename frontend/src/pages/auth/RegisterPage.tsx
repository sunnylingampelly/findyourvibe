import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/ui/Toast'
import { LogoMark } from '../../components/ui/Logo'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { toast } = useToast()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.register(data)
      const { user, token } = res.data.data
      setAuth(user, token)
      navigate('/onboarding')
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      toast(errData?.message || 'Registration failed', 'error')
    }
  }

  return (
    <div className="app-container min-h-dvh bg-[#FAF9F6] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center px-4 pt-safe pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#E8EAE6] text-[#24332F] mr-3"
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
          <span className="font-manrope font-extrabold text-[#24332F] text-lg tracking-tight">FindYourVibe</span>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="font-manrope font-extrabold text-[2rem] text-[#24332F] leading-tight tracking-[-0.5px]">
            Create account
          </h1>
          <p className="text-[#77817C] mt-1.5 text-base">Join thousands finding their vibe</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Full name"
            placeholder="Your name"
            leftIcon={<User size={16} />}
            error={errors.name?.message}
            {...register('name')}
          />
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
            placeholder="8+ characters"
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm password"
            type={showPw ? 'text' : 'password'}
            placeholder="Repeat password"
            leftIcon={<Lock size={16} />}
            error={errors.password_confirmation?.message}
            {...register('password_confirmation')}
          />

          <p className="text-xs text-[#A1AAA5] text-center leading-relaxed">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-[#236B63] underline underline-offset-2">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-[#236B63] underline underline-offset-2">Privacy Policy</Link>
          </p>

          <Button type="submit" size="lg" loading={isSubmitting}>
            Create Account
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#E8EAE6]" />
          <span className="text-xs text-[#A1AAA5] font-medium">or</span>
          <div className="flex-1 h-px bg-[#E8EAE6]" />
        </div>

        <p className="text-center text-[#77817C] text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-[#236B63] font-bold">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
