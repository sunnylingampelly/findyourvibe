import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Star, Bookmark, Heart, Flag, MessageCircle, Languages, Clock } from 'lucide-react'
import { discoverApi } from '../../api/discover'
import { connectionsApi } from '../../api/connections'
import { profileApi } from '../../api/profile'
import { useToast } from '../../components/ui/Toast'
import { Skeleton } from '../../components/ui/Skeleton'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import BottomSheet from '../../components/ui/BottomSheet'
import { getInitials } from '../../lib/utils'
import type { PublicProfile } from '../../types'

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [showConnect, setShowConnect] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [connectMessage, setConnectMessage] = useState('')
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => discoverApi.getProfile(id!),
    enabled: !!id,
  })

  const profile: PublicProfile | undefined = data?.data?.data

  const connectMutation = useMutation({
    mutationFn: () => connectionsApi.sendRequest(id!, connectMessage),
    onSuccess: () => {
      toast('Connection request sent!', 'success')
      setShowConnect(false)
      qc.invalidateQueries({ queryKey: ['connections-sent'] })
    },
    onError: () => toast('Could not send request', 'error'),
  })

  const saveMutation = useMutation({
    mutationFn: async () => { if (!saved) await discoverApi.saveProfile(id!) },
    onSuccess: () => { setSaved(s => !s); toast(saved ? 'Removed from saved' : 'Profile saved!', 'success') },
  })

  if (isLoading || !profile) {
    return (
      <div className="app-container min-h-dvh bg-[#FAF9F6]">
        <div className="h-72 skeleton" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="app-container min-h-dvh bg-[#FAF9F6]">
      {/* Photo hero */}
      <div className="relative h-[65vw] max-h-80 bg-[#A8C5B5]">
        {profile.profile_photo_url ? (
          <img src={profile.profile_photo_url} alt={profile.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#A8C5B5] to-[#236B63] flex items-center justify-center">
            <span className="text-6xl font-manrope font-bold text-white">{getInitials(profile.display_name)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Nav */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 pt-safe">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button onClick={() => saveMutation.mutate()} className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${saved ? 'bg-[#236B63] text-white' : 'bg-black/30 text-white'}`}>
              <Bookmark size={18} fill={saved ? 'white' : 'none'} />
            </button>
            <button onClick={() => setShowReport(true)} className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
              <Flag size={18} />
            </button>
          </div>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-manrope font-extrabold text-2xl text-white">
                {profile.display_name}{profile.age ? `, ${profile.age}` : ''}
              </h1>
              {profile.city && (
                <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                  <MapPin size={13} />{profile.city.name}{profile.country ? `, ${profile.country.name}` : ''}
                </p>
              )}
            </div>
            {profile.companion_verification_status === 'approved' && (
              <Badge variant="verified">Verified</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-28">
        {/* Rating */}
        {profile.avg_rating && profile.avg_rating > 0 && (
          <div className="flex items-center gap-2 py-3 border-b border-[#E8EAE6]">
            <Star size={16} className="text-[#D9A45B] fill-[#D9A45B]" />
            <span className="font-semibold text-[#24332F]">{Number(profile.avg_rating).toFixed(1)}</span>
            <span className="text-[#A1AAA5] text-sm">({profile.rating_count} ratings)</span>
          </div>
        )}

        {/* Bio */}
        {profile.introduction && (
          <section className="py-4 border-b border-[#E8EAE6]">
            <h2 className="font-manrope font-semibold text-[#24332F] mb-2 text-sm uppercase tracking-wide text-[#A1AAA5]">Introduction</h2>
            <p className="text-[#24332F] leading-relaxed">{profile.introduction}</p>
          </section>
        )}

        {profile.bio && (
          <section className="py-4 border-b border-[#E8EAE6]">
            <h2 className="font-manrope font-semibold text-sm uppercase tracking-wide text-[#A1AAA5] mb-2">About</h2>
            <p className="text-[#24332F] leading-relaxed">{profile.bio}</p>
          </section>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <section className="py-4 border-b border-[#E8EAE6]">
            <h2 className="font-manrope font-semibold text-sm uppercase tracking-wide text-[#A1AAA5] mb-3">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(i => (
                <span key={i.id} className="px-3 py-1.5 bg-[#E8F0EA] text-[#236B63] rounded-full text-sm font-medium">{i.name}</span>
              ))}
            </div>
          </section>
        )}

        {/* Languages */}
        {profile.languages && profile.languages.length > 0 && (
          <section className="py-4 border-b border-[#E8EAE6]">
            <h2 className="flex items-center gap-2 font-manrope font-semibold text-sm uppercase tracking-wide text-[#A1AAA5] mb-3">
              <Languages size={14} /> Languages
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map(l => (
                <span key={l.id} className="px-3 py-1.5 bg-[#F4F1EA] text-[#77817C] rounded-full text-sm">{l.name}</span>
              ))}
            </div>
          </section>
        )}

        {/* Services */}
        {profile.services && profile.services.length > 0 && (
          <section className="py-4">
            <h2 className="flex items-center gap-2 font-manrope font-semibold text-sm uppercase tracking-wide text-[#A1AAA5] mb-3">
              <Clock size={14} /> Available For
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.services.map(s => (
                <span key={s.id} className="px-3 py-1.5 bg-white border border-[#E8EAE6] text-[#24332F] rounded-full text-sm font-medium">{s.name}</span>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky bottom actions */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-[#E8EAE6] p-4 pb-safe flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => {}}>
          <Heart size={18} /> Like
        </Button>
        <Button className="flex-1" onClick={() => setShowConnect(true)}>
          <MessageCircle size={18} /> Connect
        </Button>
      </div>

      {/* Connect sheet */}
      <BottomSheet open={showConnect} onClose={() => setShowConnect(false)} title="Send Connection Request">
        <div className="space-y-4">
          <p className="text-sm text-[#77817C]">Add a personal message to increase your chances of connecting with {profile.display_name}.</p>
          <textarea
            value={connectMessage}
            onChange={e => setConnectMessage(e.target.value)}
            placeholder="Introduce yourself briefly…"
            rows={4}
            className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none"
          />
          <Button size="lg" loading={connectMutation.isPending} onClick={() => connectMutation.mutate()}>Send Request</Button>
        </div>
      </BottomSheet>

      {/* Report sheet */}
      <BottomSheet open={showReport} onClose={() => setShowReport(false)} title="Report Profile">
        <div className="space-y-2">
          {['Inappropriate behaviour', 'Fake profile', 'Harassment', 'Suspicious activity', 'Misleading information', 'Other'].map(cat => (
            <button
              key={cat}
              className="w-full text-left px-4 py-3 rounded-2xl border border-[#E8EAE6] text-sm text-[#24332F] hover:bg-[#FFF0EE] hover:border-[#D76D6D] transition-colors"
              onClick={() => {
                profileApi.report(id!, cat.toLowerCase().replace(/ /g, '_'), cat)
                toast('Report submitted', 'success')
                setShowReport(false)
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
