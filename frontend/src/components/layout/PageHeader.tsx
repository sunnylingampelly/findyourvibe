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
}

export default function PageHeader({ title, back, right, transparent, className }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className={cn(
      'flex items-center justify-between px-4 py-4 pt-safe sticky top-0 z-50',
      transparent ? 'bg-transparent' : 'bg-[#FAF9F6]',
      className
    )}>
      <div className="flex items-center gap-2">
        {back && (
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#E8EAE6] text-[#24332F]">
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-lg font-bold text-[#24332F] font-manrope">{title}</h1>
      </div>
      {right && <div>{right}</div>}
    </header>
  )
}
