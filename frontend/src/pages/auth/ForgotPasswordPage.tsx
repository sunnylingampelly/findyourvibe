import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { authApi } from '../../api/auth'
import { useToast } from '../../components/ui/Toast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({ email: z.string().email() })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch {
      toast('Failed to send reset email', 'error')
    }
  }

  return (
    <div className="app-container min-h-dvh bg-[#FAF9F6] flex flex-col">
      <div className="p-4 pt-safe">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#E8EAE6]">
          <ArrowLeft size={20} />
        </button>
      </div>
      <div className="flex-1 px-6 pb-10">
        {sent ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center pt-16">
            <div className="w-20 h-20 bg-[#E8F0EA] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} className="text-[#236B63]" />
            </div>
            <h1 className="font-manrope font-bold text-2xl text-[#24332F] mb-3">Check your email</h1>
            <p className="text-[#77817C] mb-8">We've sent a password reset link to your email address.</p>
            <Button onClick={() => navigate('/login')} size="lg">Back to Login</Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <h1 className="font-manrope font-extrabold text-3xl text-[#24332F] mb-2">Forgot password?</h1>
              <p className="text-[#77817C]">Enter your email to receive a reset link</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input label="Email" type="email" placeholder="your@email.com" leftIcon={<Mail size={16} />} error={errors.email?.message} {...register('email')} />
              <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">Send Reset Link</Button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  )
}
