import { Bell, Heart, MessageCircle, Users, UserPlus, CalendarDays, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import { notificationsApi, type AppNotification } from '../../api/notifications'
import { useAuthStore } from '../../stores/authStore'
import echo from '../../lib/echo'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function groupLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return 'Earlier'
}

function groupNotifications(list: AppNotification[]): Array<{ label: string; items: AppNotification[] }> {
  const order = ['Today', 'Yesterday', 'Earlier']
  const map: Record<string, AppNotification[]> = {}
  for (const n of list) {
    const label = groupLabel(n.created_at)
    if (!map[label]) map[label] = []
    map[label].push(n)
  }
  return order.filter(l => map[l]).map(label => ({ label, items: map[label] }))
}

function notifIcon(type: string) {
  switch (type) {
    case 'connection_request': return { Icon: UserPlus,      color: '#C8FF4D', bg: 'rgba(200,255,77,0.12)',  emoji: '🤝' }
    case 'connection_accepted': return { Icon: Users,         color: '#8B7CFF', bg: 'rgba(139,124,255,0.12)', emoji: '✅' }
    case 'profile_saved':       return { Icon: Heart,         color: '#FF5C7A', bg: 'rgba(255,92,122,0.12)',  emoji: '❤️' }
    case 'message':             return { Icon: MessageCircle, color: '#C8FF4D', bg: 'rgba(200,255,77,0.12)',  emoji: '💬' }
    case 'booking':             return { Icon: CalendarDays,  color: '#FF9F43', bg: 'rgba(255,159,67,0.12)',  emoji: '📅' }
    default:                    return { Icon: Bell,          color: '#8B8B9A', bg: 'rgba(139,139,154,0.12)', emoji: '🔔' }
  }
}

function notifRoute(n: AppNotification): string | null {
  switch (n.type) {
    case 'message': return n.data?.conversation_id ? `/messages/${n.data.conversation_id}` : '/messages'
    case 'connection_request':
    case 'connection_accepted': return '/connections'
    case 'booking': return '/bookings'
    case 'profile_saved': return n.data?.actor_id ? `/profiles/${n.data.actor_id}` : null
    default: return null
  }
}

export default function NotificationsPage() {
  const user = useAuthStore(s => s.user)
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    staleTime: 20000,
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  const notifications: AppNotification[] = data?.data?.data ?? []
  const hasUnread = notifications.some(n => !n.read)
  const unreadCount = notifications.filter(n => !n.read).length

  // Auto-mark all read on open (silent)
  useEffect(() => {
    if (hasUnread) markAllMutation.mutate()
  }, [hasUnread]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewNotification = useCallback((incoming: AppNotification) => {
    qc.setQueryData(['notifications'], (old: any) => {
      if (!old?.data?.data) return old
      const exists = old.data.data.some((n: AppNotification) => n.id === incoming.id)
      if (exists) return old
      return {
        ...old,
        data: { ...old.data, data: [{ ...incoming, read: false }, ...old.data.data] },
      }
    })
    qc.invalidateQueries({ queryKey: ['notifications-unread'] })
  }, [qc])

  useEffect(() => {
    if (!user?.id) return
    const channel = echo.private(`App.Models.User.${user.id}`)
    channel.listen('.NotificationCreated', handleNewNotification)
    return () => { channel.stopListening('.NotificationCreated') }
  }, [user?.id, handleNewNotification])

  const groups = groupNotifications(notifications)

  return (
    <AppShell>
      <div className="screen-scroll h-dvh overflow-y-auto" style={{ background: '#0D0D12' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 sticky top-0 z-10"
          style={{ background: 'rgba(13,13,18,0.97)', borderBottom: '1px solid rgba(200,255,77,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          <div>
            <h1 className="font-manrope font-bold text-[#F2F0EB] text-lg leading-tight">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs" style={{ color: '#C8FF4D' }}>{unreadCount} new</p>
            )}
          </div>
          {hasUnread && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'rgba(200,255,77,0.1)', color: '#C8FF4D', border: '1px solid rgba(200,255,77,0.2)' }}
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
        </div>

        <div className="px-4 pt-4 pb-24 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-2xl animate-pulse" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
                  <div className="w-12 h-12 rounded-2xl shrink-0" style={{ background: '#252530' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-full w-3/4" style={{ background: '#252530' }} />
                    <div className="h-2.5 rounded-full w-1/3" style={{ background: '#1C1C22' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-28 text-center"
            >
              {/* Illustration */}
              <div className="relative mb-6">
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center"
                  style={{ background: 'rgba(200,255,77,0.08)', border: '1px solid rgba(200,255,77,0.15)' }}
                >
                  <span className="text-4xl">🎉</span>
                </div>
                <div
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: '#141418', border: '1px solid #2E2E3A' }}
                >
                  <Bell size={16} style={{ color: '#C8FF4D' }} />
                </div>
              </div>
              <h3 className="font-manrope font-bold text-[#F2F0EB] text-lg mb-2">All caught up! 🎉</h3>
              <p className="text-[#52525E] text-sm max-w-[200px] leading-relaxed">
                You're up to date. We'll notify you when something new happens.
              </p>
            </motion.div>
          ) : (
            groups.map(({ label, items }) => (
              <div key={label}>
                {/* Date group label */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#52525E' }}>{label}</span>
                  <div className="flex-1 h-px" style={{ background: '#2E2E3A' }} />
                </div>

                <AnimatePresence initial={false}>
                  <div className="space-y-2">
                    {items.map((n, i) => {
                      const { Icon, color, bg } = notifIcon(n.type)
                      const route = notifRoute(n)
                      const isUnread = !n.read

                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 16 }}
                          transition={{ delay: i * 0.04, duration: 0.25 }}
                          onClick={() => route && navigate(route)}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${route ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                          style={{
                            background: isUnread ? '#141418' : 'rgba(20,20,24,0.4)',
                            borderColor: isUnread ? 'rgba(200,255,77,0.12)' : '#2E2E3A',
                            boxShadow: isUnread ? '0 2px 12px rgba(0,0,0,0.3)' : 'none',
                          }}
                        >
                          {/* Avatar / icon */}
                          <div className="relative shrink-0">
                            {n.actor?.photo_url ? (
                              <img
                                src={n.actor.photo_url}
                                alt={n.actor.display_name}
                                className="w-12 h-12 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
                                <Icon size={20} style={{ color }} />
                              </div>
                            )}
                            {/* Type overlay badge when has actor photo */}
                            {n.actor?.photo_url && (
                              <div
                                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-xl flex items-center justify-center border-2 border-[#0D0D12]"
                                style={{ background: bg }}
                              >
                                <Icon size={11} style={{ color }} />
                              </div>
                            )}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-[#F2F0EB]' : 'font-normal text-[#8B8B9A]'}`}>
                              {n.message}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color: '#52525E' }}>{timeAgo(n.created_at)}</p>
                          </div>

                          {/* Unread dot */}
                          {isUnread && (
                            <div className="relative w-2.5 h-2.5 shrink-0">
                              <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ background: '#C8FF4D' }} />
                              <div className="relative w-2.5 h-2.5 rounded-full" style={{ background: '#C8FF4D' }} />
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}
