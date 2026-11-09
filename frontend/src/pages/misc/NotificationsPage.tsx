import { Bell, Heart, MessageCircle, Users, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'

const mockNotifications = [
  { id: 1, type: 'connection', icon: Users, color: '#236B63', bg: '#E8F0EA', text: 'Someone sent you a connection request', time: '2m ago', unread: true },
  { id: 2, type: 'like', icon: Heart, color: '#D98D7A', bg: '#FDE8E0', text: 'Your profile was liked', time: '1h ago', unread: true },
  { id: 3, type: 'message', icon: MessageCircle, color: '#4D9274', bg: '#DFF0E8', text: 'You have a new message', time: '3h ago', unread: false },
  { id: 4, type: 'verified', icon: CheckCircle2, color: '#236B63', bg: '#E8F0EA', text: 'Your profile is now complete', time: 'Yesterday', unread: false },
]

export default function NotificationsPage() {
  return (
    <AppShell>
      <div className="screen-scroll h-dvh overflow-y-auto bg-[#FAF9F6]">
        <PageHeader title="Notifications" back />

        <div className="px-4 pb-10 space-y-2">
          {mockNotifications.length === 0 ? (
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
            mockNotifications.map((n, i) => {
              const Icon = n.icon
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 p-4 rounded-2xl border ${n.unread ? 'bg-white border-[#E8EAE6]' : 'bg-transparent border-transparent'}`}
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: n.bg }}>
                    <Icon size={18} style={{ color: n.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${n.unread ? 'font-semibold text-[#24332F]' : 'text-[#77817C]'}`}>{n.text}</p>
                    <p className="text-xs text-[#A1AAA5] mt-0.5">{n.time}</p>
                  </div>
                  {n.unread && <div className="w-2 h-2 bg-[#236B63] rounded-full shrink-0" />}
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </AppShell>
  )
}
