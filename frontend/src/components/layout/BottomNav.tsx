import { NavLink, useLocation } from 'react-router-dom'
import { Compass, Layers, MessageCircle, User, Heart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { connectionsApi } from '../../api/connections'
import { vibesApi } from '../../api/vibes'
import type { Conversation } from '../../types'

const tabs = [
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/swipe', icon: Layers, label: 'Swipe' },
  { to: '/vibes', icon: Heart, label: 'Vibes' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
]

function Badge({ count, color = '#FF5C7A', pulse = false }: { count: number; color?: string; pulse?: boolean }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute -top-1 -right-1 min-w-[16px] h-[16px] text-[8px] font-bold rounded-full flex items-center justify-center px-1 border-[1.5px] border-[#0D0D12] leading-none z-10"
          style={{ background: color, color: color === '#C8FF4D' ? '#0A1A00' : '#fff' }}
        >
          {count > 9 ? '9+' : count}
          {pulse && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-60"
              style={{ background: color }}
            />
          )}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

export default function BottomNav() {
  const location = useLocation()

  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => connectionsApi.getConversations(),
    refetchInterval: 10000,
    staleTime: 8000,
  })

  const { data: vibesData } = useQuery({
    queryKey: ['vibes-received'],
    queryFn: () => vibesApi.received(),
    refetchInterval: 60000,
    staleTime: 30000,
  })

  const { data: connReqData } = useQuery({
    queryKey: ['connections-received'],
    queryFn: () => connectionsApi.getReceived(),
    refetchInterval: 60000,
    staleTime: 30000,
  })

  const conversations: Conversation[] = convsData?.data?.data ?? []
  const totalUnread = conversations.reduce((n, c) => n + (c.unread_count ?? 0), 0)
  const vibeCount: number = vibesData?.data?.data?.total ?? 0
  const pendingRequests: number = (connReqData?.data?.data as unknown[])?.length ?? 0
  const vibesBadge = vibeCount + pendingRequests

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[100]"
      style={{
        background: 'rgba(14, 14, 20, 0.97)',
        borderTop: '1px solid rgba(200,255,77,0.06)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-1.5 pb-safe">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to)
          const isMessages = to === '/messages'
          const isVibes = to === '/vibes'

          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[52px]"
            >
              <div className={cn(
                'relative w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-200',
                active ? 'bg-[#C8FF4D]/12' : ''
              )}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={cn(
                    'transition-colors duration-200',
                    active ? 'text-[#C8FF4D]' : 'text-[#52525E]'
                  )}
                />

                {/* Messages: lime badge with pulse when new unread */}
                {isMessages && (
                  <Badge count={totalUnread} color="#C8FF4D" pulse={totalUnread > 0} />
                )}

                {/* Vibes: coral badge */}
                {isVibes && (
                  <Badge count={vibesBadge} color="#FF5C7A" />
                )}
              </div>
              <span className={cn(
                'text-[9.5px] font-manrope font-medium transition-colors duration-200',
                active ? 'text-[#C8FF4D] font-bold' : 'text-[#52525E]'
              )}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
