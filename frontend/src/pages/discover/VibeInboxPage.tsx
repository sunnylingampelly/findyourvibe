import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Heart, MapPin, ShieldCheck, Users, PlusCircle, CalendarDays, LogOut, Check, X, MessageCircle, UserCheck, Loader2, Pencil, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { vibesApi } from '../../api/vibes'
import { groupVibesApi } from '../../api/groupVibes'
import { connectionsApi } from '../../api/connections'
import { PlacesAutocomplete } from '../../components/ui/PlacesAutocomplete'
import { discoverApi } from '../../api/discover'
import { useToast } from '../../components/ui/Toast'
import AppShell from '../../components/layout/AppShell'
import Avatar from '../../components/ui/Avatar'
import BottomSheet from '../../components/ui/BottomSheet'
import Button from '../../components/ui/Button'
import { getInitials, timeAgo } from '../../lib/utils'
import type { GroupVibe, ConnectionRequest, Connection } from '../../types'

interface ViberProfile {
  swipe_id: string
  id: string
  display_name: string
  age?: number
  profile_photo_url?: string
  city?: { id: string; name: string }
  bio?: string
  identity_verified?: boolean
  vibed_at?: string
}

interface MatchData {
  displayName: string
  photoUrl: string | null
  conversationId: string
}

type Tab = 'vibed' | 'connect' | 'groups'

// ── Create Group Vibe Sheet ───────────────────────────────────────────────────
function CreateGroupSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [activity, setActivity] = useState('')
  const [location, setLocation] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [maxMembers, setMaxMembers] = useState('6')
  const [description, setDescription] = useState('')

  const create = useMutation({
    mutationFn: () => groupVibesApi.create({
      title,
      activity: activity || undefined,
      location: location || undefined,
      scheduled_at: scheduledAt || undefined,
      max_members: parseInt(maxMembers) || 6,
      description: description || undefined,
    }),
    onSuccess: () => {
      toast('Group Vibe created! 🎉', 'success')
      setTitle(''); setActivity(''); setLocation(''); setScheduledAt(''); setDescription('')
      onCreated()
      onClose()
    },
    onError: () => toast('Could not create group vibe', 'error'),
  })

  return (
    <BottomSheet open={open} onClose={onClose} title="New Group Vibe">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Coffee & Conversations"
            className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Activity</label>
            <input
              value={activity}
              onChange={e => setActivity(e.target.value)}
              placeholder="e.g. Hiking"
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Max members</label>
            <select
              value={maxMembers}
              onChange={e => setMaxMembers(e.target.value)}
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] focus:outline-none focus:border-[#236B63] bg-white"
            >
              {[2, 3, 4, 5, 6, 8, 10].map(n => (
                <option key={n} value={n}>{n} people</option>
              ))}
            </select>
          </div>
        </div>
        <PlacesAutocomplete
          label="Location"
          value={location}
          onChange={setLocation}
          placeholder="e.g. MG Road, Bangalore"
          showLocateButton={true}
        />
        <div>
          <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">When</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] focus:outline-none focus:border-[#236B63]"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="What's the vibe? Who should join?"
            className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-3 py-2.5 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none"
          />
        </div>
        <Button
          loading={create.isPending}
          disabled={!title.trim()}
          onClick={() => create.mutate()}
          className="w-full"
        >
          Create Group Vibe 🎉
        </Button>
      </div>
    </BottomSheet>
  )
}

// ── Edit Group Vibe Sheet ─────────────────────────────────────────────────────
function EditGroupSheet({ vibe, open, onClose, onUpdated }: { vibe: GroupVibe; open: boolean; onClose: () => void; onUpdated: () => void }) {
  const { toast } = useToast()
  const [title, setTitle] = useState(vibe.title)
  const [activity, setActivity] = useState(vibe.activity ?? '')
  const [location, setLocation] = useState(vibe.location ?? '')
  const [scheduledAt, setScheduledAt] = useState(vibe.scheduled_at ? new Date(vibe.scheduled_at).toISOString().slice(0, 16) : '')
  const [maxMembers, setMaxMembers] = useState(String(vibe.max_members))
  const [description, setDescription] = useState(vibe.description ?? '')

  const update = useMutation({
    mutationFn: () => groupVibesApi.update(vibe.id, {
      title, activity: activity || undefined, location: location || undefined,
      scheduled_at: scheduledAt || undefined, max_members: parseInt(maxMembers) || 6,
      description: description || undefined,
    }),
    onSuccess: () => { toast('Group updated! ✅', 'success'); onUpdated(); onClose() },
    onError: () => toast('Could not update group vibe', 'error'),
  })

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Group Vibe">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Coffee & Conversations"
            className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Activity</label>
            <input value={activity} onChange={e => setActivity(e.target.value)} placeholder="e.g. Hiking"
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Max members</label>
            <select value={maxMembers} onChange={e => setMaxMembers(e.target.value)}
              className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] focus:outline-none focus:border-[#236B63] bg-white">
              {[2, 3, 4, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n} people</option>)}
            </select>
          </div>
        </div>
        <PlacesAutocomplete label="Location" value={location} onChange={setLocation} placeholder="e.g. MG Road, Bangalore" showLocateButton={true} />
        <div>
          <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">When</label>
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
            className="w-full border-[1.5px] border-[#E8EAE6] rounded-xl px-3 py-2.5 text-sm text-[#24332F] focus:outline-none focus:border-[#236B63]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#A1AAA5] uppercase tracking-wide mb-1 block">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="What's the vibe? Who should join?"
            className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-3 py-2.5 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none" />
        </div>
        <Button loading={update.isPending} disabled={!title.trim()} onClick={() => update.mutate()} className="w-full">Save Changes</Button>
      </div>
    </BottomSheet>
  )
}

// ── Invite Sheet ──────────────────────────────────────────────────────────────
function InviteSheet({ vibe, open, onClose }: { vibe: GroupVibe; open: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const [sent, setSent] = useState<Set<string>>(new Set())

  const { data: connData } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsApi.getConnections(),
    enabled: open,
  })
  const connections: Connection[] = connData?.data?.data ?? []

  const inviteMutation = useMutation({
    mutationFn: (userId: string) => groupVibesApi.invite(vibe.id, userId),
    onSuccess: (_, userId) => {
      setSent(prev => new Set(prev).add(userId))
      toast('Invitation sent! 📨', 'success')
    },
    onError: () => toast('Could not send invitation', 'error'),
  })

  const alreadyInVibe = new Set(vibe.members.map(m => m.id))

  return (
    <BottomSheet open={open} onClose={onClose} title="Invite Connections">
      <div className="space-y-3">
        {connections.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🤝</div>
            <p className="text-sm text-[#A1AAA5]">No connections yet to invite.</p>
          </div>
        ) : connections.map(conn => {
          const other = conn.other_user
          const isIn = alreadyInVibe.has(other.id)
          const wasSent = sent.has(other.id)
          return (
            <div key={conn.id} className="flex items-center gap-3 py-2">
              <Avatar src={other.profile_photo_url} name={other.display_name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-manrope font-semibold text-[#24332F] text-sm">{other.display_name}</p>
                {other.city && <p className="text-xs text-[#A1AAA5]">{other.city.name}</p>}
              </div>
              {isIn ? (
                <span className="text-xs text-[#4D9274] font-semibold flex items-center gap-1"><UserCheck size={12} /> Joined</span>
              ) : wasSent ? (
                <span className="text-xs text-[#A1AAA5] font-semibold">Invited ✓</span>
              ) : (
                <button
                  onClick={() => inviteMutation.mutate(other.id)}
                  disabled={inviteMutation.isPending}
                  className="text-xs bg-[#236B63] text-white font-semibold px-3 py-1.5 rounded-xl disabled:opacity-60"
                >
                  Invite
                </button>
              )}
            </div>
          )
        })}
      </div>
    </BottomSheet>
  )
}

// ── Group Vibe Card ───────────────────────────────────────────────────────────
function GroupVibeCard({ vibe, onAction }: { vibe: GroupVibe; onAction: () => void }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const full = vibe.is_full && !vibe.is_member && !vibe.is_host
  const [showEdit, setShowEdit] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const joinMutation = useMutation({
    mutationFn: () => groupVibesApi.join(vibe.id),
    onSuccess: () => { toast('Joined! 🎉', 'success'); onAction() },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg ?? 'Could not join', 'error')
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => groupVibesApi.leave(vibe.id),
    onSuccess: () => { toast(vibe.is_host ? 'Group vibe cancelled' : 'You left', 'success'); onAction() },
    onError: () => toast('Could not leave', 'error'),
  })

  const spotsLeft = vibe.max_members - vibe.member_count

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E8EAE6] p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <p className="font-manrope font-bold text-[#24332F] text-sm">{vibe.title}</p>
              {vibe.is_host && <span className="text-[9px] font-bold bg-[#E8F0EA] text-[#236B63] px-1.5 py-0.5 rounded-full">HOST</span>}
            </div>
            {vibe.activity && <p className="text-xs text-[#A1AAA5]">📌 {vibe.activity}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Host actions */}
            {vibe.is_host && (
              <>
                <button onClick={() => setShowInvite(true)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F4F9F7] text-[#236B63]" title="Invite connections">
                  <UserPlus size={13} />
                </button>
                <button onClick={() => setShowEdit(true)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F4F9F7] text-[#236B63]" title="Edit group">
                  <Pencil size={13} />
                </button>
              </>
            )}
            {/* Member can also invite */}
            {vibe.is_member && !vibe.is_host && (
              <button onClick={() => setShowInvite(true)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F4F9F7] text-[#236B63]" title="Invite connections">
                <UserPlus size={13} />
              </button>
            )}
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl ${full ? 'bg-[#FFF0EE]' : 'bg-[#E8F0EA]'}`}>
              <Users size={12} className={full ? 'text-[#D76D6D]' : 'text-[#236B63]'} />
              <span className={`text-xs font-bold ${full ? 'text-[#D76D6D]' : 'text-[#236B63]'}`}>{vibe.member_count}/{vibe.max_members}</span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
          {vibe.location && <p className="text-xs text-[#77817C] flex items-center gap-1"><MapPin size={11} />{vibe.location}</p>}
          {vibe.scheduled_label && <p className="text-xs text-[#77817C] flex items-center gap-1"><CalendarDays size={11} />{vibe.scheduled_label}</p>}
        </div>

        {vibe.description && <p className="text-xs text-[#77817C] leading-relaxed mb-2 line-clamp-2">{vibe.description}</p>}

        {/* Host */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar src={vibe.host.profile_photo_url} name={vibe.host.display_name} size="xs" />
          <p className="text-xs text-[#A1AAA5]">by <span className="text-[#24332F] font-medium">{vibe.host.display_name}</span></p>
        </div>

        {/* Member avatars */}
        {vibe.members.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex -space-x-2">
              {vibe.members.slice(0, 5).map(m => (
                <button key={m.id} onClick={() => navigate(`/profiles/${m.id}`)} className="shrink-0">
                  <Avatar src={m.profile_photo_url} name={m.display_name} size="xs" className="border-2 border-white" />
                </button>
              ))}
            </div>
            {vibe.members.length > 5 && (
              <span className="text-[10px] text-[#A1AAA5] font-medium">+{vibe.members.length - 5} more</span>
            )}
            <span className="text-[10px] text-[#A1AAA5]">going</span>
          </div>
        )}

        {/* Action button */}
        {vibe.is_member || vibe.is_host ? (
          <button onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending}
            className="w-full py-2.5 border border-[#E8EAE6] rounded-xl text-xs font-semibold text-[#D76D6D] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-50">
            <LogOut size={13} />
            {vibe.is_host ? 'Cancel Vibe' : 'Leave Vibe'}
          </button>
        ) : full ? (
          <div className="w-full py-2.5 bg-[#F4F5F4] rounded-xl text-xs font-semibold text-[#A1AAA5] text-center">Group Full</div>
        ) : (
          <button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}
            className="w-full py-2.5 bg-gradient-to-br from-[#4D9274] to-[#236B63] rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-70 shadow-sm">
            <PlusCircle size={13} />
            Join · {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
          </button>
        )}
      </motion.div>

      {showEdit && <EditGroupSheet vibe={vibe} open={showEdit} onClose={() => setShowEdit(false)} onUpdated={onAction} />}
      {showInvite && <InviteSheet vibe={vibe} open={showInvite} onClose={() => setShowInvite(false)} />}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VibeInboxPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('vibed')
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [groupFilter, setGroupFilter] = useState<'all' | 'mine'>('all')

  // Vibed You
  const { data: vibedData, isLoading: vibedLoading } = useQuery({
    queryKey: ['vibes-received'],
    queryFn: () => vibesApi.received(),
    refetchInterval: 30000,
  })
  const vibers: ViberProfile[] = vibedData?.data?.data?.data ?? []

  // Connection requests & connections
  const { data: receivedData, refetch: refetchReceived } = useQuery({
    queryKey: ['connections-received'],
    queryFn: () => connectionsApi.getReceived(),
    enabled: tab === 'connect',
  })
  const { data: connectionsData, refetch: refetchConnections } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsApi.getConnections(),
    enabled: tab === 'connect',
  })

  const received: ConnectionRequest[] = receivedData?.data?.data ?? []
  const connections: Connection[] = connectionsData?.data?.data ?? []
  const [openingConv, setOpeningConv] = useState<string | null>(null)
  const [connectTab, setConnectTab] = useState<'requests' | 'connected'>('requests')

  const acceptMutation = useMutation({
    mutationFn: (id: string) => connectionsApi.accept(id),
    onSuccess: () => { toast('Connection accepted! 🤝', 'success'); refetchReceived(); refetchConnections() },
    onError: () => toast('Could not accept', 'error'),
  })
  const declineMutation = useMutation({
    mutationFn: (id: string) => connectionsApi.decline(id),
    onSuccess: () => { toast('Request declined', 'info'); refetchReceived() },
    onError: () => toast('Could not decline', 'error'),
  })

  const openChat = async (conn: Connection) => {
    setOpeningConv(conn.id)
    try {
      if (conn.conversation_id) {
        navigate(`/messages/${conn.conversation_id}`)
      } else {
        const res = await connectionsApi.createConversation(conn.id)
        navigate(`/messages/${res.data.data.id}`)
      }
    } catch { toast('Could not open chat', 'error') }
    finally { setOpeningConv(null) }
  }

  // Group Vibes — browse all
  const { data: allGroupsData, isLoading: allGroupsLoading, refetch: refetchAll } = useQuery({
    queryKey: ['group-vibes-all'],
    queryFn: () => groupVibesApi.browse(),
    enabled: tab === 'groups',
  })

  // Group Vibes — mine
  const { data: myGroupsData, isLoading: myGroupsLoading, refetch: refetchMine } = useQuery({
    queryKey: ['group-vibes-mine'],
    queryFn: () => groupVibesApi.mine(),
    enabled: tab === 'groups',
  })

  const allGroups: GroupVibe[] = allGroupsData?.data?.data ?? []
  const myGroups: GroupVibe[] = myGroupsData?.data?.data ?? []
  const displayGroups = groupFilter === 'mine' ? myGroups : allGroups
  const groupsLoading = groupFilter === 'mine' ? myGroupsLoading : allGroupsLoading
  const refetchGroups = () => { refetchAll(); refetchMine() }

  const handleVibeBack = async (vibe: ViberProfile) => {
    if (pendingIds.has(vibe.id)) return
    setPendingIds(prev => new Set(prev).add(vibe.id))

    try {
      const res = await discoverApi.swipe(vibe.id, 'right')
      const resData = res?.data?.data
      qc.invalidateQueries({ queryKey: ['vibes-received'] })

      if (resData?.matched && resData?.conversation_id) {
        setMatchData({
          displayName: resData.matched_profile?.display_name ?? vibe.display_name,
          photoUrl: resData.matched_profile?.profile_photo_url ?? vibe.profile_photo_url ?? null,
          conversationId: resData.conversation_id,
        })
      } else {
        toast(`You vibed ${vibe.display_name}! 💚`, 'success')
      }
    } catch {
      toast('Could not vibe back', 'error')
    } finally {
      setPendingIds(prev => { const s = new Set(prev); s.delete(vibe.id); return s })
    }
  }

  return (
    <AppShell>
      {/* Match overlay */}
      <AnimatePresence>
        {matchData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
            style={{ background: 'linear-gradient(160deg, #1A5750 0%, #236B63 60%, #15453F 100%)' }}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
              className="w-full max-w-xs text-center"
            >
              <div className="text-7xl mb-4">💚</div>
              <h2 className="font-manrope font-extrabold text-4xl text-white mb-2 leading-tight">It's a Match!</h2>
              <p className="text-white/70 text-sm mb-8">
                You and <span className="text-white font-semibold">{matchData.displayName}</span> both vibed!
              </p>
              {matchData.photoUrl ? (
                <img src={matchData.photoUrl} alt={matchData.displayName} className="w-28 h-28 rounded-full object-cover mx-auto mb-8 border-4 border-white/80 shadow-2xl" />
              ) : (
                <div className="w-28 h-28 rounded-full mx-auto mb-8 border-4 border-white/80 bg-white/20 flex items-center justify-center shadow-2xl">
                  <span className="text-3xl font-manrope font-bold text-white">{getInitials(matchData.displayName)}</span>
                </div>
              )}
              <div className="space-y-3 w-full">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setMatchData(null); navigate(`/messages/${matchData.conversationId}`) }}
                  className="w-full py-4 bg-white rounded-2xl font-manrope font-bold text-[#236B63] text-base flex items-center justify-center gap-2 shadow-lg"
                >
                  💬 Say Hello!
                </motion.button>
                <button onClick={() => setMatchData(null)} className="w-full py-3 text-white/60 text-sm font-medium">
                  Keep Browsing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-dvh pt-safe pb-[80px]">
        {/* Header */}
        <div className="shrink-0 bg-[#FAF9F6] border-b border-[#E8EAE6] px-4 pt-3 pb-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-manrope font-bold text-lg text-[#24332F]">Vibes</h1>
            {tab === 'groups' && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 bg-[#236B63] text-white text-xs font-bold px-3 py-1.5 rounded-full"
              >
                <PlusCircle size={13} /> New Group
              </button>
            )}
          </div>
          {/* Tabs */}
          <div className="flex">
            {([['vibed', 'Vibed You'], ['connect', 'Connections'], ['groups', 'Group Vibes']] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                  tab === key
                    ? 'text-[#236B63] border-[#236B63]'
                    : 'text-[#A1AAA5] border-transparent'
                }`}
              >
                {label}
                {key === 'connect' && received.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-[16px] bg-[#D76D6D] text-white text-[9px] font-bold rounded-full px-1">{received.length > 9 ? '9+' : received.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto screen-scroll">

          {/* ── VIBED YOU ── */}
          {tab === 'vibed' && (
            <>
              {vibedLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 skeleton rounded-2xl" />
                  ))}
                </div>
              ) : vibers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
                  <div className="text-6xl mb-4">💚</div>
                  <h3 className="font-manrope font-semibold text-[#24332F] mb-2">No vibes yet</h3>
                  <p className="text-[#77817C] text-sm leading-relaxed">When someone vibes with your profile, they'll appear here.</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {vibers.map(vibe => (
                    <motion.div
                      key={vibe.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-[#E8EAE6] p-4 flex items-center gap-3 shadow-sm"
                    >
                      <button onClick={() => navigate(`/profiles/${vibe.id}`)} className="shrink-0">
                        <Avatar src={vibe.profile_photo_url} name={vibe.display_name} size="lg" className="border-2 border-white shadow" />
                      </button>

                      <button onClick={() => navigate(`/profiles/${vibe.id}`)} className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-manrope font-semibold text-[#24332F] text-sm truncate">
                            {vibe.display_name}{vibe.age ? `, ${vibe.age}` : ''}
                          </span>
                          {vibe.identity_verified && <ShieldCheck size={13} className="text-[#236B63] shrink-0" />}
                        </div>
                        {vibe.city && (
                          <p className="text-xs text-[#A1AAA5] flex items-center gap-1 mb-0.5">
                            <MapPin size={10} />{vibe.city.name}
                          </p>
                        )}
                        {vibe.bio && <p className="text-xs text-[#77817C] line-clamp-1">{vibe.bio}</p>}
                        {vibe.vibed_at && <p className="text-[10px] text-[#A1AAA5] mt-0.5">{vibe.vibed_at}</p>}
                      </button>

                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleVibeBack(vibe)}
                        disabled={pendingIds.has(vibe.id)}
                        className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#4D9274] to-[#236B63] flex items-center justify-center shadow disabled:opacity-50"
                      >
                        <Heart size={18} className="text-white fill-white" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── CONNECTIONS ── */}
          {tab === 'connect' && (
            <div className="p-4 space-y-4">
              {/* Sub-tabs */}
              <div className="flex gap-2">
                {(['requests', 'connected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setConnectTab(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      connectTab === f
                        ? 'bg-[#236B63] text-white border-[#236B63]'
                        : 'bg-white text-[#77817C] border-[#E8EAE6]'
                    }`}
                  >
                    {f === 'requests' ? `Requests${received.length > 0 ? ` (${received.length})` : ''}` : `Connected${connections.length > 0 ? ` (${connections.length})` : ''}`}
                  </button>
                ))}
              </div>

              {/* Requests sub-tab */}
              {connectTab === 'requests' && (
                received.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-16">
                    <div className="text-5xl mb-3">💌</div>
                    <h3 className="font-manrope font-semibold text-[#24332F] mb-1">No pending requests</h3>
                    <p className="text-sm text-[#A1AAA5]">When someone wants to connect, they'll appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {received.map((req, i) => (
                      <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-[#E8EAE6] p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <button onClick={() => navigate(`/profiles/${req.sender.id}`)} className="shrink-0">
                            <Avatar src={req.sender.profile_photo_url} name={req.sender.display_name} size="lg" />
                          </button>
                          <button onClick={() => navigate(`/profiles/${req.sender.id}`)} className="flex-1 min-w-0 text-left">
                            <p className="font-manrope font-semibold text-[#24332F] text-sm">{req.sender.display_name}</p>
                            <p className="text-xs text-[#A1AAA5]">{req.sender.city?.name ? `${req.sender.city.name} · ` : ''}{timeAgo(req.created_at)}</p>
                            {req.message && <p className="text-xs text-[#77817C] mt-1 line-clamp-2 italic">"{req.message}"</p>}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => declineMutation.mutate(req.id)} disabled={declineMutation.isPending}
                            className="flex-1 py-2.5 rounded-2xl border border-[#E8EAE6] text-sm text-[#77817C] font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
                            <X size={14} /> Decline
                          </button>
                          <button onClick={() => acceptMutation.mutate(req.id)} disabled={acceptMutation.isPending}
                            className="flex-1 py-2.5 rounded-2xl bg-[#236B63] text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-70">
                            <Check size={14} /> Accept
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )
              )}

              {/* Connected sub-tab */}
              {connectTab === 'connected' && (
                connections.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-16">
                    <div className="text-5xl mb-3">🤝</div>
                    <h3 className="font-manrope font-semibold text-[#24332F] mb-1">No connections yet</h3>
                    <p className="text-sm text-[#A1AAA5]">Accept a request or send one to start connecting.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connections.map((conn, i) => {
                      const other = conn.other_user
                      return (
                        <motion.div key={conn.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="bg-white rounded-2xl border border-[#E8EAE6] p-4 flex items-center gap-3 shadow-sm"
                        >
                          <button onClick={() => navigate(`/profiles/${other.id}`)} className="shrink-0">
                            <Avatar src={other?.profile_photo_url} name={other?.display_name ?? 'User'} size="md" />
                          </button>
                          <button onClick={() => navigate(`/profiles/${other.id}`)} className="flex-1 min-w-0 text-left">
                            <p className="font-manrope font-semibold text-[#24332F] text-sm">{other?.display_name}</p>
                            <p className="text-xs text-[#4D9274] flex items-center gap-1 mt-0.5"><UserCheck size={11} /> Connected</p>
                          </button>
                          <button
                            onClick={() => openChat(conn)}
                            disabled={openingConv === conn.id}
                            className="flex items-center gap-1.5 text-xs bg-[#236B63] text-white font-semibold px-3 py-2 rounded-xl disabled:opacity-60 shrink-0"
                          >
                            {openingConv === conn.id ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                            Message
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                )
              )}
            </div>
          )}

          {/* ── GROUP VIBES ── */}
          {tab === 'groups' && (
            <div className="p-4 space-y-4">
              {/* Filter pills */}
              <div className="flex gap-2">
                {(['all', 'mine'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setGroupFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      groupFilter === f
                        ? 'bg-[#236B63] text-white border-[#236B63]'
                        : 'bg-white text-[#77817C] border-[#E8EAE6]'
                    }`}
                  >
                    {f === 'all' ? 'Browse All' : 'My Vibes'}
                  </button>
                ))}
              </div>

              {groupsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-44 skeleton rounded-2xl" />
                  ))}
                </div>
              ) : displayGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="text-5xl mb-4">🤝</div>
                  <h3 className="font-manrope font-semibold text-[#24332F] mb-2">
                    {groupFilter === 'mine' ? 'No group vibes yet' : 'No upcoming group vibes'}
                  </h3>
                  <p className="text-[#77817C] text-sm leading-relaxed mb-5 max-w-[240px]">
                    {groupFilter === 'mine'
                      ? 'Create a group vibe and invite people to join!'
                      : 'Be the first to create a group hangout!'}
                  </p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 bg-[#236B63] text-white text-sm font-semibold px-5 py-2.5 rounded-2xl active:scale-95 transition-transform"
                  >
                    <PlusCircle size={15} /> Create Group Vibe
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayGroups.map(vibe => (
                    <GroupVibeCard key={vibe.id} vibe={vibe} onAction={refetchGroups} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateGroupSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refetchGroups}
      />
    </AppShell>
  )
}
