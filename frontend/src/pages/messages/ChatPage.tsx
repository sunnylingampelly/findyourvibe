import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Image, MoreVertical, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { connectionsApi } from '../../api/connections'
import Avatar from '../../components/ui/Avatar'
import { useAuthStore } from '../../stores/authStore'
import { cn, timeAgo } from '../../lib/utils'
import echo from '../../lib/echo'
import type { Message } from '../../types'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function groupMessages(messages: Message[]) {
  const groups: Array<{ date: string; messages: Message[] }> = []
  messages.forEach(msg => {
    const date = formatDate(msg.created_at)
    const last = groups[groups.length - 1]
    if (last && last.date === date) {
      last.messages.push(msg)
    } else {
      groups.push({ date, messages: [msg] })
    }
  })
  return groups
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  // Derive otherUser from conversation list; fall back to first message sender
  const otherUser = conv?.other_user
    ?? (messages.length > 0
        ? messages.find((m: Message) => m.sender.id !== undefined)?.sender
        : undefined)
  const groups = groupMessages(messages)

  useEffect(() => {
    if (!id) return
    const channel = echo.private(`conversation.${id}`)
      .listen('.MessageSent', (data: Message) => {
        qc.setQueryData(['messages', id], (old: { data: { data: Message[] } } | undefined) => {
          if (!old) return old
          if (old.data.data.find(m => m.id === data.id)) return old
          return { ...old, data: { ...old.data, data: [...old.data.data, data] } }
        })
        qc.invalidateQueries({ queryKey: ['conversations'] })
      })
    return () => { echo.leave(`conversation.${id}`); void channel }
  }, [id, qc])

  const send = useMutation({
    mutationFn: () => connectionsApi.sendMessage(id!, text.trim()),
    onSuccess: (res) => {
      setText('')
      const newMsg = res?.data?.data
      if (newMsg) {
        qc.setQueryData(['messages', id], (old: { data: { data: Message[] } } | undefined) => {
          if (!old) return old
          return { ...old, data: { ...old.data, data: [...old.data.data, newMsg] } }
        })
      }
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    if (!text.trim() || send.isPending) return
    send.mutate()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className="app-container flex flex-col h-dvh" style={{ background: '#F5F3EF' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-safe bg-white border-b border-[#E8EAE6] shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F4F1EA] transition-colors"
        >
          <ArrowLeft size={20} className="text-[#24332F]" />
        </button>

        {otherUser ? (
          <>
            <Avatar src={otherUser.profile_photo_url} name={otherUser.display_name} size="sm" online />
            <div className="flex-1 min-w-0">
              <h2 className="font-manrope font-bold text-[#24332F] text-sm truncate">{otherUser.display_name}</h2>
              <p className="text-xs text-[#4D9274] font-medium">Active now</p>
            </div>
          </>
        ) : (
          <div className="flex-1 space-y-1">
            <div className="skeleton h-3.5 w-28 rounded" />
            <div className="skeleton h-2.5 w-16 rounded" />
          </div>
        )}

        <div className="flex gap-1">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-[#A1AAA5] hover:bg-[#F4F1EA] transition-colors">
            <Phone size={18} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-[#A1AAA5] hover:bg-[#F4F1EA] transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5" style={{ scrollbarWidth: 'none' }}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-[#A1AAA5] text-sm">Loading messages…</div>
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full py-20 text-center"
          >
            <Avatar src={otherUser?.profile_photo_url} name={otherUser?.display_name ?? '?'} size="xl" className="mb-4 shadow-md" />
            <h3 className="font-manrope font-bold text-[#24332F] mb-1">{otherUser?.display_name}</h3>
            <p className="text-sm text-[#A1AAA5]">Say hello and start the conversation 👋</p>
          </motion.div>
        ) : (
          groups.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[#E8EAE6]" />
                <span className="text-[10px] font-semibold text-[#A1AAA5] uppercase tracking-wider">{group.date}</span>
                <div className="flex-1 h-px bg-[#E8EAE6]" />
              </div>

              <div className="space-y-1">
                {group.messages.map((msg, msgIdx) => {
                  const isMe = msg.sender.id === user?.id
                  const prevMsg = group.messages[msgIdx - 1]
                  const nextMsg = group.messages[msgIdx + 1]
                  const isFirstInChain = !prevMsg || prevMsg.sender.id !== msg.sender.id
                  const isLastInChain = !nextMsg || nextMsg.sender.id !== msg.sender.id
                  const showAvatar = !isMe && isLastInChain
                  const showTimestamp = isLastInChain

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-2 items-end',
                        isMe ? 'justify-end' : 'justify-start',
                        isFirstInChain ? 'mt-3' : 'mt-0.5'
                      )}
                    >
                      {/* Avatar placeholder to keep alignment */}
                      {!isMe && (
                        <div className="w-7 shrink-0">
                          {showAvatar && (
                            <Avatar src={msg.sender.profile_photo_url} name={msg.sender.display_name} size="xs" />
                          )}
                        </div>
                      )}

                      <div className={cn('flex flex-col max-w-[72%]', isMe ? 'items-end' : 'items-start')}>
                        <div
                          className={cn(
                            'px-4 py-2.5 text-sm leading-relaxed',
                            isMe
                              ? 'bg-[#236B63] text-white'
                              : 'bg-white text-[#24332F] border border-[#E8EAE6] shadow-sm',
                            // rounded corners
                            isMe && isFirstInChain && isLastInChain ? 'rounded-[18px]' :
                            isMe && isFirstInChain ? 'rounded-[18px] rounded-br-[6px]' :
                            isMe && isLastInChain ? 'rounded-[18px] rounded-tr-[6px]' :
                            isMe ? 'rounded-[18px] rounded-r-[6px]' :
                            !isMe && isFirstInChain && isLastInChain ? 'rounded-[18px]' :
                            !isMe && isFirstInChain ? 'rounded-[18px] rounded-bl-[6px]' :
                            !isMe && isLastInChain ? 'rounded-[18px] rounded-tl-[6px]' :
                            'rounded-[18px] rounded-l-[6px]'
                          )}
                        >
                          {msg.body}
                        </div>

                        {showTimestamp && (
                          <span className="text-[9px] text-[#A1AAA5] mt-1 px-1">{timeAgo(msg.created_at)}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 bg-white border-t border-[#E8EAE6] px-4 py-3 pb-safe">
        <div className="flex items-end gap-2">
          <button className="w-10 h-10 flex items-center justify-center text-[#A1AAA5] hover:text-[#236B63] shrink-0 transition-colors">
            <Image size={20} />
          </button>

          <div className="flex-1 bg-[#F4F1EA] rounded-2xl px-4 py-2.5">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => { setText(e.target.value); autoResize(e.target) }}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              rows={1}
              className="w-full bg-transparent text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none resize-none leading-relaxed"
              style={{ minHeight: '20px', maxHeight: '120px' }}
            />
          </div>

          <AnimatePresence>
            {text.trim() ? (
              <motion.button
                key="send"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={handleSend}
                disabled={send.isPending}
                className="w-10 h-10 bg-[#236B63] rounded-full flex items-center justify-center text-white shrink-0 shadow-md active:scale-90 transition-transform disabled:opacity-70"
              >
                <Send size={17} />
              </motion.button>
            ) : (
              <motion.div key="placeholder" className="w-10 h-10 shrink-0" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
