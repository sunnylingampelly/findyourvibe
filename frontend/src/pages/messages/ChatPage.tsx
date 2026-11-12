import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Send, Smile, Info, CalendarDays,
  Clock, IndianRupee, Check, CheckCheck, CornerUpLeft, Copy, ChevronDown, X, Trash2, Star,
  Mic, Play, Pause, MapPin,
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
    <div className="flex items-center gap-1 px-4 py-3 bg-white rounded-[18px] rounded-bl-[5px] shadow-sm w-fit" style={{ boxShadow: '0 1px 1px rgba(0,0,0,0.08)' }}>
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
  if (isOptimistic) return <Check size={11} style={{ color: '#9BB5AE' }} />
  if (msg.read_at) return <CheckCheck size={11} style={{ color: '#53BDEB' }} />
  return <CheckCheck size={11} style={{ color: '#9BB5AE' }} />
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
        <MapPin size={13} style={{ color: isMe ? '#236B63' : '#236B63', flexShrink: 0 }} />
        <span className="text-xs font-semibold text-[#24332F] truncate">{address}</span>
      </div>
      <span style={{ color: '#236B63', fontSize: 10 }}>Tap to open in Maps ↗</span>
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
        style={{ background: isMe ? '#1A5750' : '#236B63' }}
      >
        {playing
          ? <Pause size={14} className="text-white" />
          : <Play size={14} className="text-white ml-0.5" />}
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
                  ? (isMe ? '#1A5750' : '#236B63')
                  : (isMe ? '#9BCFC8' : '#C0D4D1'),
              }}
            />
          ))}
        </div>
        <span className="text-[10px] leading-none" style={{ color: isMe ? '#6C8A85' : '#9BA8A3' }}>
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

  return (
    <div className="app-container flex flex-col h-dvh" style={{ background: '#ECE5DD' }}>

      {/* Header — dark teal, modern WhatsApp style */}
      <div className="flex items-center gap-3 px-3 py-2.5 pt-safe shrink-0" style={{ background: '#236B63' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        {otherUser ? (
          <button
            onClick={() => navigate(`/profiles/${otherUser.id}`)}
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
          >
            <div className="relative shrink-0">
              <Avatar src={otherUser.profile_photo_url} name={otherUser.display_name} size="sm" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#A8E6CF] rounded-full border-2 border-[#236B63]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-white text-sm truncate">{otherUser.display_name}</h2>
              <p className="text-[11px] text-white/60">
                {otherTyping ? 'typing…' : 'View profile →'}
              </p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-28 rounded-full bg-white/20 animate-pulse" />
              <div className="h-2.5 w-16 rounded-full bg-white/15 animate-pulse" />
            </div>
          </div>
        )}

        <button
          onClick={() => { setShowChatOptions(true); setConfirmClear(false) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-white/10 transition-colors"
        >
          <Info size={18} className="text-white/80" />
        </button>
      </div>

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
                pending:   { bg: '#FFF8EE', border: '#F5D99A', accent: '#D9A45B',
                             label: isCompRole ? 'New Booking Request!' : 'Awaiting Response', step: 1 },
                accepted:  { bg: '#E8F0EA', border: '#C8DDD2', accent: '#236B63',
                             label: 'Booking Confirmed ✓', step: 2 },
                declined:  { bg: '#FFF0EE', border: '#F5B8B8', accent: '#D76D6D',
                             label: 'Booking Declined', step: 2 },
                completed: { bg: '#F0F7F4', border: '#B8D8CE', accent: '#4D9274',
                             label: 'Experience Done!', step: 3 },
              } as Record<string, { bg: string; border: string; accent: string; label: string; step: number }>)[st]
                ?? { bg: '#F4F6F8', border: '#E8EAE6', accent: '#A1AAA5', label: st, step: 0 }

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
                        <p className="font-manrope font-semibold text-[#24332F] text-sm truncate">{liveBooking.service?.name}</p>
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
                              style={{ background: done || active ? cfg.accent : '#E8EAE6', boxShadow: active ? `0 0 0 3px ${cfg.accent}30` : 'none' }}
                            />
                            <span className="text-[9px] font-semibold truncate" style={{ color: done || active ? cfg.accent : '#B8BDB9' }}>{s}</span>
                            {i < steps.length - 1 && (
                              <div className="flex-1 h-px mx-0.5" style={{ background: i < cfg.step - 1 ? cfg.accent : '#E8EAE6' }} />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3 text-xs text-[#77817C]">
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
                      <div className="mx-3 mb-3 px-3 py-2 rounded-xl bg-white/60 text-xs text-[#77817C] italic">
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
                        className="flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold text-[#D76D6D] border-[#F5B8B8] bg-white active:scale-95 transition-all disabled:opacity-50"
                      >
                        ✕ Decline
                      </button>
                      <button
                        onClick={() => bookingActionMutation.mutate('accepted')}
                        disabled={bookingActionMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #236B63, #4D9274)' }}
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
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #236B63, #4D9274)' }}
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
                        className="w-full py-2.5 rounded-xl border-2 text-sm font-semibold text-[#D76D6D] border-[#F5B8B8] bg-white active:scale-95 transition-all disabled:opacity-50"
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
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-all"
                        style={{ background: 'linear-gradient(135deg, #D9A45B, #E8C47A)' }}
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
        className="flex-1 overflow-y-auto px-3 py-3"
        style={{
          scrollbarWidth: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='1.2' fill='%23B8B0A6' opacity='0.25'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
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
          <div className="space-y-3">
            {groups.map(group => (
              <div key={group.date}>
                {/* Date divider */}
                <div className="flex justify-center mb-2.5">
                  <span className="text-[11px] font-medium text-[#8A7A6A] px-3.5 py-1 bg-white/85 rounded-full shadow-sm">
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
                            <div className="w-7 h-7 rounded-full bg-[#E8F0EA] flex items-center justify-center">
                              <CornerUpLeft size={14} className="text-[#236B63]" />
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
                                borderLeft: `9px solid ${msg.deleted ? '#CDEEE2' : '#C9F9D3'}`,
                                borderBottom: '9px solid transparent',
                              } : {
                                position: 'absolute', bottom: 0, left: -8, width: 0, height: 0,
                                borderRight: '9px solid #FFFFFF',
                                borderBottom: '9px solid transparent',
                              }} />
                            )}
                            <div
                              className={cn(
                                'px-3 pt-1.5 text-sm leading-snug transition-opacity select-none',
                                isLastInChain ? 'pb-1' : 'pb-1.5',
                                isOptimistic ? 'opacity-70' : 'opacity-100',
                                msg.deleted
                                  ? (isMe ? 'text-[#5A8A7A] italic' : 'bg-white text-[#A1AAA5] italic')
                                  : isMe ? 'text-[#111B21]' : 'bg-white text-[#111B21]',
                                isMe
                                  ? (isFirstInChain ? 'rounded-[10px] rounded-br-[3px]' : 'rounded-[10px] rounded-r-[3px]')
                                  : (isFirstInChain ? 'rounded-[10px] rounded-bl-[3px]' : 'rounded-[10px] rounded-l-[3px]'),
                                'min-w-[70px]'
                              )}
                              style={isMe ? {
                                background: msg.deleted ? '#CDEEE2' : 'linear-gradient(160deg, #DCFDD3 0%, #C9F9D3 100%)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.13)',
                              } : {
                                boxShadow: '0 1px 3px rgba(0,0,0,0.11)',
                              }}
                              onDoubleClick={() => !msg.deleted && setReplyTo(msg)}
                            >
                              {msg.type === 'audio' && msg.attachments?.[0] && !msg.deleted
                                ? <AudioMessage url={msg.attachments[0].url} isMe={isMe} />
                                : msg.body?.startsWith('__LOCATION__:') && !msg.deleted
                                ? <LocationMessage body={msg.body} isMe={isMe} />
                                : <span>{msg.deleted ? '🚫 This message was deleted' : msg.body}</span>
                              }
                              {/* Timestamp row — only on last in chain */}
                              {isLastInChain && (
                                <div className={cn(
                                  'flex items-center justify-end gap-1 mt-0.5',
                                  isMe ? 'text-[#6C8A85]' : 'text-[#9BA8A3]'
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
                                'text-sm px-2 py-0.5 rounded-full border bg-white shadow-sm -mt-1 active:scale-90 transition-transform',
                                isMe ? 'mr-1' : 'ml-1',
                                'border-[#E8EAE6]'
                              )}
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
                  className="flex items-end mt-1"
                >
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
                      myId && allReactions[contextMenu.msg.id]?.[myId] === emoji
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
                {!contextMenu.msg.deleted && (
                  <button
                    onClick={() => replyToMessage(contextMenu.msg)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F9F7F3] transition-colors"
                  >
                    <CornerUpLeft size={18} className="text-[#236B63]" />
                    <span className="text-sm font-medium text-[#24332F]">Reply</span>
                  </button>
                )}
                {!contextMenu.msg.deleted && contextMenu.msg.body && (
                  <button
                    onClick={() => copyMessage(contextMenu.msg.body!)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#F9F7F3] transition-colors"
                  >
                    <Copy size={18} className="text-[#236B63]" />
                    <span className="text-sm font-medium text-[#24332F]">Copy text</span>
                  </button>
                )}
                {contextMenu.msg.sender.id === user?.id && !contextMenu.msg.deleted && !contextMenu.msg.id.startsWith('opt-') && (
                  <button
                    onClick={() => deleteMutation.mutate(contextMenu.msg.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={18} className="text-red-500" />
                    <span className="text-sm font-medium text-red-500">Delete message</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="shrink-0 bg-[#F0EBE3] border-t border-[#DDD5CC] pb-safe">
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
              <div className="px-3 py-3 grid gap-0.5 overflow-y-auto" style={{ gridTemplateColumns: 'repeat(10, 1fr)', maxHeight: 220 }}>
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
        <div className="flex items-end gap-2 px-2 py-2 relative">
          <AnimatePresence mode="wait">
            {isRecording ? (
              /* Recording UI */
              <motion.div
                key="recording"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex items-center gap-2.5 bg-white rounded-full px-3 py-2 shadow-sm"
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
                className="flex-1 flex items-end bg-white rounded-full shadow-sm px-3 py-2"
              >
                <button
                  onClick={() => setShowEmoji(s => !s)}
                  className={cn(
                    'w-8 h-7 flex items-center justify-center rounded-full transition-colors shrink-0 mr-0.5',
                    showEmoji ? 'text-[#236B63]' : 'text-[#A1AAA5]'
                  )}
                >
                  <Smile size={20} />
                </button>
                <button
                  onClick={sendLocation}
                  disabled={locSending}
                  className="w-8 h-7 flex items-center justify-center rounded-full transition-colors shrink-0 mr-1 text-[#A1AAA5] hover:text-[#236B63] disabled:opacity-50"
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
                  placeholder="Message…"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-[#24332F] placeholder:text-[#A1AAA5] outline-none ring-0 resize-none leading-relaxed self-center"
                  style={{ minHeight: '20px', maxHeight: '120px', WebkitTapHighlightColor: 'transparent' }}
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
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md active:scale-90 transition-transform"
                style={{ background: 'linear-gradient(135deg, #D76D6D, #C45555)' }}
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
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md active:scale-90 transition-transform"
                style={{ background: 'linear-gradient(135deg, #236B63 0%, #1D5A54 100%)' }}
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
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md active:scale-90 transition-transform"
                style={{ background: 'linear-gradient(135deg, #236B63 0%, #1D5A54 100%)' }}
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
              className="w-full flex items-center gap-3 px-2 py-4 rounded-2xl hover:bg-red-50 active:bg-red-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-red-500">Clear Chat</p>
                <p className="text-xs text-[#A1AAA5] mt-0.5">Delete all messages for everyone</p>
              </div>
            </button>
          ) : (
            <div className="space-y-4 px-1">
              <div className="bg-red-50 rounded-2xl p-4 text-center">
                <p className="text-sm font-semibold text-[#24332F]">Clear all messages?</p>
                <p className="text-xs text-[#77817C] mt-1">This permanently deletes every message in this chat for both people. This cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-3 rounded-2xl border-2 border-[#E8EAE6] text-sm font-semibold text-[#77817C] active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => clearMutation.mutate()}
                  disabled={clearMutation.isPending}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white active:scale-95 transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #D76D6D, #C45555)' }}
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
          <p className="text-sm text-[#77817C] text-center">
            How was your experience with <span className="font-semibold text-[#24332F]">{otherUser?.display_name}</span>?
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
                  className={star <= ratingValue ? 'text-[#D9A45B]' : 'text-[#E8EAE6]'}
                  fill={star <= ratingValue ? '#D9A45B' : 'none'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>

          {ratingValue > 0 && (
            <p className="text-center text-xs font-semibold text-[#D9A45B]">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][ratingValue]}
            </p>
          )}

          <textarea
            value={ratingText}
            onChange={e => setRatingText(e.target.value)}
            placeholder="Share your experience (optional)…"
            rows={3}
            className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none"
          />

          <button
            onClick={() => rateMutation.mutate()}
            disabled={!ratingValue || rateMutation.isPending}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #236B63, #4D9274)' }}
          >
            {rateMutation.isPending ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
