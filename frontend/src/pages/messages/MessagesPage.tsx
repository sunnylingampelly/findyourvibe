import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { connectionsApi } from '../../api/connections'
import AppShell from '../../components/layout/AppShell'
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
  const unreadTotal = conversations.reduce((n, c) => n + (c.unread_count ?? 0), 0)

  return (
    <AppShell>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#FAF9F6] border-b border-[#E8EAE6]/60 px-4 pt-safe pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-manrope font-extrabold text-[1.4rem] text-[#24332F] tracking-tight">
            Messages
            {unreadTotal > 0 && (
              <span className="ml-2 text-sm font-bold text-[#236B63] bg-[#E8F0EA] px-2 py-0.5 rounded-full align-middle">
                {unreadTotal}
              </span>
            )}
          </h1>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1AAA5] pointer-events-none" />
          <input
            placeholder="Search conversations…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8EAE6] rounded-2xl text-sm placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] transition-colors"
          />
        </div>
      </div>

      <div className="screen-scroll overflow-y-auto" style={{ height: 'calc(100dvh - 150px)' }}>
        {isLoading ? (
          <div className="p-4 space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-12 h-12 skeleton rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-48 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 bg-[#E8F0EA] rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-[#236B63]" />
            </div>
            <h3 className="font-manrope font-bold text-[#24332F] mb-2">No messages yet</h3>
            <p className="text-sm text-[#A1AAA5] leading-relaxed max-w-[220px]">
              Accept a connection request to start chatting with companions
            </p>
          </div>
        ) : (
          <div>
            {conversations.map((conv, i) => {
              const hasUnread = (conv.unread_count ?? 0) > 0
              return (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F4F1EA] active:bg-[#EEE9E0] transition-colors border-b border-[#E8EAE6]/50 last:border-0"
                  onClick={() => navigate(`/messages/${conv.id}`)}
                >
                  {/* Avatar + online dot */}
                  <div className="relative shrink-0">
                    <Avatar
                      src={conv.other_user?.profile_photo_url}
                      name={conv.other_user?.display_name ?? 'U'}
                      size="md"
                    />
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#236B63] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#FAF9F6]">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`font-manrope text-sm truncate ${hasUnread ? 'font-bold text-[#24332F]' : 'font-semibold text-[#24332F]'}`}>
                        {conv.other_user?.display_name ?? 'User'}
                      </span>
                      {conv.last_message && (
                        <span className={`text-[11px] shrink-0 ${hasUnread ? 'text-[#236B63] font-semibold' : 'text-[#A1AAA5]'}`}>
                          {timeAgo(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-[#24332F] font-medium' : 'text-[#A1AAA5]'}`}>
                      {conv.last_message ? truncate(conv.last_message.body ?? '📷 Photo', 52) : 'Start a conversation'}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {hasUnread && (
                    <div className="w-2 h-2 bg-[#236B63] rounded-full shrink-0" />
                  )}
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
