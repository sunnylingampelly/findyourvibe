import { Bell, Heart, MessageCircle, Users, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'
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
  return new Date(iso).toLocaleDateString()
}

function notifIcon(type: string) {
  switch (type) {
    case 'connection_request': return { Icon: UserPlus, color: '#236B63', bg: '#E8F0EA' }
    case 'connection_accepted': return { Icon: Users, color: '#4D9274', bg: '#DFF0E8' }
    case 'profile_saved': return { Icon: Heart, color: '#D98D7A', bg: '#FDE8E0' }
    case 'message': return { Icon: MessageCircle, color: '#4D9274', bg: '#DFF0E8' }
    default: return { Icon: Bell, color: '#236B63', bg: '#E8F0EA' }
  }
}

export default function NotificationsPage() {
  const user = useAuthStore(s => s.user)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    staleTime: 30000,
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

  // Mark all read when page opens
  useEffect(() => {
    if (hasUnread) markAllMutation.mutate()
  }, [hasUnread])  // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time: listen for new notifications on private user channel
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

  return (
    <AppShell>
      <div className="screen-scroll h-dvh overflow-y-auto bg-[#FAF9F6]">
        <PageHeader title="Notifications" back />

        <div className="px-4 pb-10 space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#E8EAE6] animate-pulse">
                <div className="w-11 h-11 rounded-2xl bg-[#E8EAE6] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#E8EAE6] rounded w-3/4" />
                  <div className="h-2.5 bg-[#E8EAE6] rounded w-1/3" />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-16 h-16 bg-[#E8F0EA] rounded-2xl flex items-center justify-center mb-4">
                <Bell size={24} className="text-[#236B63]" />
              </div>
              <h3 className="font-manrope font-bold text-[#24332F] mb-2">All caught up</h3>
              <p className="text-[#A1AAA5] text-sm">No notifications yet</p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map((n, i) => {
                const { Icon, color, bg } = notifIcon(n.type)
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${!n.read ? 'bg-white border-[#E8EAE6]' : 'bg-transparent border-transparent'}`}
                  >
                    <div className="relative shrink-0">
                      {n.actor?.photo_url ? (
                        <img
                          src={n.actor.photo_url}
                          alt={n.actor.display_name}
                          className="w-11 h-11 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
                          <Icon size={18} style={{ color }} />
                        </div>
                      )}
                      {n.actor?.photo_url && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white" style={{ background: bg }}>
                          <Icon size={10} style={{ color }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-[#24332F]' : 'text-[#77817C]'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-[#A1AAA5] mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-[#236B63] rounded-full shrink-0" />}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </AppShell>
  )
}
