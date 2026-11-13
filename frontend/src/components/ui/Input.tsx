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
          <label className="text-sm font-medium text-[#8B8B9A] font-manrope">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525E]">{leftIcon}</div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full border-[1.5px] border-[#2E2E3A] rounded-[12px] px-4 py-3 text-sm text-[#F2F0EB] bg-[#1C1C22]',
              'placeholder:text-[#52525E] focus:outline-none focus:border-[#C8FF4D] transition-colors',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[#FF5C7A]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525E]">{rightIcon}</div>
          )}
        </div>
        {error && <p className="text-xs text-[#FF5C7A]">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
