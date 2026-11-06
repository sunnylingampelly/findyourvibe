import { type ReactNode } from 'react'
import BottomNav from './BottomNav'

interface AppShellProps {
  children: ReactNode
  showNav?: boolean
}

export default function AppShell({ children, showNav = true }: AppShellProps) {
  return (
    <div className="app-container">
      {/* Extra bottom padding accounts for floating nav bar + safe area */}
      <main className={showNav ? 'pb-[88px]' : ''}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}
