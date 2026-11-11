import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Send, Smile, Info, CalendarDays, MapPin,
  Clock, IndianRupee, Check, CheckCheck, CornerUpLeft, Copy, ChevronDown, X,
} from 'lucide-react'
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
  '🎵','🎶','🌺','🌻','🌙','⭐','🌊','🏖️','🎭','🎪',
]

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥']

const SERVICE_ICONS: Record<string, string> = {
  'movie-companion': '🎬', 'coffee-buddy': '☕', 'event-companion': '🎭',
  'travel-buddy': '✈️', 'shopping-companion': '🛍️', 'food-explorer': '🍜',
  'city-explorer': '🗺️', 'weekend-companion': '🌅', 'adventure-companion': '🏔️', 'gaming-buddy': '🎮',
}

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
    if (last && last.date === date) last.messages.push(msg)
    else groups.push({ date, messages: [msg] })
  })
  return groups
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-white rounded-[18px] rounded-bl-[6px] border border-[#E8EAE6] shadow-sm w-fit">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-[#A1AAA5]"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function ReadReceipt({ msg, isOptimistic }: { msg: Message; isOptimistic: boolean }) {
  if (isOptimistic) return <Check size={12} className="text-white/50" />
  if (msg.read_at) return <CheckCheck size={12} className="text-[#A8E6CF]" />
  return <CheckCheck size={12} className="text-white/60" />
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookingDetails = (routeLocation.state as any)?.bookingDetails ?? null

  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [optimistic, setOptimistic] = useState<Message[]>([])
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [contextMenu, setContextMenu] = useState<{ msg: Message } | null>(null)
  const [reactions, setReactions] = useState<Record<string, string>>({})
  const [otherTyping, setOtherTyping] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const sendingRef = useRef(false)
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>()
  const lastWhisperTime = useRef(0)
  const isNearBottom = useRef(true)
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>()
  const swipeState = useRef({ startX: 0, startY: 0, msgId: '' as string, dx: 0 })
  const [swipeDx, setSwipeDx] = useState<Record<string, number>>({})
  const messagesRef = useRef<Message[]>([])

  const { data: msgsData, isLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => connectionsApi.getMessages(id!),
    enabled: !!id,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  })

  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => connectionsApi.getConversations(),
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  })

  const serverMessages: Message[] = msgsData?.data?.data ?? []

  const messages = useMemo(() => {
    const serverIds = new Set(serverMessages.map(m => m.id))
    const pending = optimistic.filter(m => !serverIds.has(m.id))
    return [...serverMessages, ...pending].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [serverMessages, optimistic])

  useEffect(() => { messagesRef.current = messages }, [messages])

  const conversations = convsData?.data?.data ?? []
  const conv = conversations.find((c: { id: string }) => c.id === id)
  const otherUser = conv?.other_user
    ?? (messages.find((m: Message) => m.sender.id !== user?.id)?.sender)

  const groups = groupMessages(messages)

  // Smart auto-scroll: only when already near bottom
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    isNearBottom.current = dist < 80
    setShowScrollBtn(dist > 150)
  }, [])

  const scrollToBottom = () => {
    isNearBottom.current = true
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollBtn(false)
  }

  // Echo: messages + typing whisper
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
    channel.listenForWhisper('typing', () => {
      setOtherTyping(true)
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => setOtherTyping(false), 2500)
    })
    return () => {
      channel.stopListening('.MessageSent')
      echo.leave(`conversation.${id}`)
      clearTimeout(typingTimeout.current)
    }
  }, [id, qc])

  // Whisper typing (throttled)
  const whisperTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastWhisperTime.current > 800) {
      lastWhisperTime.current = now
      try { echo.private(`conversation.${id}`).whisper('typing', {}) } catch { /* ignore */ }
    }
  }, [id])

  // Close emoji when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close context menu on outside tap
  useEffect(() => {
    if (!contextMenu) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [contextMenu])

  // Message touch handlers for swipe-to-reply + long press
  const handleMsgTouchStart = useCallback((e: React.TouchEvent, msg: Message) => {
    swipeState.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, msgId: msg.id, dx: 0 }
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ msg })
    }, 480)
  }, [])

  const handleMsgTouchMove = useCallback((e: React.TouchEvent) => {
    clearTimeout(longPressTimer.current)
    const { startX, startY, msgId } = swipeState.current
    const dx = e.touches[0].clientX - startX
    const dy = Math.abs(e.touches[0].clientY - startY)
    if (dx > 8 && dy < dx * 0.6) {
      swipeState.current.dx = dx
      setSwipeDx(prev => ({ ...prev, [msgId]: Math.min(dx * 0.4, 60) }))
    }
  }, [])

  const handleMsgTouchEnd = useCallback(() => {
    clearTimeout(longPressTimer.current)
    const { msgId, dx } = swipeState.current
    if (msgId && dx > 55) {
      const msg = messagesRef.current.find(m => m.id === msgId)
      if (msg) { setReplyTo(msg); setTimeout(() => inputRef.current?.focus(), 50) }
    }
    if (msgId) setSwipeDx(prev => ({ ...prev, [msgId]: 0 }))
    swipeState.current = { startX: 0, startY: 0, msgId: '', dx: 0 }
  }, [])

  const send = useMutation({
    mutationFn: (body: string) => connectionsApi.sendMessage(id!, body),
    onMutate: (body: string) => {
      const tempId = `opt-${Date.now()}`
      const optimisticMsg: Message = {
        id: tempId,
        conversation_id: id!,
        sender_id: user!.id,
        sender: {
          id: user!.id,
          display_name: user?.name ?? '',
          profile_photo_url: (user as { profile?: { profile_photo_url?: string } })?.profile?.profile_photo_url ?? null,
        } as Message['sender'],
        body,
        type: 'text',
        read_at: null,
        created_at: new Date().toISOString(),
        attachments: [],
      }
      setOptimistic(prev => [...prev, optimisticMsg])
      return { tempId }
    },
    onSuccess: (res, _, ctx) => {
      sendingRef.current = false
      const newMsg = res?.data?.data
      if (ctx?.tempId) setOptimistic(prev => prev.filter(m => m.id !== ctx.tempId))
      if (newMsg) {
        qc.setQueryData(['messages', id], (old: { data: { data: Message[] } } | undefined) => {
          if (!old) return old
          if (old.data.data.find(m => m.id === newMsg.id)) return old
          return { ...old, data: { ...old.data, data: [...old.data.data, newMsg] } }
        })
      }
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (_, __, ctx) => {
      sendingRef.current = false
      if (ctx?.tempId) setOptimistic(prev => prev.filter(m => m.id !== ctx.tempId))
    },
  })

  const handleSend = () => {
    const body = text.trim()
    if (!body || sendingRef.current) return
    sendingRef.current = true
    setText('')
    setReplyTo(null)
    if (inputRef.current) inputRef.current.style.height = 'auto'
    isNearBottom.current = true
    send.mutate(body)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    if (e.key === 'Escape') setReplyTo(null)
  }

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const insertEmoji = (emoji: string) => {
    const ta = inputRef.current
    if (!ta) { setText(t => t + emoji); return }
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

  const copyMessage = (body: string) => {
    navigator.clipboard.writeText(body).catch(() => {})
    setContextMenu(null)
  }

  const replyToMessage = (msg: Message) => {
    setReplyTo(msg)
    setContextMenu(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const addReaction = (msgId: string, emoji: string) => {
    setReactions(prev => prev[msgId] === emoji ? { ...prev, [msgId]: '' } : { ...prev, [msgId]: emoji })
    setContextMenu(null)
  }

  return (
    <div className="app-container flex flex-col h-dvh" style={{ background: 'linear-gradient(180deg, #EDF5F2 0%, #F4F2EE 100%)' }}>

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
            <div className="relative shrink-0">
              <Avatar src={otherUser.profile_photo_url} name={otherUser.display_name} size="sm" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4D9274] rounded-full border-2 border-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-manrope font-bold text-[#24332F] text-sm truncate">{otherUser.display_name}</h2>
              <p className="text-xs text-[#4D9274] font-medium">
                {otherTyping ? 'typing…' : 'Active now'}
              </p>
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
      </div>

      {/* Booking context card */}
      <AnimatePresence>
        {bookingDetails && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="shrink-0 mx-4 mt-3"
          >
            <div className="bg-[#E8F0EA] border border-[#C8DDD2] rounded-2xl p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{SERVICE_ICONS[bookingDetails.service?.slug] ?? '✨'}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#236B63] uppercase tracking-wide">Booking Request Sent</p>
                  <p className="font-manrope font-semibold text-[#24332F] text-sm">{bookingDetails.service?.name}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#77817C]">
                {bookingDetails.date && (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={11} className="text-[#236B63]" />
                    {new Date(bookingDetails.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {bookingDetails.time}
                  </span>
                )}
                {bookingDetails.duration && (
                  <span className="flex items-center gap-1"><Clock size={11} className="text-[#236B63]" />{bookingDetails.duration}h</span>
                )}
                {bookingDetails.service?.price_per_session != null && (
                  <span className="flex items-center gap-1"><IndianRupee size={11} className="text-[#236B63]" />{Number(bookingDetails.service.price_per_session).toLocaleString('en-IN')}</span>
                )}
                {bookingDetails.location && (
                  <span className="flex items-center gap-1"><MapPin size={11} className="text-[#236B63]" />{bookingDetails.location}</span>
                )}
              </div>
              <p className="text-[10px] text-[#A1AAA5] mt-2">Waiting for them to accept · Coordinate details here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-5"
        style={{ scrollbarWidth: 'none' }}
      >
        {isLoading ? (
          <div className="flex flex-col gap-3 pt-6">
            {[72, 48, 88, 56].map((w, i) => (
              <div key={i} className={`flex gap-2 items-end ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                {i % 2 === 0 && <div className="w-7 h-7 skeleton rounded-full shrink-0" />}
                <div className="skeleton h-10 rounded-[18px]" style={{ width: `${w}%`, maxWidth: 260 }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full py-20 text-center"
          >
            <div className="relative mb-5">
              <Avatar src={otherUser?.profile_photo_url} name={otherUser?.display_name ?? '?'} size="xl" className="shadow-lg ring-4 ring-white" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#4D9274] rounded-full flex items-center justify-center border-2 border-white text-sm">👋</div>
            </div>
            <h3 className="font-manrope font-bold text-[#24332F] mb-1 text-base">{otherUser?.display_name ?? 'Your connection'}</h3>
            <p className="text-sm text-[#A1AAA5] max-w-[200px] leading-relaxed">Say hello and start the conversation!</p>
            <div className="flex gap-2 mt-5 flex-wrap justify-center">
              {['👋 Say hi!', '😊 Hello!', '🎉 Hey there!', '☕ Coffee?'].map(q => (
                <button
                  key={q}
                  onClick={() => { setText(q); inputRef.current?.focus() }}
                  className="text-xs px-3.5 py-1.5 rounded-full bg-white border border-[#E8EAE6] text-[#77817C] hover:border-[#236B63] hover:text-[#236B63] transition-colors shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {groups.map(group => (
              <div key={group.date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-[#E0E5E2]" />
                  <span className="text-[10px] font-semibold text-[#9BAAA4] uppercase tracking-wider px-2.5 py-1 bg-white/80 rounded-full border border-[#E8EAE6] shadow-sm">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-[#E0E5E2]" />
                </div>

                <div className="space-y-0.5">
                  {group.messages.map((msg, msgIdx) => {
                    const isMe = msg.sender.id === user?.id
                    const isOptimistic = msg.id.startsWith('opt-')
                    const prevMsg = group.messages[msgIdx - 1]
                    const nextMsg = group.messages[msgIdx + 1]
                    const isFirstInChain = !prevMsg || prevMsg.sender.id !== msg.sender.id
                    const isLastInChain = !nextMsg || nextMsg.sender.id !== msg.sender.id
                    const showAvatar = !isMe && isLastInChain
                    const dx = swipeDx[msg.id] ?? 0
                    const msgReaction = reactions[msg.id]

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={cn(
                          'flex gap-2 items-end group',
                          isMe ? 'justify-end' : 'justify-start',
                          isFirstInChain ? 'mt-3' : 'mt-0.5'
                        )}
                        onTouchStart={e => handleMsgTouchStart(e, msg)}
                        onTouchMove={handleMsgTouchMove}
                        onTouchEnd={handleMsgTouchEnd}
                      >
                        {/* Other user avatar placeholder */}
                        {!isMe && (
                          <div className="w-7 shrink-0 self-end mb-1">
                            {showAvatar && (
                              <Avatar src={msg.sender.profile_photo_url} name={msg.sender.display_name} size="xs" />
                            )}
                          </div>
                        )}

                        {/* Reply arrow indicator (swipe) */}
                        {dx > 0 && (
                          <div
                            className="flex items-center justify-center shrink-0 self-center"
                            style={{ opacity: Math.min(dx / 55, 1) }}
                          >
                            <div className="w-7 h-7 rounded-full bg-[#E8F0EA] flex items-center justify-center">
                              <CornerUpLeft size={14} className="text-[#236B63]" />
                            </div>
                          </div>
                        )}

                        <div
                          className={cn('flex flex-col max-w-[75%]', isMe ? 'items-end' : 'items-start')}
                          style={{ transform: `translateX(${isMe ? -dx : dx}px)`, transition: dx === 0 ? 'transform 0.25s ease' : 'none' }}
                        >
                          {/* Bubble */}
                          <div
                            className={cn(
                              'px-4 py-2.5 text-sm leading-relaxed transition-opacity select-none',
                              isOptimistic ? 'opacity-70' : 'opacity-100',
                              isMe
                                ? 'text-white shadow-sm'
                                : 'bg-white text-[#24332F] border border-[#E8EAE6] shadow-sm',
                              isMe && isFirstInChain && isLastInChain ? 'rounded-[18px]' :
                              isMe && isFirstInChain ? 'rounded-[18px] rounded-br-[5px]' :
                              isMe && isLastInChain ? 'rounded-[18px] rounded-tr-[5px]' :
                              isMe ? 'rounded-[18px] rounded-r-[5px]' :
                              !isMe && isFirstInChain && isLastInChain ? 'rounded-[18px]' :
                              !isMe && isFirstInChain ? 'rounded-[18px] rounded-bl-[5px]' :
                              !isMe && isLastInChain ? 'rounded-[18px] rounded-tl-[5px]' :
                              'rounded-[18px] rounded-l-[5px]'
                            )}
                            style={isMe ? { background: 'linear-gradient(135deg, #236B63 0%, #1D5A54 100%)' } : {}}
                            onDoubleClick={() => setReplyTo(msg)}
                          >
                            {msg.body}
                          </div>

                          {/* Reaction */}
                          {msgReaction && (
                            <button
                              onClick={() => addReaction(msg.id, msgReaction)}
                              className={cn(
                                'text-sm px-2 py-0.5 rounded-full border bg-white shadow-sm -mt-1',
                                isMe ? 'mr-1' : 'ml-1',
                                'border-[#E8EAE6]'
                              )}
                            >
                              {msgReaction}
                            </button>
                          )}

                          {/* Timestamp + read receipt */}
                          {isLastInChain && (
                            <div className={cn('flex items-center gap-1 mt-1 px-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
                              <span className="text-[10px] text-[#A1AAA5]">
                                {isOptimistic ? 'Sending…' : formatTime(msg.created_at)}
                              </span>
                              {isMe && <ReadReceipt msg={msg} isOptimistic={isOptimistic} />}
                            </div>
                          )}
                        </div>

                        {/* Desktop/tablet: quick action on hover */}
                        <div className={cn(
                          'hidden sm:flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity',
                          isMe ? 'order-first mr-1' : 'ml-1'
                        )}>
                          <button
                            onClick={() => setContextMenu({ msg })}
                            className="w-7 h-7 rounded-full bg-white border border-[#E8EAE6] shadow-sm flex items-center justify-center text-[#A1AAA5] hover:text-[#236B63] transition-colors text-xs"
                          >
                            ⋯
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {otherTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex gap-2 items-end"
                >
                  <div className="w-7 shrink-0 self-end mb-1">
                    <Avatar src={otherUser?.profile_photo_url} name={otherUser?.display_name ?? '?'} size="xs" />
                  </div>
                  <TypingDots />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-28 right-4 w-10 h-10 bg-white rounded-full shadow-lg border border-[#E8EAE6] flex items-center justify-center text-[#236B63] z-20"
          >
            <ChevronDown size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Context menu (long press) */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/20 backdrop-blur-[2px]"
            onClick={() => setContextMenu(null)}
          >
            <motion.div
              ref={contextMenuRef}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className="w-full bg-white rounded-t-3xl shadow-2xl pb-safe"
              onClick={e => e.stopPropagation()}
            >
              {/* Quick reactions */}
              <div className="flex items-center justify-around px-6 py-4 border-b border-[#F0F0F0]">
                {QUICK_REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => addReaction(contextMenu.msg.id, emoji)}
                    className={cn(
                      'text-2xl w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90',
                      reactions[contextMenu.msg.id] === emoji
                        ? 'bg-[#E8F0EA] scale-110'
                        : 'hover:bg-[#F4F1EA]'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Quoted message preview */}
              <div className="px-4 py-3 border-b border-[#F0F0F0]">
                <p className="text-xs text-[#A1AAA5] mb-1 truncate">{contextMenu.msg.sender.display_name}</p>
                <p className="text-sm text-[#24332F] line-clamp-2">{contextMenu.msg.body}</p>
              </div>

              {/* Actions */}
              <div className="py-2">
                <button
                  onClick={() => replyToMessage(contextMenu.msg)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F9F7F3] transition-colors"
                >
                  <CornerUpLeft size={18} className="text-[#236B63]" />
                  <span className="text-sm font-medium text-[#24332F]">Reply</span>
                </button>
                {contextMenu.msg.body && (
                  <button
                    onClick={() => copyMessage(contextMenu.msg.body!)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F9F7F3] transition-colors"
                  >
                    <Copy size={18} className="text-[#236B63]" />
                    <span className="text-sm font-medium text-[#24332F]">Copy text</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="shrink-0 bg-white border-t border-[#E8EAE6] pb-safe shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
        {/* Emoji picker */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              ref={emojiRef}
              key="emoji-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="border-b border-[#E8EAE6] overflow-hidden"
            >
              <div className="px-4 py-3 grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
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

        {/* Reply preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="border-b border-[#E8EAE6] overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-2.5">
                <div className="w-0.5 h-8 bg-[#236B63] rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#236B63]">{replyTo.sender.display_name}</p>
                  <p className="text-xs text-[#77817C] truncate">{replyTo.body}</p>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#F4F1EA] text-[#A1AAA5] shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
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

          <div className="flex-1 bg-[#F4F1EA] rounded-2xl px-4 py-2.5">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => { setText(e.target.value); autoResize(e.target); whisperTyping() }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowEmoji(false)}
              placeholder="Message…"
              rows={1}
              className="w-full bg-transparent text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none resize-none leading-relaxed"
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
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md active:scale-90 transition-transform"
                style={{ background: 'linear-gradient(135deg, #236B63 0%, #1D5A54 100%)' }}
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
