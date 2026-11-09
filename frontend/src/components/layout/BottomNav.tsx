import { NavLink, useLocation } from 'react-router-dom'
import { Compass, Layers, Users, MessageCircle, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { connectionsApi } from '../../api/connections'
import type { Conversation } from '../../types'

const tabs = [
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/swipe', icon: Layers, label: 'Swipe' },
  { to: '/connections', icon: Users, label: 'Connect' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()

  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => connectionsApi.getConversations(),
    refetchInterval: 15000,
    staleTime: 10000,
  })

  const conversations: Conversation[] = convsData?.data?.data ?? []
  const totalUnread = conversations.reduce((n, c) => n + (c.unread_count ?? 0), 0)

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[100] pb-safe">
      <div className="mx-3 mb-2 bg-white/90 backdrop-blur-xl border border-[#E8EAE6]/80 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around px-1 py-1">
          {tabs.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to)
            const isMessages = to === '/messages'
            const showBadge = isMessages && totalUnread > 0

            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl min-w-[56px] transition-all"
              >
                <div className={cn(
                  'relative w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-200',
                  active ? 'bg-[#E8F0EA]' : ''
                )}>
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={cn('transition-colors duration-200', active ? 'text-[#236B63]' : 'text-[#A1AAA5]')}
                  />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-[#D76D6D] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1 border border-white leading-none">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-manrope font-medium transition-colors duration-200',
                  active ? 'text-[#236B63] font-bold' : 'text-[#A1AAA5]'
                )}>
                  {label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
