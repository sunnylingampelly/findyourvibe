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
    onSuccess: () => { toast('Connection accepted!', 'success'); qc.invalidateQueries({ queryKey: ['connections-received'] }); qc.invalidateQueries({ queryKey: ['connections'] }) },
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
      <div className="flex gap-1 px-4 py-2 border-b border-[#E8EAE6]/60">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold font-manrope transition-all ${
              tab === t
                ? 'bg-[#E8F0EA] text-[#236B63]'
                : 'text-[#A1AAA5] hover:text-[#77817C]'
            }`}
          >
            {t}
            {count[t] > 0 && (
              <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none ${
                tab === t ? 'bg-[#236B63] text-white' : 'bg-[#E8EAE6] text-[#A1AAA5]'
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
              <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={req.sender.profile_photo_url} name={req.sender.display_name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-manrope font-semibold text-[#24332F]">{req.sender.display_name}</h3>
                    <p className="text-xs text-[#A1AAA5]">{req.sender.city?.name} · {timeAgo(req.created_at)}</p>
                    {req.message && <p className="text-sm text-[#77817C] mt-1 line-clamp-2 italic">"{req.message}"</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decline.mutate(req.id)} className="flex-1 py-2.5 rounded-2xl border border-[#E8EAE6] text-sm text-[#77817C] font-medium flex items-center justify-center gap-1.5">
                    <X size={15} /> Decline
                  </button>
                  <button onClick={() => accept.mutate(req.id)} className="flex-1 py-2.5 rounded-2xl bg-[#236B63] text-white text-sm font-semibold flex items-center justify-center gap-1.5">
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
              <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4 flex items-center gap-3">
                <Avatar src={req.receiver.profile_photo_url} name={req.receiver.display_name} size="md" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-manrope font-semibold text-[#24332F]">{req.receiver.display_name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-[#D9A45B]" />
                    <span className="text-xs text-[#A1AAA5]">Pending · {timeAgo(req.created_at)}</span>
                  </div>
                </div>
                <button onClick={() => withdraw.mutate(req.id)} className="text-xs text-[#D76D6D] font-medium px-3 py-1.5 rounded-xl border border-[#D76D6D]/30">Withdraw</button>
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
                  className="card p-4 flex items-center gap-3"
                >
                  <Avatar src={other?.profile_photo_url} name={other?.display_name ?? 'User'} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-manrope font-semibold text-[#24332F]">{other?.display_name}</h3>
                    <p className="text-xs text-[#4D9274] flex items-center gap-1 mt-0.5"><UserCheck size={11} /> Connected</p>
                  </div>
                  <button
                    onClick={() => openChat(conn)}
                    disabled={openingConv === conn.id}
                    className="flex items-center gap-1.5 text-xs bg-[#236B63] text-white font-semibold px-3 py-2 rounded-xl disabled:opacity-60 transition-opacity"
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
      <h3 className="font-manrope font-semibold text-[#24332F] mb-1">{title}</h3>
      <p className="text-sm text-[#A1AAA5]">{text}</p>
    </div>
  )
}
