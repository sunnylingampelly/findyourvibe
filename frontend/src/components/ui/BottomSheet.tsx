import { type ReactNode, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export default function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={cn(
        'absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]',
        'rounded-t-3xl shadow-2xl',
        'animate-[slideUp_0.3s_ease-out]',
        className
      )} style={{ background: '#141418', borderTop: '1px solid #2E2E3A' }}>
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="w-10 h-1 bg-[#2E2E3A] rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          {title && <h3 className="font-manrope font-semibold text-[#F2F0EB] text-base mt-3">{title}</h3>}
          <button onClick={onClose} className="ml-auto mt-3 text-[#52525E] hover:text-[#F2F0EB]"><X size={20} /></button>
        </div>
        <div className="px-4 pb-8">{children}</div>
      </div>
    </div>
  )
}
