import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  title: string
  back?: boolean
  right?: ReactNode
  transparent?: boolean
  className?: string
  subtitle?: string
}

export default function PageHeader({ title, back, right, transparent, className, subtitle }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 py-3.5 pt-safe sticky top-0 z-50',
        transparent ? 'bg-transparent' : 'border-b border-[#2E2E3A]',
        className
      )}
      style={transparent ? undefined : { background: 'rgba(13,13,18,0.96)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center gap-2">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#1C1C22] text-[#8B8B9A] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="text-[1.1rem] font-bold text-[#F2F0EB] font-manrope tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-[#52525E] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  )
}
