import { cn } from '../../lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-[#24332F] font-manrope">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1AAA5]">{leftIcon}</div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full border-[1.5px] border-[#E8EAE6] rounded-[12px] px-4 py-3 text-sm text-[#24332F] bg-white',
              'placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] transition-colors',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[#D76D6D]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1AAA5]">{rightIcon}</div>
          )}
        </div>
        {error && <p className="text-xs text-[#D76D6D]">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
