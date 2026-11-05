import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { connectionsApi } from '../../api/connections'
import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'
import Avatar from '../../components/ui/Avatar'
import { timeAgo, truncate } from '../../lib/utils'
import type { Conversation } from '../../types'

export default function MessagesPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => connectionsApi.getConversations(),
    refetchInterval: 10000,
  })

  const conversations: Conversation[] = data?.data?.data ?? []

  return (
    <AppShell>
      <PageHeader title="Messages" />

      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1AAA5]" />
          <input placeholder="Search conversations…" className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8EAE6] rounded-2xl text-sm placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63]" />
        </div>
      </div>

      <div className="screen-scroll overflow-y-auto" style={{ height: 'calc(100dvh - 150px)' }}>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-12 h-12 skeleton rounded-full" />
                <div className="flex-1 space-y-2"><div className="skeleton h-4 w-32" /><div className="skeleton h-3 w-48" /></div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">💬</div>
            <h3 className="font-manrope font-semibold text-[#24332F] mb-1">No messages yet</h3>
            <p className="text-sm text-[#A1AAA5]">Accept a connection request to start chatting</p>
          </div>
        ) : (
          <div>
            {conversations.map((conv, i) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F4F1EA] transition-colors border-b border-[#E8EAE6]/50"
                onClick={() => navigate(`/messages/${conv.id}`)}
              >
                <div className="relative">
                  <Avatar src={conv.other_user?.profile_photo_url} name={conv.other_user?.display_name ?? 'User'} size="md" />
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#236B63] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`font-manrope font-semibold text-sm text-[#24332F] ${conv.unread_count > 0 ? 'font-bold' : ''}`}>
                      {conv.other_user?.display_name ?? 'User'}
                    </h3>
                    {conv.last_message && (
                      <span className="text-xs text-[#A1AAA5]">{timeAgo(conv.last_message.created_at)}</span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-[#24332F] font-medium' : 'text-[#A1AAA5]'}`}>
                    {conv.last_message ? truncate(conv.last_message.body ?? 'Photo', 50) : 'Start a conversation'}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
