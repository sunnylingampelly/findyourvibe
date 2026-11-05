import { NavLink, useLocation } from 'react-router-dom'
import { Compass, Layers, Users, MessageCircle, User } from 'lucide-react'
import { cn } from '../../lib/utils'

const tabs = [
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/swipe', icon: Layers, label: 'Swipe' },
  { to: '/connections', icon: Users, label: 'Connect' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-[#E8EAE6] z-[100] pb-safe">
      <div className="flex items-center justify-around px-2 pt-1 pb-1">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all min-w-[56px]',
                active ? 'text-[#236B63]' : 'text-[#A1AAA5]'
              )}
            >
              <div className={cn('p-1.5 rounded-xl transition-all', active && 'bg-[#E8F0EA]')}>
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span className={cn('text-[10px] font-manrope', active ? 'font-bold' : 'font-medium')}>{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
