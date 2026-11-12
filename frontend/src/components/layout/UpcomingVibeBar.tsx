import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, X, MessageCircle, Heart, Users, UserPlus, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { groupVibesApi } from '../../api/groupVibes'
import { connectionsApi } from '../../api/connections'
import { vibesApi } from '../../api/vibes'
import api from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import type { GroupVibe, Conversation, Notification } from '../../types'

// ── types ─────────────────────────────────────────────────────────────────────
type AlertKind = 'message' | 'vibe' | 'connect' | 'group' | 'notification'

interface AlertItem {
  id: string
  kind: AlertKind
  title: string
  subtitle: string
  navigateTo: string
  urgent?: boolean
  dismissible?: boolean
}

// ── helpers ───────────────────────────────────────────────────────────────────
function timeLabel(date: Date): string {
  const diffMs = date.getTime() - Date.now()
  const mins = Math.round(diffMs / 60_000)
  const hrs = diffMs / 3_600_000
  const t = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (mins < 60) return `in ${mins}m`
  if (hrs < 3) return `in ${Math.round(hrs)}h`
  if (hrs < 24) return `today at ${t}`
  return `tomorrow at ${t}`
}

function loadDismissed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('fyv-alerts-dismissed') ?? '[]')) }
  catch { return new Set() }
}
function saveDismissed(s: Set<string>) {
  try { localStorage.setItem('fyv-alerts-dismissed', JSON.stringify([...s])) } catch {}
}

const KIND_ICON: Record<AlertKind, React.ElementType> = {
  message: MessageCircle,
  vibe: Heart,
  connect: UserPlus,
  group: Clock,
  notification: Bell,
}

const KIND_COLOR: Record<AlertKind, [string, string]> = {
  message:      ['#1A4A6B', '#2563EB'],
  vibe:         ['#4A1A3A', '#9D3A6A'],
  connect:      ['#133D38', '#236B63'],
  group:        ['#133D38', '#236B63'],
  notification: ['#2D3340', '#4A5568'],
}

// ── component ─────────────────────────────────────────────────────────────────
export default function ActivityAlertBar() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const enabled = isAuthenticated()

  const [index, setIndex] = useState(0)
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed)

  // ── queries (all cached — BottomNav uses same keys) ────────────────────────
  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => connectionsApi.getConversations(),
    enabled, refetchInterval: 15_000, staleTime: 10_000,
  })
  const { data: vibesData } = useQuery({
    queryKey: ['vibes-received'],
    queryFn: () => vibesApi.received(),
    enabled, refetchInterval: 60_000, staleTime: 30_000,
  })
  const { data: connReqData } = useQuery({
    queryKey: ['connections-received'],
    queryFn: () => connectionsApi.getReceived(),
    enabled, refetchInterval: 60_000, staleTime: 30_000,
  })
  const { data: groupData } = useQuery({
    queryKey: ['group-vibes-mine'],
    queryFn: () => groupVibesApi.mine(),
    enabled, refetchInterval: 5 * 60_000, staleTime: 2 * 60_000,
  })
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
    enabled, refetchInterval: 60_000, staleTime: 30_000,
  })

  // ── build unified alert list ───────────────────────────────────────────────
  const alerts: AlertItem[] = useMemo(() => {
    const items: AlertItem[] = []

    // 1. Upcoming group vibes (urgent first)
    const groups: GroupVibe[] = groupData?.data?.data ?? []
    groups
      .filter(v => {
        if (!v.scheduled_at || !v.is_active) return false
        const diff = new Date(v.scheduled_at).getTime() - Date.now()
        return diff > 0 && diff <= 25 * 3_600_000
      })
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
      .forEach(v => {
        const diff = new Date(v.scheduled_at!).getTime() - Date.now()
        items.push({
          id: `group-${v.id}`,
          kind: 'group',
          title: v.title,
          subtitle: `${timeLabel(new Date(v.scheduled_at!))}${v.location ? ` · ${v.location.split(',')[0]}` : ''}`,
          navigateTo: '/vibes?tab=groups',
          urgent: diff < 3 * 3_600_000,
          dismissible: true,
        })
      })

    // 2. Unread messages
    const convs: Conversation[] = convsData?.data?.data ?? []
    const unreadConvs = convs.filter(c => c.unread_count > 0)
    if (unreadConvs.length > 0) {
      const totalUnread = unreadConvs.reduce((n, c) => n + c.unread_count, 0)
      const names = unreadConvs.slice(0, 2).map(c => c.other_user.display_name.split(' ')[0]).join(', ')
      items.push({
        id: 'messages-unread',
        kind: 'message',
        title: totalUnread === 1 ? '1 unread message' : `${totalUnread} unread messages`,
        subtitle: names + (unreadConvs.length > 2 ? ` +${unreadConvs.length - 2} more` : ''),
        navigateTo: '/messages',
        urgent: false,
        dismissible: false,
      })
    }

    // 3. Pending connection requests
    const connReqs = (connReqData?.data?.data ?? []) as unknown[]
    if (connReqs.length > 0) {
      items.push({
        id: 'connect-requests',
        kind: 'connect',
        title: connReqs.length === 1 ? '1 connection request' : `${connReqs.length} connection requests`,
        subtitle: 'Tap to review',
        navigateTo: '/vibes?tab=connect',
        urgent: false,
        dismissible: false,
      })
    }

    // 4. New vibes received
    const vibeCount: number = vibesData?.data?.data?.total ?? 0
    if (vibeCount > 0) {
      items.push({
        id: 'vibes-received',
        kind: 'vibe',
        title: vibeCount === 1 ? '1 person vibed you 💚' : `${vibeCount} people vibed you 💚`,
        subtitle: 'Check who liked your profile',
        navigateTo: '/vibes',
        urgent: false,
        dismissible: false,
      })
    }

    // 5. Unread notifications (most recent, skip types already surfaced above)
    const skippedTypes = new Set(['group_vibe_joined', 'connection_request', 'connection_accepted'])
    const notifs: Notification[] = notifData?.data?.data ?? []
    const unreadNotifs = notifs.filter(n => !n.read_at && !skippedTypes.has(n.type))
    if (unreadNotifs.length > 0) {
      const latest = unreadNotifs[0]
      const msg = (latest.data as { message?: string }).message ?? 'New notification'
      items.push({
        id: `notif-${latest.id}`,
        kind: 'notification',
        title: msg,
        subtitle: unreadNotifs.length > 1 ? `+${unreadNotifs.length - 1} more notifications` : 'Tap to view',
        navigateTo: '/notifications',
        urgent: false,
        dismissible: false,
      })
    }

    return items.filter(a => !a.dismissible || !dismissed.has(a.id))
  }, [convsData, vibesData, connReqData, groupData, notifData, dismissed])

  // ── auto-advance ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (alerts.length <= 1) { setIndex(0); return }
    const t = setInterval(() => setIndex(i => (i + 1) % alerts.length), 4500)
    return () => clearInterval(t)
  }, [alerts.length])

  useEffect(() => {
    if (alerts.length > 0 && index >= alerts.length) setIndex(0)
  }, [alerts.length, index])

  const dismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(dismissed).add(id)
    setDismissed(next)
    saveDismissed(next)
  }

  if (alerts.length === 0) return null

  const alert = alerts[index] ?? alerts[0]
  const Icon = KIND_ICON[alert.kind]
  const [colorA, colorB] = KIND_COLOR[alert.kind]

  return (
    <div className="fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[90] px-3 pb-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={() => navigate(alert.navigateTo)}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl cursor-pointer select-none"
          style={{ background: `linear-gradient(135deg, ${colorA} 0%, ${colorB} 100%)` }}
        >
          {/* Icon with optional pulse */}
          <div className="relative shrink-0">
            {alert.urgent && <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />}
            <div className="relative w-8 h-8 bg-white/15 rounded-full flex items-center justify-center">
              <Icon size={15} className="text-white" />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-manrope font-bold text-[12px] leading-tight truncate">{alert.title}</p>
            <p className="text-white/65 text-[10px] mt-0.5 truncate">{alert.subtitle}</p>
          </div>

          {/* Dot indicators */}
          {alerts.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              {alerts.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ width: i === index ? 14 : 5, opacity: i === index ? 1 : 0.35 }}
                  transition={{ duration: 0.25 }}
                  className="h-[5px] rounded-full bg-white"
                />
              ))}
            </div>
          )}

          <ChevronRight size={15} className="text-white/60 shrink-0" />

          {/* Dismiss (only for dismissible alerts) */}
          {alert.dismissible ? (
            <button
              onClick={e => dismiss(alert.id, e)}
              className="shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors"
              aria-label="Dismiss"
            >
              <X size={11} className="text-white" />
            </button>
          ) : (
            <div className="w-1" />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
