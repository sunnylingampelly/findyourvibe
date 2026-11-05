import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Image, MoreVertical } from 'lucide-react'
import { connectionsApi } from '../../api/connections'
import Avatar from '../../components/ui/Avatar'
import { useAuthStore } from '../../stores/authStore'
import { cn, timeAgo } from '../../lib/utils'
import echo from '../../lib/echo'
import type { Message } from '../../types'

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: msgsData, isLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => connectionsApi.getMessages(id!),
    enabled: !!id,
  })

  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => connectionsApi.getConversations(),
  })

  const messages: Message[] = msgsData?.data?.data ?? []
  const conversations = convsData?.data?.data ?? []
  const conv = conversations.find((c: { id: string }) => c.id === id)
  const otherUser = conv?.other_user

  // Real-time WebSocket subscription
  useEffect(() => {
    if (!id) return

    const channel = echo.private(`conversation.${id}`)
      .listen('.MessageSent', (data: Message) => {
        qc.setQueryData(['messages', id], (old: { data: { data: Message[] } } | undefined) => {
          if (!old) return old
          const existing = old.data.data.find(m => m.id === data.id)
          if (existing) return old
          return {
            ...old,
            data: { ...old.data, data: [...old.data.data, data] },
          }
        })
        qc.invalidateQueries({ queryKey: ['conversations'] })
      })

    return () => {
      echo.leave(`conversation.${id}`)
      void channel
    }
  }, [id, qc])

  const send = useMutation({
    mutationFn: () => connectionsApi.sendMessage(id!, text.trim()),
    onSuccess: (res) => {
      setText('')
      const newMsg = res?.data?.data
      if (newMsg) {
        qc.setQueryData(['messages', id], (old: { data: { data: Message[] } } | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: { ...old.data, data: [...old.data.data, newMsg] },
          }
        })
      }
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim()) return
    send.mutate()
  }

  return (
    <div className="app-container flex flex-col h-dvh bg-[#FAF9F6]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-safe bg-white border-b border-[#E8EAE6] shrink-0">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#E8EAE6]">
          <ArrowLeft size={20} />
        </button>
        {otherUser ? (
          <>
            <Avatar src={otherUser.profile_photo_url} name={otherUser.display_name} size="sm" online />
            <div className="flex-1">
              <h2 className="font-manrope font-semibold text-[#24332F] text-sm">{otherUser.display_name}</h2>
              <p className="text-xs text-[#4D9274]">Online</p>
            </div>
          </>
        ) : (
          <div className="flex-1"><div className="skeleton h-4 w-32" /></div>
        )}
        <button className="text-[#A1AAA5]"><MoreVertical size={20} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-[#A1AAA5] text-sm py-8">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-sm text-[#77817C]">Say hello to {otherUser?.display_name}!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender.id === user?.id
            return (
              <div key={msg.id} className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}>
                {!isMe && <Avatar src={msg.sender.profile_photo_url} name={msg.sender.display_name} size="xs" />}
                <div className={cn('max-w-[72%]', isMe ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
                  <div className={cn('px-4 py-2.5 rounded-2xl text-sm leading-relaxed', isMe ? 'bg-[#236B63] text-white rounded-br-sm' : 'bg-white border border-[#E8EAE6] text-[#24332F] rounded-bl-sm')}>
                    {msg.body}
                  </div>
                  <span className="text-[10px] text-[#A1AAA5] px-1">{timeAgo(msg.created_at)}</span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 pb-safe bg-white border-t border-[#E8EAE6]">
        <div className="flex items-end gap-2">
          <button className="w-10 h-10 flex items-center justify-center text-[#A1AAA5] shrink-0">
            <Image size={20} />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Type a message…"
              rows={1}
              className="w-full border border-[#E8EAE6] rounded-2xl px-4 py-2.5 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none max-h-28 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || send.isPending}
            className="w-10 h-10 bg-[#236B63] rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-50 active:scale-90 transition-transform"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
