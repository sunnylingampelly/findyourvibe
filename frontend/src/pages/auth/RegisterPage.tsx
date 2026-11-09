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
    { label: '', color: 'bg-[#E8EAE6]' },
    { label: 'Weak',      color: 'bg-[#D76D6D]' },
    { label: 'Fair',      color: 'bg-[#D9A45B]' },
    { label: 'Good',      color: 'bg-[#4D9274]' },
    { label: 'Strong',    color: 'bg-[#236B63]' },
    { label: 'Very strong', color: 'bg-[#194E49]' },
  ]
  const level = levels[score] ?? levels[0]

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors duration-300 ${i <= score ? level.color : 'bg-[#E8EAE6]'}`}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-[11px] font-semibold ${score <= 1 ? 'text-[#D76D6D]' : score <= 2 ? 'text-[#D9A45B]' : score <= 3 ? 'text-[#4D9274]' : 'text-[#236B63]'}`}>
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
      className="bg-[#F4F9F7] border border-[#C8DDD2] rounded-2xl p-4 space-y-2.5"
    >
      <StrengthBar score={strengthScore(password)} />
      <div className="mt-3 space-y-2">
        {rules.map(rule => {
          const ok = rule.test(password)
          return (
            <div key={rule.id} className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${ok ? 'bg-[#236B63]' : 'bg-[#E8EAE6]'}`}>
                {ok
                  ? <Check size={11} className="text-white" strokeWidth={3} />
                  : <X size={10} className="text-[#A1AAA5]" strokeWidth={2.5} />
                }
              </div>
              <span className={`text-xs transition-colors duration-200 ${ok ? 'text-[#236B63] font-medium' : 'text-[#A1AAA5]'}`}>
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
    <div className="app-container min-h-dvh bg-[#FAF9F6] flex flex-col">
      {/* Back button */}
      <div className="flex items-center px-4 pt-safe pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#E8EAE6] text-[#24332F]"
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
          <span className="font-manrope font-extrabold text-[#24332F] text-lg tracking-tight">FindYourVibe</span>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="font-manrope font-extrabold text-[2rem] text-[#24332F] leading-tight tracking-[-0.5px]">
            Create account
          </h1>
          <p className="text-[#77817C] mt-1.5">Join thousands finding their vibe</p>
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

          <p className="text-xs text-[#A1AAA5] text-center leading-relaxed">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-[#236B63] underline underline-offset-2">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/terms" className="text-[#236B63] underline underline-offset-2">Privacy Policy</Link>
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
