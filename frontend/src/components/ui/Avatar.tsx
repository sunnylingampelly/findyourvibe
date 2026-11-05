import { getInitials } from '../../lib/utils'
import { cn } from '../../lib/utils'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  online?: boolean
}

const sizes = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-2xl',
}

export default function Avatar({ src, name, size = 'md', className, online }: AvatarProps) {
  return (
    <div className={cn('relative shrink-0', className)}>
      <div className={cn('rounded-full overflow-hidden bg-[#A8C5B5] flex items-center justify-center font-manrope font-semibold text-white', sizes[size])}>
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {online !== undefined && (
        <span className={cn(
          'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white',
          online ? 'bg-[#4D9274]' : 'bg-[#A1AAA5]'
        )} />
      )}
    </div>
  )
}
