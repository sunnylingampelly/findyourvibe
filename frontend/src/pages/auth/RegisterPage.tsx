import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/ui/Toast'
import { LogoMark } from '../../components/ui/Logo'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

// Password rule checkers
const rules = [
  { id: 'length',  label: 'At least 8 characters',      test: (p: string) => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A–Z)',  test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter (a–z)',  test: (p: string) => /[a-z]/.test(p) },
  { id: 'number',  label: 'One number (0–9)',            test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

function strengthScore(pw: string): number {
  return rules.filter(r => r.test(pw)).length
}

function StrengthBar({ score }: { score: number }) {
  const levels = [
    { label: '', color: '#2E2E3A' },
    { label: 'Weak',       color: '#FF5C7A' },
    { label: 'Fair',       color: '#FF9F43' },
    { label: 'Good',       color: '#8B7CFF' },
    { label: 'Strong',     color: '#C8FF4D' },
    { label: 'Very strong', color: '#C8FF4D' },
  ]
  const level = levels[score] ?? levels[0]

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-colors duration-300"
            style={{ background: i <= score ? level.color : '#2E2E3A' }}
          />
        ))}
      </div>
      {score > 0 && (
        <p className="text-[11px] font-semibold" style={{ color: level.color }}>
          {level.label}
        </p>
      )}
    </div>
  )
}

function PasswordChecklist({ password }: { password: string }) {
  if (!password) return null
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl p-4 space-y-2.5" style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}
    >
      <StrengthBar score={strengthScore(password)} />
      <div className="mt-3 space-y-2">
        {rules.map(rule => {
          const ok = rule.test(password)
          return (
            <div key={rule.id} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200" style={{ background: ok ? '#C8FF4D' : '#252530' }}>
                {ok
                  ? <Check size={11} style={{ color: '#0A1A00' }} strokeWidth={3} />
                  : <X size={10} style={{ color: '#52525E' }} strokeWidth={2.5} />
                }
              </div>
              <span className={`text-xs transition-colors duration-200 ${ok ? 'font-medium' : ''}`} style={{ color: ok ? '#C8FF4D' : '#52525E' }}>
                {rule.label}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

const passwordSchema = z.string()
  .min(8, 'At least 8 characters required')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character')

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: passwordSchema,
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
  const [pwValue, setPwValue] = useState('')

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
      const firstErr = errData?.errors ? Object.values(errData.errors)[0]?.[0] : undefined
      toast(firstErr ?? errData?.message ?? 'Registration failed', 'error')
    }
  }

  const pwRegistration = register('password', {
    onChange: e => setPwValue(e.target.value),
  })

  const allRulesMet = rules.every(r => r.test(pwValue))

  return (
    <div className="app-container min-h-dvh bg-[#0D0D12] flex flex-col">
      {/* Back button */}
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
        transition={{ duration: 0.3 }}
        className="flex-1 px-6 pb-10 flex flex-col overflow-y-auto"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <LogoMark size={32} />
          <span className="font-manrope font-extrabold text-[#F2F0EB] text-lg tracking-tight">FindYourVibe</span>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="font-manrope font-extrabold text-[2rem] text-[#F2F0EB] leading-tight tracking-[-0.5px]">
            Create account
          </h1>
          <p className="text-[#8B8B9A] mt-1.5">Join thousands finding their vibe</p>
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

          {/* Password with live checklist */}
          <div className="space-y-2">
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="Create a strong password"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide' : 'Show'}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              {...pwRegistration}
            />

            <AnimatePresence>
              {pwValue.length > 0 && (
                <PasswordChecklist password={pwValue} />
              )}
            </AnimatePresence>
          </div>

          <Input
            label="Confirm password"
            type={showPw ? 'text' : 'password'}
            placeholder="Repeat your password"
            leftIcon={<Lock size={16} />}
            error={errors.password_confirmation?.message}
            {...register('password_confirmation')}
          />

          <p className="text-xs text-[#52525E] text-center leading-relaxed">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-[#C8FF4D] underline underline-offset-2">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/terms" className="text-[#C8FF4D] underline underline-offset-2">Privacy Policy</Link>
          </p>

          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            disabled={!allRulesMet}
          >
            Create Account
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#2E2E3A]" />
          <span className="text-xs text-[#52525E] font-medium">or</span>
          <div className="flex-1 h-px bg-[#2E2E3A]" />
        </div>

        <p className="text-center text-[#8B8B9A] text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-[#C8FF4D] font-bold">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
