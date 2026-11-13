import { cn } from '../../lib/utils'
import { ShieldCheck } from 'lucide-react'

interface BadgeProps {
  children?: React.ReactNode
  variant?: 'default' | 'verified' | 'warning' | 'error' | 'success' | 'muted'
  className?: string
}

const variants = {
  default:  'bg-[#1C1C22] text-[#8B8B9A]',
  verified: 'bg-[#8B7CFF]/15 text-[#8B7CFF]',
  warning:  'bg-[#FF9F43]/15 text-[#FF9F43]',
  error:    'bg-[#FF5C7A]/15 text-[#FF5C7A]',
  success:  'bg-[#C8FF4D]/15 text-[#C8FF4D]',
  muted:    'bg-[#1C1C22] text-[#52525E]',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-manrope', variants[variant], className)}>
      {variant === 'verified' && <ShieldCheck size={11} />}
      {children}
    </span>
  )
}
