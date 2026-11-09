import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Smile, MoreVertical, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { connectionsApi } from '../../api/connections'
import Avatar from '../../components/ui/Avatar'
import { useAuthStore } from '../../stores/authStore'
import { cn, timeAgo } from '../../lib/utils'
import echo from '../../lib/echo'
import type { Message } from '../../types'

const EMOJI_LIST = [
  '😀','😂','🥰','😍','🤩','😎','🥳','🤔','😅','😭',
  '😤','😢','🤣','😊','🙏','❤️','🔥','👍','👏','💯',
  '🎉','🫶','😘','🤗','😴','🤯','🫡','😇','🤭','🫂',
  '💪','✨','🌟','💫','🎊','😆','🥹','😋','😏','🤝',
  '👋','🙌','💕','💖','💙','🌈','🍀','🌸','🫠','😌',
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
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
  const [showEmoji, setShowEmoji] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

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
    ?? (messages.length > 0
        ? messages.find((m: Message) => m.sender.id !== undefined)?.sender
        : undefined)
  const groups = groupMessages(messages)

  // Close emoji panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!id) return
    const channel = echo.private(`conversation.${id}`)
    channel.listen('.MessageSent', (data: Message) => {
      qc.setQueryData(['messages', id], (old: { data: { data: Message[] } } | undefined) => {
        if (!old) return old
        if (old.data.data.find(m => m.id === data.id)) return old
        return { ...old, data: { ...old.data, data: [...old.data.data, data] } }
      })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    })
    return () => {
      channel.stopListening('.MessageSent')
      echo.leave(`conversation.${id}`)
    }
  }, [id, qc])

  const send = useMutation({
    mutationFn: () => connectionsApi.sendMessage(id!, text.trim()),
    onSuccess: (res) => {
      setText('')
      if (inputRef.current) inputRef.current.style.height = 'auto'
      const newMsg = res?.data?.data
      if (newMsg) {
        qc.setQueryData(['messages', id], (old: { data: { data: Message[] } } | undefined) => {
          if (!old) return old
          // Dedup: WebSocket broadcast may have already added this message
          if (old.data.data.find(m => m.id === newMsg.id)) return old
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

  const insertEmoji = (emoji: string) => {
    const ta = inputRef.current
    if (!ta) {
      setText(t => t + emoji)
      return
    }
    const start = ta.selectionStart ?? text.length
    const end = ta.selectionEnd ?? text.length
    const next = text.slice(0, start) + emoji + text.slice(end)
    setText(next)
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + emoji.length
      ta.focus()
      autoResize(ta)
    })
  }

  return (
    <div className="app-container flex flex-col h-dvh" style={{ background: 'linear-gradient(180deg, #EFF6F4 0%, #F5F3EF 100%)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-safe bg-white/95 backdrop-blur-md border-b border-[#E8EAE6] shrink-0 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F4F1EA] transition-colors"
        >
          <ArrowLeft size={20} className="text-[#24332F]" />
        </button>

        {otherUser ? (
          <button
            onClick={() => navigate(`/profile/${otherUser.id}`)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            <Avatar src={otherUser.profile_photo_url} name={otherUser.display_name} size="sm" online />
            <div className="min-w-0">
              <h2 className="font-manrope font-bold text-[#24332F] text-sm truncate">{otherUser.display_name}</h2>
              <p className="text-xs text-[#4D9274] font-medium">Active now</p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 skeleton rounded-full shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="skeleton h-3.5 w-28 rounded" />
              <div className="skeleton h-2.5 w-16 rounded" />
            </div>
          </div>
        )}

        <button className="w-9 h-9 flex items-center justify-center rounded-xl text-[#A1AAA5] hover:bg-[#F4F1EA] transition-colors">
          <Info size={18} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-xl text-[#A1AAA5] hover:bg-[#F4F1EA] transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5" style={{ scrollbarWidth: 'none' }}>
        {isLoading ? (
          <div className="flex flex-col gap-3 pt-6">
            {[72, 48, 88, 56].map((w, i) => (
              <div key={i} className={`flex gap-2 items-end ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                {i % 2 === 0 && <div className="w-7 h-7 skeleton rounded-full shrink-0" />}
                <div className={`skeleton h-9 rounded-[18px]`} style={{ width: `${w}%`, maxWidth: 260 }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full py-20 text-center"
          >
            <div className="relative mb-4">
              <Avatar src={otherUser?.profile_photo_url} name={otherUser?.display_name ?? '?'} size="xl" className="shadow-lg" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#4D9274] rounded-full flex items-center justify-center border-2 border-white text-sm">👋</div>
            </div>
            <h3 className="font-manrope font-bold text-[#24332F] mb-1 text-base">{otherUser?.display_name ?? 'Your connection'}</h3>
            <p className="text-sm text-[#A1AAA5] max-w-[200px] leading-relaxed">Say hello and start the conversation!</p>
            <div className="flex gap-2 mt-4 flex-wrap justify-center">
              {['👋 Say hi!', '😊 Hello!', '🎉 Hey there!'].map(q => (
                <button
                  key={q}
                  onClick={() => { setText(q); inputRef.current?.focus() }}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-[#E8EAE6] text-[#77817C] hover:border-[#236B63] hover:text-[#236B63] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          groups.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[#E8EAE6]" />
                <span className="text-[10px] font-semibold text-[#A1AAA5] uppercase tracking-wider px-2 py-1 bg-[#F5F3EF] rounded-full border border-[#E8EAE6]">
                  {group.date}
                </span>
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
                      {!isMe && (
                        <div className="w-7 shrink-0">
                          {showAvatar && (
                            <Avatar src={msg.sender.profile_photo_url} name={msg.sender.display_name} size="xs" />
                          )}
                        </div>
                      )}

                      <div className={cn('flex flex-col max-w-[75%]', isMe ? 'items-end' : 'items-start')}>
                        <div
                          className={cn(
                            'px-4 py-2.5 text-sm leading-relaxed',
                            isMe
                              ? 'bg-[#236B63] text-white shadow-sm'
                              : 'bg-white text-[#24332F] border border-[#E8EAE6] shadow-sm',
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
      <div className="shrink-0 bg-white border-t border-[#E8EAE6] pb-safe shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
        {/* Emoji panel */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              ref={emojiRef}
              key="emoji-panel"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="border-b border-[#E8EAE6] px-4 py-3"
            >
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    onMouseDown={e => { e.preventDefault(); insertEmoji(emoji) }}
                    className="text-xl h-9 flex items-center justify-center rounded-lg hover:bg-[#F4F1EA] active:scale-90 transition-all"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 px-3 py-2.5">
          <button
            onClick={() => setShowEmoji(s => !s)}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-full transition-colors shrink-0',
              showEmoji ? 'text-[#236B63] bg-[#E8F0EA]' : 'text-[#A1AAA5] hover:text-[#236B63] hover:bg-[#F4F1EA]'
            )}
          >
            <Smile size={22} />
          </button>

          <div className="flex-1 bg-[#F4F1EA] rounded-2xl px-4 py-2.5 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => { setText(e.target.value); autoResize(e.target) }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowEmoji(false)}
              placeholder="Message…"
              rows={1}
              className="flex-1 bg-transparent text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none resize-none leading-relaxed"
              style={{ minHeight: '20px', maxHeight: '120px' }}
            />
          </div>

          <AnimatePresence mode="wait">
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
              <motion.div
                key="placeholder"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="w-10 h-10 shrink-0"
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
