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
    <header className={cn(
      'flex items-center justify-between px-4 py-3.5 pt-safe sticky top-0 z-50',
      transparent ? 'bg-transparent' : 'bg-[#FAF9F6] border-b border-[#E8EAE6]/70',
      className
    )}>
      <div className="flex items-center gap-2">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#E8EAE6] text-[#24332F] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="text-[1.1rem] font-bold text-[#24332F] font-manrope tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-[#A1AAA5] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  )
}
