import { cn } from '../../lib/utils'
import { ShieldCheck } from 'lucide-react'

interface BadgeProps {
  children?: React.ReactNode
  variant?: 'default' | 'verified' | 'warning' | 'error' | 'success' | 'muted'
  className?: string
}

const variants = {
  default: 'bg-[#E8F0EA] text-[#236B63]',
  verified: 'bg-gradient-to-r from-[#236B63] to-[#4D9274] text-white',
  warning: 'bg-orange-100 text-orange-700',
  error: 'bg-red-100 text-[#D76D6D]',
  success: 'bg-green-100 text-[#4D9274]',
  muted: 'bg-[#F4F1EA] text-[#77817C]',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-manrope', variants[variant], className)}>
      {variant === 'verified' && <ShieldCheck size={11} />}
      {children}
    </span>
  )
}
