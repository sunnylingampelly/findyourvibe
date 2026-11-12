import { type ReactNode } from 'react'
import BottomNav from './BottomNav'
import UpcomingVibeBar from './UpcomingVibeBar'

interface AppShellProps {
  children: ReactNode
  showNav?: boolean
}

export default function AppShell({ children, showNav = true }: AppShellProps) {
  return (
    <div className="app-container">
      <main className={showNav ? 'pb-[64px]' : ''}>
        {children}
      </main>
      {showNav && <UpcomingVibeBar />}
      {showNav && <BottomNav />}
    </div>
  )
}
