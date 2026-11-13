import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { UserCheck, Clock, Check, X, MessageCircle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { connectionsApi } from '../../api/connections'
import { useToast } from '../../components/ui/Toast'
import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'
import Avatar from '../../components/ui/Avatar'
import { timeAgo } from '../../lib/utils'
import type { ConnectionRequest, Connection } from '../../types'

const tabs = ['Requests', 'Sent', 'Connected'] as const
type Tab = typeof tabs[number]

export default function ConnectionsPage() {
  const [tab, setTab] = useState<Tab>('Requests')
  const { toast } = useToast()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: receivedData } = useQuery({ queryKey: ['connections-received'], queryFn: () => connectionsApi.getReceived() })
  const { data: sentData } = useQuery({ queryKey: ['connections-sent'], queryFn: () => connectionsApi.getSent() })
  const { data: connectionsData } = useQuery({ queryKey: ['connections'], queryFn: () => connectionsApi.getConnections() })

  const [openingConv, setOpeningConv] = useState<string | null>(null)

  const openChat = async (conn: Connection) => {
    setOpeningConv(conn.id)
    try {
      if (conn.conversation_id) {
        navigate(`/messages/${conn.conversation_id}`)
      } else {
        const res = await connectionsApi.createConversation(conn.id)
        const convId = res.data.data.id
        navigate(`/messages/${convId}`)
      }
    } catch {
      toast('Could not open chat', 'error')
    } finally {
      setOpeningConv(null)
    }
  }

  const accept = useMutation({
    mutationFn: (id: string) => connectionsApi.accept(id),
    onSuccess: () => {
      toast('Connection accepted!', 'success')
      qc.invalidateQueries({ queryKey: ['connections-received'] })
      qc.invalidateQueries({ queryKey: ['connections'] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
  const decline = useMutation({
    mutationFn: (id: string) => connectionsApi.decline(id),
    onSuccess: () => { toast('Request declined', 'info'); qc.invalidateQueries({ queryKey: ['connections-received'] }) },
  })
  const withdraw = useMutation({
    mutationFn: (id: string) => connectionsApi.withdraw(id),
    onSuccess: () => { toast('Request withdrawn', 'info'); qc.invalidateQueries({ queryKey: ['connections-sent'] }) },
  })

  const received: ConnectionRequest[] = receivedData?.data?.data ?? []
  const sent: ConnectionRequest[] = sentData?.data?.data ?? []
  const connections: Connection[] = connectionsData?.data?.data ?? []

  const count = { Requests: received.length, Sent: sent.length, Connected: connections.length }

  return (
    <AppShell>
      <PageHeader title="Connections" />

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-[#2E2E3A]">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold font-manrope transition-all ${
              tab === t
                ? 'text-[#0A1A00]'
                : 'text-[#52525E]'
            }`}
            style={tab === t ? { background: '#C8FF4D' } : {}}
          >
            {t}
            {count[t] > 0 && (
              <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
                tab === t ? 'bg-[#0A1A00] text-[#C8FF4D]' : 'bg-[#252530] text-[#52525E]'
              }`}>
                {count[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="screen-scroll overflow-y-auto" style={{ height: 'calc(100dvh - 140px)' }}>
        {tab === 'Requests' && (
          <div className="p-4 space-y-3">
            {received.length === 0 ? (
              <EmptyState icon="💌" title="No pending requests" text="When someone wants to connect, they'll appear here." />
            ) : received.map((req, i) => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={req.sender.profile_photo_url} name={req.sender.display_name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-manrope font-semibold text-[#F2F0EB]">{req.sender.display_name}</h3>
                    <p className="text-xs text-[#52525E]">{req.sender.city?.name} · {timeAgo(req.created_at)}</p>
                    {req.message && <p className="text-sm text-[#8B8B9A] mt-1 line-clamp-2 italic">"{req.message}"</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decline.mutate(req.id)} className="flex-1 py-2.5 rounded-2xl border border-[#2E2E3A] text-sm text-[#8B8B9A] font-medium flex items-center justify-center gap-1.5">
                    <X size={15} /> Decline
                  </button>
                  <button onClick={() => accept.mutate(req.id)} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-1.5" style={{ background: '#C8FF4D', color: '#0A1A00' }}>
                    <Check size={15} /> Accept
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'Sent' && (
          <div className="p-4 space-y-3">
            {sent.length === 0 ? (
              <EmptyState icon="📤" title="No sent requests" text="Connect with companions you discover to get started." />
            ) : sent.map((req, i) => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl flex items-center gap-3" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
                <Avatar src={req.receiver.profile_photo_url} name={req.receiver.display_name} size="md" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-manrope font-semibold text-[#F2F0EB]">{req.receiver.display_name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-[#FF9F43]" />
                    <span className="text-xs text-[#52525E]">Pending · {timeAgo(req.created_at)}</span>
                  </div>
                </div>
                <button onClick={() => withdraw.mutate(req.id)} className="text-xs text-[#FF5C7A] font-medium px-3 py-1.5 rounded-xl border border-[#FF5C7A]/30">Withdraw</button>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'Connected' && (
          <div className="p-4 space-y-3">
            {connections.length === 0 ? (
              <EmptyState icon="🤝" title="No connections yet" text="Accept a request or send one to start connecting." />
            ) : connections.map((conn, i) => {
              const other = conn.other_user
              return (
                <motion.div key={conn.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-2xl flex items-center gap-3" style={{ background: '#141418', border: '1px solid #2E2E3A' }}
                >
                  <Avatar src={other?.profile_photo_url} name={other?.display_name ?? 'User'} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-manrope font-semibold text-[#F2F0EB]">{other?.display_name}</h3>
                    <p className="text-xs text-[#C8FF4D] flex items-center gap-1 mt-0.5"><UserCheck size={11} /> Connected</p>
                  </div>
                  <button
                    onClick={() => openChat(conn)}
                    disabled={openingConv === conn.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl disabled:opacity-60 transition-opacity"
                    style={{ background: '#C8FF4D', color: '#0A1A00' }}
                  >
                    {openingConv === conn.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <MessageCircle size={12} />
                    }
                    Message
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="font-manrope font-semibold text-[#F2F0EB] mb-1">{title}</h3>
      <p className="text-sm text-[#52525E]">{text}</p>
    </div>
  )
}
