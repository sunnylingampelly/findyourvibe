import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { groupVibesApi } from '../../api/groupVibes'
import { useAuthStore } from '../../stores/authStore'
import type { GroupVibe } from '../../types'

function timeLabel(date: Date): string {
  const diffMs = date.getTime() - Date.now()
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = diffMs / 3_600_000
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  if (diffMins < 60) return `in ${diffMins}m`
  if (diffHours < 3) return `in ${Math.round(diffHours)}h`
  if (diffHours < 24) return `today at ${timeStr}`
  return `tomorrow at ${timeStr}`
}

function loadDismissed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('fyv-vibe-dismissed') ?? '[]')) }
  catch { return new Set() }
}
function saveDismissed(s: Set<string>) {
  try { localStorage.setItem('fyv-vibe-dismissed', JSON.stringify([...s])) } catch {}
}

export default function UpcomingVibeBar() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [index, setIndex] = useState(0)
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed)

  const { data } = useQuery({
    queryKey: ['group-vibes-mine'],
    queryFn: () => groupVibesApi.mine(),
    enabled: isAuthenticated(),
    refetchInterval: 5 * 60_000,
    staleTime: 2 * 60_000,
  })

  const allMine: GroupVibe[] = data?.data?.data ?? []

  const upcoming = allMine.filter(v => {
    if (!v.scheduled_at || !v.is_active) return false
    const diff = new Date(v.scheduled_at).getTime() - Date.now()
    return diff > 0 && diff <= 25 * 3_600_000 && !dismissed.has(v.id)
  })

  // Auto-advance through multiple alerts
  useEffect(() => {
    if (upcoming.length <= 1) return
    const t = setInterval(() => setIndex(i => (i + 1) % upcoming.length), 4000)
    return () => clearInterval(t)
  }, [upcoming.length])

  // Keep index in bounds after dismiss
  useEffect(() => {
    if (upcoming.length > 0 && index >= upcoming.length) setIndex(0)
  }, [upcoming.length, index])

  const dismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(dismissed).add(id)
    setDismissed(next)
    saveDismissed(next)
  }

  if (upcoming.length === 0) return null

  const alert = upcoming[index] ?? upcoming[0]
  const timeStr = timeLabel(new Date(alert.scheduled_at!))
  const isUrgent = new Date(alert.scheduled_at!).getTime() - Date.now() < 3 * 3_600_000

  return (
    <div className="fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[90] px-3 pb-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={alert.id + index}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={() => navigate('/vibes?tab=groups')}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl cursor-pointer select-none"
          style={{
            background: isUrgent
              ? 'linear-gradient(135deg, #7B2C2C 0%, #B94040 100%)'
              : 'linear-gradient(135deg, #133D38 0%, #236B63 100%)',
          }}
        >
          {/* Bell with pulse ring */}
          <div className="relative shrink-0">
            {isUrgent && (
              <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
            )}
            <div className="relative w-8 h-8 bg-white/15 rounded-full flex items-center justify-center">
              <Bell size={15} className="text-white" fill="white" />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-manrope font-bold text-[12px] leading-tight truncate">{alert.title}</p>
            <p className="text-white/70 text-[10px] mt-0.5">
              {isUrgent ? '🔴' : '🕐'} {timeStr}
              {alert.location ? ` · ${alert.location.split(',')[0]}` : ''}
            </p>
          </div>

          {/* Dot indicators */}
          {upcoming.length > 1 && (
            <div className="flex gap-1 shrink-0">
              {upcoming.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ width: i === index ? 14 : 6, opacity: i === index ? 1 : 0.4 }}
                  transition={{ duration: 0.25 }}
                  className="h-1.5 rounded-full bg-white"
                />
              ))}
            </div>
          )}

          <ChevronRight size={15} className="text-white/60 shrink-0" />

          {/* Dismiss */}
          <button
            onClick={e => dismiss(alert.id, e)}
            className="shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors"
            aria-label="Dismiss alert"
          >
            <X size={11} className="text-white" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
