import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Send, Smile, Info, CalendarDays,
  Clock, IndianRupee, Check, CheckCheck, CornerUpLeft, Copy, ChevronDown, X, Trash2, Star,
  Mic, Play, Pause, MapPin, Search,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { connectionsApi } from '../../api/connections'
import { bookingsApi } from '../../api/bookings'
import Avatar from '../../components/ui/Avatar'
import BottomSheet from '../../components/ui/BottomSheet'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../lib/utils'
import echo from '../../lib/echo'
import type { Message, Booking } from '../../types'

const EMOJI_LIST = [
  // Faces & emotions
  '😀','😁','😂','🤣','😃','😄','😅','😆','😊','😇',
  '🥰','😍','🤩','😘','😗','🥹','😙','😚','😋','😛',
  '😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤯','😏',
  '😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫',
  '😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳',
  '🥵','🥶','😱','😨','😰','😥','😓','🫣','🤗','🫡',
  '🤔','🫠','🤭','🫢','🤫','😶','😑','😬','🙄','😯',
  '😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐',
  '🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','😈','👿',
  // Hand gestures
  '👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲',
  '🤝','🙏','✍️','💅','🤳','💪','🦾','👋','🤚','✋',
  '🖖','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👌',
  '🤌','🤏','✌️','🤞','🫰','🖐️','🫵','🫶','❤️‍🔥','💋',
  // Hearts & love
  '❤️','🧡','💛','💚','💙','💜','🤍','🖤','🩷','🩵',
  '💕','💞','💓','💗','💖','💘','💝','💟','❣️','💔',
  // People & activities
  '🎉','🎊','🥳','🎈','🎁','🎀','🏆','🥇','🎯','⚽',
  '🏀','🎮','🎲','🎸','🎵','🎶','🎤','🎧','📸','📱',
  // Nature
  '🌸','🌺','🌻','🌹','🌷','🌼','🌱','🌿','🍀','🍁',
  '🌊','🌈','⭐','🌟','✨','💫','🌙','☀️','🌤️','⛅',
  '🦋','🐝','🌸','🦄','🐬','🦁','🐼','🦊','🐧','🦅',
  // Food & drink
  '🍕','🍔','🍟','🌮','🍜','🍣','🍩','🍰','🎂','🍫',
  '☕','🧋','🍵','🥤','🍺','🥂','🍾','🍓','🍉','🍇',
  // Objects & misc
  '🔥','💯','💥','❗','❓','💬','👀','🫀','🧠','💡',
  '🎭','🌀','🔮','💎','🏅','🎪','🎠','🎡','🎢','🌴',
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
    <div className="flex items-center gap-1 px-4 py-3 rounded-[18px] rounded-bl-[5px] w-fit" style={{ background: '#1C1C22' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: '#52525E' }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function ReadReceipt({ msg, isOptimistic }: { msg: Message; isOptimistic: boolean }) {
  if (isOptimistic) return <Check size={11} style={{ color: 'rgba(10,26,0,0.45)' }} />
  if (msg.read_at) return <CheckCheck size={11} style={{ color: '#8B7CFF' }} />
  return <CheckCheck size={11} style={{ color: 'rgba(10,26,0,0.45)' }} />
}

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined

function LocationMessage({ body, isMe }: { body: string; isMe: boolean }) {
  let lat = 0, lng = 0, address = 'My Location'
  try {
    const d = JSON.parse(body.replace('__LOCATION__:', ''))
    lat = d.lat; lng = d.lng; address = d.address || 'My Location'
  } catch {
    return <span className="text-xs">📍 Location</span>
  }
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`
  const mapImg = MAPS_KEY
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=280x150&scale=2&markers=color:red%7C${lat},${lng}&style=feature:poi%7Cvisibility:off&key=${MAPS_KEY}`
    : null
  return (
    <a
      href={mapsLink}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', minWidth: 200, maxWidth: 240, textDecoration: 'none' }}
    >
      {mapImg && (
        <img src={mapImg} alt="Map" className="w-full rounded-xl" style={{ height: 110, objectFit: 'cover', display: 'block' }} />
      )}
      <div className="flex items-center gap-1.5 pt-1.5 pb-0.5">
        <MapPin size={13} style={{ color: '#C8FF4D', flexShrink: 0 }} />
        <span className="text-xs font-semibold truncate" style={{ color: isMe ? '#0A1A00' : '#F2F0EB' }}>{address}</span>
      </div>
      <span style={{ color: isMe ? 'rgba(10,26,0,0.6)' : '#8B8B9A', fontSize: 10 }}>Tap to open in Maps ↗</span>
    </a>
  )
}

const WAVEFORM_BARS = [4, 8, 14, 10, 6, 16, 12, 8, 14, 6, 10, 18, 8, 12, 6, 14, 10, 8, 16, 6]

function AudioMessage({ url, isMe }: { url: string; isMe: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play().catch(() => {}); setPlaying(true) }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-2.5 py-0.5" style={{ minWidth: 180 }}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={e => {
          const a = e.currentTarget
          setCurrentTime(a.currentTime)
          setProgress(a.duration ? a.currentTime / a.duration : 0)
        }}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0) }}
      />
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
        style={{ background: isMe ? '#0A1A00' : '#C8FF4D' }}
      >
        {playing
          ? <Pause size={14} style={{ color: isMe ? '#C8FF4D' : '#0A1A00' }} />
          : <Play size={14} className="ml-0.5" style={{ color: isMe ? '#C8FF4D' : '#0A1A00' }} />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-end gap-[2px]" style={{ height: 20 }}>
          {WAVEFORM_BARS.map((h, i) => (
            <div
              key={i}
              className="rounded-full transition-colors"
              style={{
                width: 3,
                height: h,
                background: i / WAVEFORM_BARS.length <= progress
                  ? (isMe ? '#0A1A00' : '#C8FF4D')
                  : (isMe ? 'rgba(10,26,0,0.3)' : '#2E2E3A'),
              }}
            />
          ))}
        </div>
        <span className="text-[10px] leading-none" style={{ color: isMe ? 'rgba(10,26,0,0.5)' : '#52525E' }}>
          {currentTime > 0.5 ? fmt(currentTime) : fmt(duration)}
        </span>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const prefill = searchParams.get('prefill') ?? ''
  const [text, setText] = useState(prefill)
  const [showEmoji, setShowEmoji] = useState(false)
  const [optimistic, setOptimistic] = useState<Message[]>([])
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [contextMenu, setContextMenu] = useState<{ msg: Message } | null>(null)
  const [allReactions, setAllReactions] = useState<Record<string, Record<string, string>>>({})
  const myId = user?.id
  const [otherTyping, setOtherTyping] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingText, setRatingText] = useState('')
  const [showChatOptions, setShowChatOptions] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [locSending, setLocSending] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMsgSender, setNewMsgSender] = useState<string | null>(null)
  const prevMsgCountRef = useRef(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const sendingRef = useRef(false)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastWhisperTime = useRef(0)
  const isNearBottom = useRef(true)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const swipeState = useRef({ startX: 0, startY: 0, msgId: '' as string, dx: 0 })
  const [swipeDx, setSwipeDx] = useState<Record<string, number>>({})
  const messagesRef = useRef<Message[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

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
    staleTime: 60000,
  })

  const serverMessages: Message[] = Array.isArray(msgsData?.data?.data) ? msgsData.data.data : []

  const messages = useMemo(() => {
    const serverIds = new Set(serverMessages.map(m => m.id))
    const pending = optimistic.filter(m => !serverIds.has(m.id))
    return [...serverMessages, ...pending].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [serverMessages, optimistic])

  useEffect(() => { messagesRef.current = messages }, [messages])

  // Seed reactions map from server messages (merge server state into local)
  useEffect(() => {
    if (!serverMessages.length) return
    setAllReactions(prev => {
      const next = { ...prev }
      serverMessages.forEach(m => {
        if (m.reactions) next[m.id] = m.reactions
      })
      return next
    })
  }, [serverMessages])

  const conversations = convsData?.data?.data ?? []
  const conv = conversations.find((c: { id: string }) => c.id === id)
  // Derive other user from: conversation object → any message sender that isn't me → conversation last_message sender
  const otherUser = conv?.other_user
    ?? (messages.find((m: Message) => m.sender.id !== user?.id)?.sender)
    ?? (conv?.last_message?.sender?.id !== user?.id ? conv?.last_message?.sender : undefined)

  // Bookings where current user is the requester (booked a companion)
  const { data: bookingsData } = useQuery({
    queryKey: ['bookings', 'requester', otherUser?.id],
    queryFn: () => bookingsApi.getMyBookings('requester'),
    enabled: !!otherUser?.id,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  })

  // Bookings where current user is the companion (someone booked them)
  const { data: compBookingsData } = useQuery({
    queryKey: ['bookings', 'companion-chat', otherUser?.id],
    queryFn: () => bookingsApi.getMyBookings('companion'),
    enabled: !!otherUser?.id,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  })

  const { liveBooking, userBookingRole } = useMemo(() => {
    if (!otherUser?.id || !user?.id) return { liveBooking: null as Booking | null, userBookingRole: null as 'requester' | 'companion' | null }
    const isActive = (b: Booking) => b.status !== 'cancelled' && !(b.status === 'completed' && b.rating)
    const reqAll: Booking[] = bookingsData?.data?.data ?? []
    const compAll: Booking[] = compBookingsData?.data?.data ?? []
    const asReq = reqAll.find(b => b.companion?.id === otherUser.id && isActive(b)) ?? null
    const asComp = compAll.find(b => b.requester?.id === otherUser.id && isActive(b)) ?? null
    if (asReq) return { liveBooking: asReq, userBookingRole: 'requester' as const }
    if (asComp) return { liveBooking: asComp, userBookingRole: 'companion' as const }
    return { liveBooking: null as Booking | null, userBookingRole: null as 'requester' | 'companion' | null }
  }, [bookingsData, compBookingsData, otherUser?.id, user?.id])

  const isPastDate = useMemo(() => {
    if (!liveBooking?.proposed_date) return false
    return new Date(liveBooking.proposed_date) < new Date(new Date().toDateString())
  }, [liveBooking?.proposed_date])

  const groups = groupMessages(messages)

  // Smart auto-scroll: only when already near bottom
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setNewMsgSender(null)
    } else if (messages.length > prevMsgCountRef.current) {
      // New message arrived while scrolled up — show sender name pill
      const newest = messages[messages.length - 1]
      if (newest && newest.sender.id !== user?.id) {
        setNewMsgSender(newest.sender.display_name)
      }
    }
    prevMsgCountRef.current = messages.length
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
    setNewMsgSender(null)
  }

  // Echo: messages + typing whisper
  useEffect(() => {
    if (!id) return
    const channel = echo.private(`conversation.${id}`)
    channel.listen('.MessageSent', (data: Message) => {
      qc.setQueryData(['messages', id], (old: { data: { data: Message[] } } | undefined) => {
        if (!old) return old
        const existing: Message[] = Array.isArray(old.data.data) ? old.data.data : []
        if (existing.find(m => m.id === data.id)) return old
        return { ...old, data: { ...old.data, data: [...existing, data] } }
      })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    })
    channel.listen('.ReactionAdded', (data: { message_id: string; user_id: string; emoji: string | null; removed: boolean }) => {
      setAllReactions(prev => {
        const msgRxns = { ...(prev[data.message_id] ?? {}) }
        if (data.removed || !data.emoji) delete msgRxns[data.user_id]
        else msgRxns[data.user_id] = data.emoji
        return { ...prev, [data.message_id]: msgRxns }
      })
    })
    channel.listenForWhisper('typing', () => {
      setOtherTyping(true)
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => setOtherTyping(false), 2500)
    })
    return () => {
      channel.stopListening('.MessageSent')
      channel.stopListening('.ReactionAdded')
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
          const existing: Message[] = Array.isArray(old.data.data) ? old.data.data : []
          if (existing.find(m => m.id === newMsg.id)) return old
          return { ...old, data: { ...old.data, data: [...existing, newMsg] } }
        })
      }
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (_, __, ctx) => {
      sendingRef.current = false
      if (ctx?.tempId) setOptimistic(prev => prev.filter(m => m.id !== ctx.tempId))
    },
  })

  const voiceSend = useMutation({
    mutationFn: (form: FormData) => connectionsApi.sendAttachment(id!, form),
    onSuccess: (res) => {
      const newMsg = res?.data?.data
      if (newMsg) {
        qc.setQueryData(['messages', id], (old: { data: { data: Message[] } } | undefined) => {
          if (!old) return old
          const existing: Message[] = Array.isArray(old.data.data) ? old.data.data : []
          if (existing.find(m => m.id === newMsg.id)) return old
          return { ...old, data: { ...old.data, data: [...existing, newMsg] } }
        })
      }
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => toast('Failed to send voice message', 'error'),
  })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []

      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (audioChunksRef.current.length > 0 && blob.size > 0) {
          const form = new FormData()
          form.append('attachment', blob, `voice-${Date.now()}.webm`)
          isNearBottom.current = true
          voiceSend.mutate(form)
        }
      }

      mr.start(100)
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch {
      toast('Microphone access denied', 'error')
    }
  }

  const stopRecording = (send = true) => {
    if (!mediaRecorderRef.current) return
    if (!send) {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
      }
    }
    try { mediaRecorderRef.current.stop() } catch { /* already stopped */ }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    setIsRecording(false)
    setRecordingTime(0)
  }

  const fmtRecTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const sendLocation = () => {
    if (!navigator.geolocation) { toast('Location not supported on this device', 'error'); return }
    setLocSending(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        const body = `__LOCATION__:${JSON.stringify({ lat, lng, address: 'My Location' })}`
        isNearBottom.current = true
        send.mutate(body)
        setLocSending(false)
      },
      () => { toast('Location access denied', 'error'); setLocSending(false) },
      { timeout: 10000 }
    )
  }

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

  const deleteMutation = useMutation({
    mutationFn: (msgId: string) => connectionsApi.deleteMessage(id!, msgId),
    onSuccess: (_, msgId) => {
      qc.setQueryData(['messages', id], (old: { data: { data: Message[] } } | undefined) => {
        if (!old) return old
        const existing: Message[] = Array.isArray(old.data.data) ? old.data.data : []
        return {
          ...old,
          data: {
            ...old.data,
            data: existing.map(m => m.id === msgId ? { ...m, deleted: true, body: null } : m),
          },
        }
      })
      setContextMenu(null)
    },
  })

  const bookingActionMutation = useMutation({
    mutationFn: (status: 'accepted' | 'declined' | 'cancelled' | 'completed') =>
      bookingsApi.updateBooking(liveBooking!.id, status),
    onSuccess: (_, status) => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      if (status === 'completed' && userBookingRole === 'requester') {
        setTimeout(() => setShowRating(true), 400)
      }
    },
    onError: () => toast('Could not update booking, try again', 'error'),
  })

  const rateMutation = useMutation({
    mutationFn: () => bookingsApi.rateBooking(liveBooking!.id, ratingValue, ratingText || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      setShowRating(false)
      setRatingValue(0)
      setRatingText('')
      toast('Thanks for your review! ⭐', 'success')
    },
    onError: () => toast('Could not submit review', 'error'),
  })

  const clearMutation = useMutation({
    mutationFn: () => connectionsApi.clearConversation(id!),
    onSuccess: () => {
      qc.setQueryData(['messages', id], (old: { data: { data: Message[] } } | undefined) => {
        if (!old) return old
        return { ...old, data: { ...old.data, data: [] } }
      })
      setOptimistic([])
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setShowChatOptions(false)
      setConfirmClear(false)
      toast('Chat cleared', 'success')
    },
    onError: () => toast('Could not clear chat, try again', 'error'),
  })

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
    if (!myId) return
    const myCurrentEmoji = allReactions[msgId]?.[myId]
    const isToggleOff = myCurrentEmoji === emoji

    setAllReactions(prev => {
      const msgRxns = { ...(prev[msgId] ?? {}) }
      if (isToggleOff) delete msgRxns[myId]
      else msgRxns[myId] = emoji
      return { ...prev, [msgId]: msgRxns }
    })
    setContextMenu(null)

    connectionsApi.reactToMessage(msgId, emoji).catch(() => {
      // revert on error
      setAllReactions(prev => {
        const msgRxns = { ...(prev[msgId] ?? {}) }
        if (isToggleOff) msgRxns[myId] = emoji
        else delete msgRxns[myId]
        return { ...prev, [msgId]: msgRxns }
      })
    })
  }

  // Message search helpers
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part)
            ? <mark key={i} style={{ background: 'rgba(200,255,77,0.35)', color: '#0A1A00', borderRadius: 2, padding: '0 1px' }}>{part}</mark>
            : <span key={i}>{part}</span>
        )}
      </>
    )
  }

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups
    const q = searchQuery.toLowerCase()
    return groups
      .map(g => ({
        ...g,
        messages: g.messages.filter(m => m.body && m.body.toLowerCase().includes(q) && !m.deleted),
      }))
      .filter(g => g.messages.length > 0)
  }, [groups, searchQuery])

  const searchResultCount = filteredGroups.reduce((n, g) => n + g.messages.length, 0)

  return (
    <div className="app-container flex flex-col h-dvh" style={{ background: '#0D0D12' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 pt-safe shrink-0" style={{ background: 'rgba(13,13,18,0.97)', borderBottom: '1px solid rgba(200,255,77,0.07)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} className="text-[#F2F0EB]" />
        </button>

        {otherUser ? (
          <button
            onClick={() => navigate(`/profiles/${otherUser.id}`)}
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
          >
            <div className="relative shrink-0">
              <Avatar src={otherUser.profile_photo_url} name={otherUser.display_name} size="sm" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2" style={{ background: '#C8FF4D', borderColor: '#0D0D12', boxShadow: '0 0 6px #C8FF4D88' }} />
            </div>
            <div className="min-w-0">
              <h2 className="font-manrope font-bold text-[#F2F0EB] text-sm truncate">{otherUser.display_name}</h2>
              <p className="text-[11px]" style={{ color: otherTyping ? '#C8FF4D' : '#52525E' }}>
                {otherTyping ? '● typing…' : 'Online · tap to view profile'}
              </p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#2E2E3A] animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-28 rounded-full bg-[#2E2E3A] animate-pulse" />
              <div className="h-2.5 w-16 rounded-full bg-[#252530] animate-pulse" />
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setShowSearch(s => { if (s) setSearchQuery(''); return !s })
            setTimeout(() => searchInputRef.current?.focus(), 100)
          }}
          className={`w-9 h-9 flex items-center justify-center rounded-xl active:bg-white/10 transition-colors ${showSearch ? 'text-[#C8FF4D]' : 'text-[#8B8B9A]'}`}
        >
          <Search size={18} />
        </button>
        <button
          onClick={() => { setShowChatOptions(true); setConfirmClear(false) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-white/10 transition-colors"
        >
          <Info size={18} className="text-[#8B8B9A]" />
        </button>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden"
            style={{ background: '#141418', borderBottom: '1px solid #2E2E3A' }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#1C1C22' }}>
                <Search size={15} style={{ color: '#52525E', flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search messages…"
                  className="flex-1 bg-transparent text-sm text-[#F2F0EB] placeholder:text-[#52525E] outline-none"
                />
                {searchQuery && (
                  <span className="text-[11px] font-semibold shrink-0" style={{ color: '#C8FF4D' }}>
                    {searchResultCount} result{searchResultCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={() => { setSearchQuery(''); setShowSearch(false) }}
                className="text-xs font-semibold shrink-0"
                style={{ color: '#8B8B9A' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live booking banner — role-aware */}
      <AnimatePresence>
        {liveBooking && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="shrink-0 mx-3 mt-2"
          >
            {(() => {
              const st = liveBooking.status
              const isCompRole = userBookingRole === 'companion'
              const cfg = ({
                pending:   { bg: '#1C1A10', border: '#3D3010', accent: '#C8FF4D',
                             label: isCompRole ? 'New Booking Request!' : 'Awaiting Response', step: 1 },
                accepted:  { bg: '#0E1C14', border: '#1A3022', accent: '#C8FF4D',
                             label: 'Booking Confirmed ✓', step: 2 },
                declined:  { bg: '#1C0E10', border: '#3D1518', accent: '#FF5C7A',
                             label: 'Booking Declined', step: 2 },
                completed: { bg: '#141418', border: '#252530', accent: '#8B7CFF',
                             label: 'Experience Done!', step: 3 },
              } as Record<string, { bg: string; border: string; accent: string; label: string; step: number }>)[st]
                ?? { bg: '#141418', border: '#2E2E3A', accent: '#52525E', label: st, step: 0 }

              const steps = st === 'completed'
                ? ['Requested', 'Confirmed', 'Done ✓']
                : st === 'pending' && isCompRole
                ? ['Requested', 'Respond', 'Confirmed']
                : ['Requested', st === 'declined' ? 'Declined' : 'Confirmed', 'Done']

              return (
                <div className="rounded-2xl overflow-hidden border" style={{ background: cfg.bg, borderColor: cfg.border }}>

                  {/* Info section — tappable, navigates to bookings */}
                  <div className="cursor-pointer" onClick={() => navigate('/bookings')}>
                    {/* Top strip */}
                    <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
                      <span className="text-xl shrink-0">{SERVICE_ICONS[liveBooking.service?.slug ?? ''] ?? '✨'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.accent }}>{cfg.label}</p>
                        <p className="font-manrope font-semibold text-[#F2F0EB] text-sm truncate">{liveBooking.service?.name}</p>
                      </div>
                      {st === 'pending' && (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: cfg.accent }} />
                          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: cfg.accent }} />
                        </span>
                      )}
                    </div>

                    {/* Step tracker */}
                    <div className="flex items-center px-4 pb-2.5 gap-1.5">
                      {steps.map((s, i) => {
                        const done = i < cfg.step
                        const active = i === cfg.step - 1
                        return (
                          <div key={s} className="flex items-center gap-1.5 flex-1 min-w-0">
                            <div className="w-2 h-2 rounded-full shrink-0 transition-all"
                              style={{ background: done || active ? cfg.accent : '#2E2E3A', boxShadow: active ? `0 0 0 3px ${cfg.accent}30` : 'none' }}
                            />
                            <span className="text-[9px] font-semibold truncate" style={{ color: done || active ? cfg.accent : '#B8BDB9' }}>{s}</span>
                            {i < steps.length - 1 && (
                              <div className="flex-1 h-px mx-0.5" style={{ background: i < cfg.step - 1 ? cfg.accent : '#2E2E3A' }} />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3 text-xs text-[#8B8B9A]">
                      {liveBooking.proposed_date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} style={{ color: cfg.accent }} />
                          {new Date(liveBooking.proposed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {liveBooking.proposed_time && ` · ${liveBooking.proposed_time}`}
                        </span>
                      )}
                      {liveBooking.duration_hours && (
                        <span className="flex items-center gap-1"><Clock size={11} style={{ color: cfg.accent }} />{liveBooking.duration_hours}h</span>
                      )}
                      {liveBooking.agreed_rate != null && (
                        <span className="flex items-center gap-1"><IndianRupee size={11} style={{ color: cfg.accent }} />{Number(liveBooking.agreed_rate).toLocaleString('en-IN')}</span>
                      )}
                      <span className="ml-auto text-[10px] font-semibold" style={{ color: cfg.accent }}>View →</span>
                    </div>

                    {liveBooking.companion_response_note && (
                      <div className="mx-3 mb-3 px-3 py-2 rounded-xl text-xs text-[#8B8B9A] italic" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        "{liveBooking.companion_response_note}"
                      </div>
                    )}
                  </div>

                  {/* ACTION STRIP — stopPropagation so clicks don't navigate */}

                  {/* Companion: Accept / Decline when pending */}
                  {userBookingRole === 'companion' && st === 'pending' && (
                    <div className="flex gap-2 px-3 pb-3 pt-1 border-t" style={{ borderColor: cfg.border }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => bookingActionMutation.mutate('declined')}
                        disabled={bookingActionMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
                        style={{ color: '#FF5C7A', borderColor: 'rgba(255,92,122,0.3)', background: 'rgba(255,92,122,0.08)' }}
                      >
                        ✕ Decline
                      </button>
                      <button
                        onClick={() => bookingActionMutation.mutate('accepted')}
                        disabled={bookingActionMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
                        style={{ background: '#C8FF4D', color: '#0A1A00' }}
                      >
                        ✓ Accept
                      </button>
                    </div>
                  )}

                  {/* Both: Mark as Done when accepted and date has passed */}
                  {st === 'accepted' && isPastDate && (
                    <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: cfg.border }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => bookingActionMutation.mutate('completed')}
                        disabled={bookingActionMutation.isPending}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
                        style={{ background: '#C8FF4D', color: '#0A1A00' }}
                      >
                        {bookingActionMutation.isPending ? 'Updating…' : '✓ Mark as Done'}
                      </button>
                    </div>
                  )}

                  {/* Requester: Cancel when accepted and date hasn't passed */}
                  {userBookingRole === 'requester' && st === 'accepted' && !isPastDate && (
                    <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: cfg.border }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => bookingActionMutation.mutate('cancelled')}
                        disabled={bookingActionMutation.isPending}
                        className="w-full py-2.5 rounded-xl border-2 text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
                        style={{ color: '#FF5C7A', borderColor: 'rgba(255,92,122,0.3)', background: 'rgba(255,92,122,0.08)' }}
                      >
                        {bookingActionMutation.isPending ? 'Cancelling…' : 'Cancel Booking'}
                      </button>
                    </div>
                  )}

                  {/* Requester: Rate experience when completed and not yet rated */}
                  {userBookingRole === 'requester' && st === 'completed' && !liveBooking.rating && (
                    <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: cfg.border }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setShowRating(true)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all"
                        style={{ background: '#C8FF4D', color: '#0A1A00' }}
                      >
                        ⭐ Rate Your Experience
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4"
        style={{ scrollbarWidth: 'none', background: 'radial-gradient(ellipse 100% 60% at 50% 0%, #0F1118 0%, #0D0D12 65%)' }}
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
              <Avatar src={otherUser?.profile_photo_url} name={otherUser?.display_name ?? '?'} size="xl" className="shadow-lg ring-4 ring-[#2E2E3A]" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 text-sm" style={{ background: '#C8FF4D', borderColor: '#0D0D12' }}>👋</div>
            </div>
            <h3 className="font-manrope font-bold text-[#F2F0EB] mb-1 text-base">{otherUser?.display_name ?? 'Your connection'}</h3>
            <p className="text-sm text-[#8B8B9A] max-w-[200px] leading-relaxed">Say hello and start the conversation!</p>
            <div className="flex gap-2 mt-5 flex-wrap justify-center">
              {['👋 Say hi!', '😊 Hello!', '🎉 Hey there!', '☕ Coffee?'].map(q => (
                <button
                  key={q}
                  onClick={() => { setText(q); inputRef.current?.focus() }}
                  className="text-xs px-3.5 py-1.5 rounded-full text-[#8B8B9A] hover:text-[#C8FF4D] transition-colors"
                  style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
          {searchQuery && filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-sm font-semibold text-[#F2F0EB]">No results</p>
              <p className="text-xs text-[#52525E] mt-1">No messages match "{searchQuery}"</p>
            </div>
          )}
          <div className="space-y-3">
            {filteredGroups.map(group => (
              <div key={group.date}>
                {/* Date divider */}
                <div className="flex justify-center mb-2.5">
                  <span className="text-[11px] font-medium text-[#52525E] px-3.5 py-1 rounded-full" style={{ background: 'rgba(37,37,48,0.9)' }}>
                    {group.date}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {group.messages.map((msg, msgIdx) => {
                    const isMe = msg.sender.id === user?.id
                    const isOptimistic = msg.id.startsWith('opt-')
                    const prevMsg = group.messages[msgIdx - 1]
                    const nextMsg = group.messages[msgIdx + 1]
                    const isFirstInChain = !prevMsg || prevMsg.sender.id !== msg.sender.id
                    const isLastInChain = !nextMsg || nextMsg.sender.id !== msg.sender.id
                    const dx = swipeDx[msg.id] ?? 0
                    const msgRxnMap = allReactions[msg.id] ?? {}
                    const rxnEmojis = [...new Set(Object.values(msgRxnMap))]
                    const rxnCount = Object.values(msgRxnMap).length

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
                        {/* Reply arrow indicator (swipe) */}
                        {dx > 0 && (
                          <div
                            className="flex items-center justify-center shrink-0 self-center"
                            style={{ opacity: Math.min(dx / 55, 1) }}
                          >
                            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(200,255,77,0.15)' }}>
                              <CornerUpLeft size={14} style={{ color: '#C8FF4D' }} />
                            </div>
                          </div>
                        )}

                        <div
                          className={cn('flex flex-col max-w-[80%]', isMe ? 'items-end' : 'items-start')}
                          style={{ transform: `translateX(${isMe ? -dx : dx}px)`, transition: dx === 0 ? 'transform 0.25s ease' : 'none' }}
                        >
                          {/* Bubble with tail */}
                          <div className="relative">
                            {/* Speech-bubble tail on LAST message in chain (WhatsApp style) */}
                            {isLastInChain && (
                              <div style={isMe ? {
                                position: 'absolute', bottom: 0, right: -8, width: 0, height: 0,
                                borderLeft: `9px solid ${msg.deleted ? '#1C1C22' : '#C8FF4D'}`,
                                borderBottom: '9px solid transparent',
                              } : {
                                position: 'absolute', bottom: 0, left: -8, width: 0, height: 0,
                                borderRight: '9px solid #1C1C22',
                                borderBottom: '9px solid transparent',
                              }} />
                            )}
                            <div
                              className={cn(
                                'px-3 pt-1.5 text-sm leading-snug transition-opacity select-none',
                                isLastInChain ? 'pb-1' : 'pb-1.5',
                                isOptimistic ? 'opacity-70' : 'opacity-100',
                                isMe
                                  ? (isFirstInChain ? 'rounded-[10px] rounded-br-[3px]' : 'rounded-[10px] rounded-r-[3px]')
                                  : (isFirstInChain ? 'rounded-[10px] rounded-bl-[3px]' : 'rounded-[10px] rounded-l-[3px]'),
                                'min-w-[70px]'
                              )}
                              style={isMe ? {
                                background: msg.deleted ? '#1C1C22' : '#C8FF4D',
                                color: msg.deleted ? '#8B8B9A' : '#0A1A00',
                                boxShadow: '0 1px 6px rgba(200,255,77,0.15)',
                              } : {
                                background: '#1C1C22',
                                color: msg.deleted ? '#52525E' : '#F2F0EB',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              }}
                              onDoubleClick={() => !msg.deleted && setReplyTo(msg)}
                            >
                              {msg.type === 'audio' && msg.attachments?.[0] && !msg.deleted
                                ? <AudioMessage url={msg.attachments[0].url} isMe={isMe} />
                                : msg.body?.startsWith('__LOCATION__:') && !msg.deleted
                                ? <LocationMessage body={msg.body} isMe={isMe} />
                                : <span>{msg.deleted ? '🚫 This message was deleted' : highlightText(msg.body ?? '', searchQuery)}</span>
                              }
                              {/* Timestamp row — only on last in chain */}
                              {isLastInChain && (
                                <div className={cn(
                                  'flex items-center justify-end gap-1 mt-0.5',
                                  isMe ? 'text-[#0A1A00]/50' : 'text-[#52525E]'
                                )}>
                                  <span className="text-[10px] whitespace-nowrap leading-none">
                                    {isOptimistic ? 'Sending…' : formatTime(msg.created_at)}
                                  </span>
                                  {isMe && <ReadReceipt msg={msg} isOptimistic={isOptimistic} />}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Reactions */}
                          {rxnEmojis.length > 0 && (
                            <button
                              onClick={() => setContextMenu({ msg })}
                              className={cn(
                                'text-sm px-2 py-0.5 rounded-full border -mt-1 active:scale-90 transition-transform',
                                isMe ? 'mr-1' : 'ml-1'
                              )}
                              style={{ background: '#1C1C22', borderColor: '#2E2E3A' }}
                            >
                              {rxnEmojis.join('')}{rxnCount > 1 ? ` ${rxnCount}` : ''}
                            </button>
                          )}
                        </div>

                        {/* Desktop/tablet: quick action on hover */}
                        <div className={cn(
                          'hidden sm:flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity',
                          isMe ? 'order-first mr-1' : 'ml-1'
                        )}>
                          <button
                            onClick={() => setContextMenu({ msg })}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[#52525E] hover:text-[#C8FF4D] transition-colors text-xs"
                            style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}
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
                  className="flex items-end mt-1"
                >
                  <TypingDots />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Scroll to bottom / new message pill */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            key={newMsgSender ?? 'scroll'}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            onClick={scrollToBottom}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 shadow-lg flex items-center gap-1.5 z-20 active:scale-95 transition-transform"
            style={newMsgSender
              ? { background: '#C8FF4D', color: '#0A1A00', borderRadius: 999, padding: '7px 16px 7px 12px', boxShadow: '0 4px 20px rgba(200,255,77,0.3)' }
              : { background: '#1C1C22', border: '1px solid #2E2E3A', color: '#C8FF4D', borderRadius: 999, padding: '7px 12px' }
            }
          >
            <ChevronDown size={16} />
            {newMsgSender && (
              <span className="text-xs font-semibold truncate max-w-[140px]">
                New from {newMsgSender}
              </span>
            )}
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
              className="w-full rounded-t-3xl shadow-2xl pb-safe"
              style={{ background: '#141418', border: '1px solid #2E2E3A', borderBottom: 'none' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Quick reactions */}
              <div className="flex items-center justify-around px-6 py-4 border-b border-[#2E2E3A]">
                {QUICK_REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => addReaction(contextMenu.msg.id, emoji)}
                    className={cn(
                      'text-2xl w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90',
                      myId && allReactions[contextMenu.msg.id]?.[myId] === emoji
                        ? 'scale-110'
                        : 'hover:bg-[#252530]'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Quoted message preview */}
              <div className="px-4 py-3 border-b border-[#2E2E3A]">
                <p className="text-xs text-[#52525E] mb-1 truncate">{contextMenu.msg.sender.display_name}</p>
                <p className="text-sm text-[#F2F0EB] line-clamp-2">{contextMenu.msg.body}</p>
              </div>

              {/* Actions */}
              <div className="py-2">
                {!contextMenu.msg.deleted && (
                  <button
                    onClick={() => replyToMessage(contextMenu.msg)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#1C1C22] transition-colors"
                  >
                    <CornerUpLeft size={18} style={{ color: '#C8FF4D' }} />
                    <span className="text-sm font-medium text-[#F2F0EB]">Reply</span>
                  </button>
                )}
                {!contextMenu.msg.deleted && contextMenu.msg.body && (
                  <button
                    onClick={() => copyMessage(contextMenu.msg.body!)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#1C1C22] transition-colors"
                  >
                    <Copy size={18} style={{ color: '#C8FF4D' }} />
                    <span className="text-sm font-medium text-[#F2F0EB]">Copy text</span>
                  </button>
                )}
                {contextMenu.msg.sender.id === user?.id && !contextMenu.msg.deleted && !contextMenu.msg.id.startsWith('opt-') && (
                  <button
                    onClick={() => deleteMutation.mutate(contextMenu.msg.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FF5C7A]/10 transition-colors"
                  >
                    <Trash2 size={18} style={{ color: '#FF5C7A' }} />
                    <span className="text-sm font-medium" style={{ color: '#FF5C7A' }}>Delete message</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="shrink-0 pb-safe" style={{ background: '#141418', borderTop: '1px solid rgba(200,255,77,0.07)' }}>
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
              className="border-b border-[#2E2E3A] overflow-hidden"
            >
              <div className="px-3 py-3 grid gap-0.5 overflow-y-auto" style={{ gridTemplateColumns: 'repeat(10, 1fr)', maxHeight: 220 }}>
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    onMouseDown={e => { e.preventDefault(); insertEmoji(emoji) }}
                    className="text-xl h-9 flex items-center justify-center rounded-lg hover:bg-[#252530] active:scale-90 transition-all"
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
              className="border-b border-[#2E2E3A] overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-2.5">
                <div className="w-0.5 h-8 rounded-full shrink-0" style={{ background: '#C8FF4D' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#C8FF4D]">{replyTo.sender.display_name}</p>
                  <p className="text-xs text-[#8B8B9A] truncate">{replyTo.body}</p>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#252530] text-[#52525E] shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex items-end gap-2.5 px-3 py-3 relative">
          <AnimatePresence mode="wait">
            {isRecording ? (
              /* Recording UI */
              <motion.div
                key="recording"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex items-center gap-2.5 rounded-2xl px-4 py-3"
                style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}
              >
                <button onClick={() => stopRecording(false)} className="shrink-0 text-[#D76D6D] active:scale-90 transition-transform">
                  <X size={18} />
                </button>
                <div className="flex-1 flex items-end gap-[2px] overflow-hidden" style={{ height: 24 }}>
                  {Array.from({ length: 28 }, (_, i) => {
                    const heights = [5, 10, 18, 8, 14, 20, 6, 16, 10, 22, 8, 14, 18, 6, 12, 20, 8, 16, 5, 14, 20, 8, 12, 6, 18, 10, 14, 8]
                    return (
                      <motion.div
                        key={i}
                        className="rounded-full bg-red-400"
                        style={{ width: 2.5, height: heights[i], originY: 1 }}
                        animate={{ scaleY: [0.2, 1, 0.4, 0.8, 0.2] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }}
                      />
                    )
                  })}
                </div>
                <span className="text-xs font-semibold text-red-500 tabular-nums shrink-0 w-9 text-right">
                  {fmtRecTime(recordingTime)}
                </span>
              </motion.div>
            ) : (
              /* Normal input */
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="flex-1 flex items-end rounded-2xl px-3 py-2.5 gap-1"
                style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}
              >
                <button
                  onClick={() => setShowEmoji(s => !s)}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-xl transition-colors shrink-0',
                    showEmoji ? 'text-[#C8FF4D]' : 'text-[#52525E] hover:text-[#8B8B9A]'
                  )}
                >
                  <Smile size={20} />
                </button>
                <button
                  onClick={sendLocation}
                  disabled={locSending}
                  className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors shrink-0 text-[#52525E] hover:text-[#8B8B9A] disabled:opacity-50"
                >
                  {locSending
                    ? <span className="text-[9px] font-bold tracking-tight animate-pulse">GPS</span>
                    : <MapPin size={18} />
                  }
                </button>
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={e => { setText(e.target.value); autoResize(e.target); whisperTyping() }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowEmoji(false)}
                  placeholder="Type a message…"
                  rows={1}
                  className="chat-textarea flex-1 bg-transparent text-sm text-[#F2F0EB] placeholder:text-[#52525E] outline-none ring-0 resize-none leading-relaxed self-center"
                  style={{ minHeight: '36px', maxHeight: '120px', WebkitTapHighlightColor: 'transparent', paddingTop: '6px' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Send / Voice / Stop button */}
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.button
                key="stop"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                onClick={() => stopRecording(true)}
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md active:scale-90 transition-transform"
                style={{ background: '#FF5C7A', boxShadow: '0 4px 16px rgba(255,92,122,0.3)' }}
              >
                <Send size={16} />
              </motion.button>
            ) : text.trim() ? (
              <motion.button
                key="send"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                onClick={handleSend}
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md active:scale-90 transition-transform"
                style={{ background: '#C8FF4D', color: '#0A1A00', boxShadow: '0 4px 16px rgba(200,255,77,0.25)' }}
              >
                <Send size={17} />
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                onPointerDown={startRecording}
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                style={{ background: '#C8FF4D', color: '#0A1A00', boxShadow: '0 4px 16px rgba(200,255,77,0.25)' }}
              >
                <Mic size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat options sheet */}
      <BottomSheet
        open={showChatOptions}
        onClose={() => { setShowChatOptions(false); setConfirmClear(false) }}
        title="Chat Options"
      >
        <div className="pt-1 pb-2">
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="w-full flex items-center gap-3 px-2 py-4 rounded-2xl hover:bg-[#FF5C7A]/10 active:bg-[#FF5C7A]/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,92,122,0.15)' }}>
                <Trash2 size={18} style={{ color: '#FF5C7A' }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: '#FF5C7A' }}>Clear Chat</p>
                <p className="text-xs text-[#52525E] mt-0.5">Delete all messages for everyone</p>
              </div>
            </button>
          ) : (
            <div className="space-y-4 px-1">
              <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.2)' }}>
                <p className="text-sm font-semibold text-[#F2F0EB]">Clear all messages?</p>
                <p className="text-xs text-[#8B8B9A] mt-1">This permanently deletes every message in this chat for both people. This cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-3 rounded-2xl border-2 text-sm font-semibold text-[#8B8B9A] active:scale-95 transition-all"
                  style={{ borderColor: '#2E2E3A' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => clearMutation.mutate()}
                  disabled={clearMutation.isPending}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white active:scale-95 transition-all disabled:opacity-50"
                  style={{ background: '#FF5C7A' }}
                >
                  {clearMutation.isPending ? 'Clearing…' : 'Clear Chat'}
                </button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Rate experience bottom sheet */}
      <BottomSheet
        open={showRating}
        onClose={() => setShowRating(false)}
        title="Rate Your Experience"
      >
        <div className="pt-2 space-y-5">
          <p className="text-sm text-[#8B8B9A] text-center">
            How was your experience with <span className="font-semibold text-[#F2F0EB]">{otherUser?.display_name}</span>?
          </p>

          {/* Star picker */}
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRatingValue(star)}
                className="transition-transform active:scale-90"
              >
                <Star
                  size={40}
                  className={star <= ratingValue ? 'text-[#C8FF4D]' : 'text-[#2E2E3A]'}
                  fill={star <= ratingValue ? '#C8FF4D' : 'none'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>

          {ratingValue > 0 && (
            <p className="text-center text-xs font-semibold text-[#C8FF4D]">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][ratingValue]}
            </p>
          )}

          <textarea
            value={ratingText}
            onChange={e => setRatingText(e.target.value)}
            placeholder="Share your experience (optional)…"
            rows={3}
            className="w-full rounded-2xl px-4 py-3 text-sm text-[#F2F0EB] placeholder:text-[#52525E] focus:outline-none resize-none"
            style={{ background: '#1C1C22', border: '1.5px solid #2E2E3A' }}
          />

          <button
            onClick={() => rateMutation.mutate()}
            disabled={!ratingValue || rateMutation.isPending}
            className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-40 transition-all active:scale-95"
            style={{ background: '#C8FF4D', color: '#0A1A00' }}
          >
            {rateMutation.isPending ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
