import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { connectionsApi } from '../../api/connections'
import AppShell from '../../components/layout/AppShell'
import Avatar from '../../components/ui/Avatar'
import { timeAgo, truncate } from '../../lib/utils'
import echo from '../../lib/echo'
import type { Connection, Conversation } from '../../types'

export default function MessagesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: convsData, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => connectionsApi.getConversations(),
    refetchInterval: 30000,
  })

  const { data: connsData, isLoading: connsLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsApi.getConnections(),
  })

  const conversations: Conversation[] = convsData?.data?.data ?? []
  const connections: Connection[] = connsData?.data?.data ?? []

  // Build a merged list: for each connection, find its conversation (if any)
  const convById = new Map(conversations.map(c => [c.id, c]))
  const convByUser = new Map(conversations.map(c => [c.other_user?.id, c]))

  const chatEntries = connections.map(conn => {
    // Try to match by conversation_id on the connection, or by other_user id
    const conv = conn.conversation_id
      ? convById.get(conn.conversation_id) ?? convByUser.get(conn.other_user?.id)
      : convByUser.get(conn.other_user?.id)
    return { conn, conv }
  })

  // Filter by search
  const filtered = chatEntries.filter(({ conn }) => {
    if (!search.trim()) return true
    const name = (conn.other_user?.display_name ?? '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  // Sort: conversations with messages first, then by last message time
  const sorted = [...filtered].sort((a, b) => {
    const aTime = a.conv?.last_message?.created_at ?? a.conn.connected_at
    const bTime = b.conv?.last_message?.created_at ?? b.conn.connected_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  const totalUnread = conversations.reduce((n, c) => n + (c.unread_count ?? 0), 0)
  const isLoading = convsLoading && connsLoading

  // Real-time: subscribe to each loaded conversation channel so the list updates instantly
  useEffect(() => {
    if (conversations.length === 0) return
    const ids = conversations.map(c => c.id)
    ids.forEach(convId => {
      echo.private(`conversation.${convId}`).listen('.MessageSent', () => {
        qc.invalidateQueries({ queryKey: ['conversations'] })
      })
    })
    return () => {
      ids.forEach(convId => echo.leave(`conversation.${convId}`))
    }
  }, [conversations.length, qc])

  const openChat = async (conn: Connection, conv?: Conversation) => {
    if (conv) {
      navigate(`/messages/${conv.id}`)
      return
    }
    if (conn.conversation_id) {
      navigate(`/messages/${conn.conversation_id}`)
      return
    }
    try {
      const res = await connectionsApi.createConversation(conn.id)
      const convId = res.data.data.id
      qc.invalidateQueries({ queryKey: ['conversations'] })
      navigate(`/messages/${convId}`)
    } catch {
      navigate(`/messages`)
    }
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="sticky top-0 z-50 border-b px-4 pt-safe pt-4 pb-3" style={{ background: 'rgba(13,13,18,0.97)', borderColor: '#2E2E3A', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-manrope font-extrabold text-[1.4rem] text-[#F2F0EB] tracking-tight">
            Messages
            {totalUnread > 0 && (
              <span className="ml-2 text-sm font-bold px-2 py-0.5 rounded-full align-middle" style={{ background: '#C8FF4D', color: '#0A1A00' }}>
                {totalUnread}
              </span>
            )}
          </h1>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525E] pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm text-[#F2F0EB] placeholder:text-[#52525E] focus:outline-none transition-colors"
            style={{ background: '#1C1C22', border: '1.5px solid #2E2E3A' }}
            onFocus={e => (e.target.style.borderColor = '#C8FF4D')}
            onBlur={e => (e.target.style.borderColor = '#2E2E3A')}
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
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: 'rgba(200,255,77,0.1)' }}>
              <MessageCircle size={30} style={{ color: '#C8FF4D' }} />
            </div>
            <h3 className="font-manrope font-bold text-[#F2F0EB] text-lg mb-2">No conversations yet</h3>
            <p className="text-[#52525E] text-sm leading-relaxed mb-6">Connect with companions to start chatting</p>
            <button
              onClick={() => navigate('/discover')}
              className="px-6 py-3 rounded-2xl text-sm font-semibold font-manrope active:scale-95 transition-transform"
              style={{ background: '#C8FF4D', color: '#0A1A00' }}
            >
              Browse Companions
            </button>
          </div>
        ) : (
          <div>
            {sorted.map(({ conn, conv }, i) => {
              const other = conn.other_user
              const hasUnread = (conv?.unread_count ?? 0) > 0
              const lastMsg = conv?.last_message
              return (
                <motion.button
                  key={conn.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#141418] active:bg-[#1C1C22] transition-colors border-b border-[#2E2E3A]/50 last:border-0"
                  onClick={() => openChat(conn, conv)}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={other?.profile_photo_url}
                      name={other?.display_name ?? 'U'}
                      size="md"
                    />
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center border-2" style={{ background: '#C8FF4D', color: '#0A1A00', borderColor: '#0D0D12' }}>
                        {conv!.unread_count > 9 ? '9+' : conv!.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`font-manrope text-sm truncate ${hasUnread ? 'font-bold text-[#F2F0EB]' : 'font-semibold text-[#F2F0EB]'}`}>
                        {other?.display_name ?? 'User'}
                      </span>
                      {lastMsg && (
                        <span className={`text-[11px] shrink-0 ${hasUnread ? 'font-semibold text-[#C8FF4D]' : 'text-[#52525E]'}`}>
                          {timeAgo(lastMsg.created_at)}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-[#F2F0EB] font-medium' : 'text-[#52525E]'}`}>
                      {lastMsg
                        ? (lastMsg.deleted ? '🚫 Message deleted' : truncate(lastMsg.body ?? '📷 Photo', 52))
                        : 'Say hello! 👋'}
                    </p>
                  </div>

                  {hasUnread && (
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#C8FF4D' }} />
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
