import { cn } from '../../lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:pointer-events-none font-manrope'
    const variants = {
      primary: 'bg-[#236B63] text-white hover:bg-[#194E49] rounded-[14px]',
      secondary: 'bg-[#E8F0EA] text-[#236B63] hover:bg-[#A8C5B5] rounded-[14px]',
      outline: 'border-2 border-[#236B63] text-[#236B63] hover:bg-[#E8F0EA] rounded-[14px]',
      ghost: 'text-[#236B63] hover:bg-[#E8F0EA] rounded-[12px]',
      danger: 'bg-[#D76D6D] text-white hover:bg-red-600 rounded-[14px]',
    }
    const sizes = {
      sm: 'px-4 py-2 text-sm gap-1.5',
      md: 'px-6 py-3 text-sm gap-2',
      lg: 'px-8 py-4 text-base gap-2 w-full',
    }
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
