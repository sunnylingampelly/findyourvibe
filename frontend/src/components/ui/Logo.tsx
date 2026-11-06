import { cn } from '../../lib/utils'

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
      <rect width="40" height="40" rx="11" fill="#236B63" />
      <rect x="6"  y="17" width="3.5" height="6"  rx="1.75" fill="white" />
      <rect x="12" y="11" width="3.5" height="18" rx="1.75" fill="white" />
      <rect x="18" y="14" width="3.5" height="12" rx="1.75" fill="white" />
      <rect x="24" y="8"  width="3.5" height="24" rx="1.75" fill="white" />
      <rect x="30" y="15" width="3.5" height="10" rx="1.75" fill="white" />
    </svg>
  )
}

export function Wordmark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={34} />
      <span className={cn('font-manrope font-extrabold text-[20px] tracking-[-0.5px]', light ? 'text-white' : 'text-[#24332F]')}>
        FindYourVibe
      </span>
    </div>
  )
}
