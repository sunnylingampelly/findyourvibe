import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'
interface Toast { id: string; message: string; type: ToastType }
interface ToastContextValue { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const dismiss = (id: string) => setToasts(t => t.filter(x => x.id !== id))

  const colors: Record<ToastType, string> = {
    success: 'bg-[#4D9274] text-white',
    error: 'bg-[#D76D6D] text-white',
    warning: 'bg-[#D9A45B] text-white',
    info: 'bg-[#236B63] text-white',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[90vw] max-w-sm">
        {toasts.map(t => (
          <div key={t.id}
            className={cn('flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium animate-[fadeSlideIn_0.25s_ease-out]', colors[t.type])}
          >
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)}><X size={15} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
