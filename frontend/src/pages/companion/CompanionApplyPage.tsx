import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ShieldCheck, Upload, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { profileApi } from '../../api/profile'
import { discoverApi } from '../../api/discover'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import type { CompanionApplication, Service } from '../../types'

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Applied',
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  additional_info_required: 'More Info Needed',
  approved: 'Approved ✓',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

const STATUS_VARIANTS: Record<string, 'default' | 'verified' | 'warning' | 'error' | 'success' | 'muted'> = {
  approved: 'verified', submitted: 'warning', under_review: 'warning',
  rejected: 'error', suspended: 'error', draft: 'muted', not_started: 'muted',
}

export default function CompanionApplyPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState<'info' | 'form' | 'docs'>('info')
  const [form, setForm] = useState({ legal_name: '', bio: '', service_ids: [] as string[] })

  const { data: appData, refetch } = useQuery({
    queryKey: ['companion-app'],
    queryFn: () => profileApi.getCompanionApp(),
  })
  const { data: servicesData } = useQuery({ queryKey: ['services'], queryFn: () => discoverApi.getServices() })

  const application: CompanionApplication | null = appData?.data?.data ?? null
  const services: Service[] = servicesData?.data?.data ?? []

  const apply = useMutation({
    mutationFn: () => profileApi.startCompanionApp({ ...form, status: 'submitted' }),
    onSuccess: () => { toast('Application submitted!', 'success'); refetch(); setStep('docs') },
    onError: () => toast('Submission failed', 'error'),
  })

  const uploadDoc = async (file: File, type: string) => {
    try {
      await profileApi.uploadCompanionDoc(file, type)
      toast('Document uploaded!', 'success')
      refetch()
    } catch {
      toast('Upload failed', 'error')
    }
  }

  const ServiceIcons: Record<string, string> = {
    'movie-companion': '🎬', 'coffee-buddy': '☕', 'event-companion': '🎭',
    'travel-buddy': '✈️', 'shopping-companion': '🛍️', 'food-explorer': '🍜',
    'city-explorer': '🗺️', 'weekend-companion': '🌅', 'adventure-companion': '🏔️', 'gaming-buddy': '🎮',
  }

  if (application && application.status !== 'draft') {
    return (
      <div className="app-container min-h-dvh bg-[#FAF9F6]">
        <PageHeader title="Companion Status" back />
        <div className="px-4 pb-10 text-center">
          <div className="py-10">
            <div className="w-20 h-20 bg-[#E8F0EA] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={36} className="text-[#236B63]" />
            </div>
            <h2 className="font-manrope font-bold text-xl text-[#24332F] mb-2">Application Status</h2>
            <Badge variant={STATUS_VARIANTS[application.status] || 'muted'} className="text-sm px-4 py-1.5 mb-4">
              {STATUS_LABELS[application.status]}
            </Badge>
            {application.admin_notes && (
              <div className="bg-[#F4F1EA] rounded-2xl p-4 mt-4 text-left">
                <p className="text-xs text-[#A1AAA5] mb-1">Notes from reviewer:</p>
                <p className="text-sm text-[#24332F]">{application.admin_notes}</p>
              </div>
            )}
            {application.rejection_reason && (
              <div className="bg-red-50 rounded-2xl p-4 mt-3 text-left">
                <p className="text-xs text-[#D76D6D] mb-1">Reason for rejection:</p>
                <p className="text-sm text-[#24332F]">{application.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container min-h-dvh bg-[#FAF9F6]">
      <PageHeader title="Become a Companion" back />

      {step === 'info' && (
        <div className="px-4 pb-10">
          <div className="bg-gradient-to-br from-[#194E49] to-[#4D9274] rounded-3xl p-6 mb-6 text-white">
            <ShieldCheck size={32} className="mb-3" />
            <h2 className="font-manrope font-bold text-xl mb-2">Join as a Verified Companion</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Share your time and create meaningful experiences for others. All companions are verified for trust and safety.
            </p>
          </div>
          <div className="space-y-3 mb-8">
            {['Complete your profile', 'Submit identity verification', 'Await admin review (2-3 days)', 'Get your verified badge'].map((item, i) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#E8F0EA] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#236B63]">{i + 1}</span>
                </div>
                <span className="text-sm text-[#24332F]">{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#FFF5F5] border border-red-100 rounded-2xl p-4 mb-6">
            <p className="text-xs text-[#D76D6D] font-medium mb-1">Platform Policy</p>
            <p className="text-xs text-[#77817C]">Find Your Vibe is strictly a platonic companionship platform. Companions agree to maintain respectful, appropriate interactions at all times.</p>
          </div>
          <Button size="lg" onClick={() => setStep('form')}>
            <span className="flex items-center gap-2">Start Application <ChevronRight size={18} /></span>
          </Button>
        </div>
      )}

      {step === 'form' && (
        <div className="px-4 pb-10 space-y-5">
          <div>
            <h2 className="font-manrope font-bold text-xl text-[#24332F] mb-1">Application Details</h2>
            <p className="text-sm text-[#77817C]">This information will be reviewed by our team</p>
          </div>
          <Input label="Legal Name (as on ID)" placeholder="Your full legal name" value={form.legal_name} onChange={e => setForm(f => ({ ...f, legal_name: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-[#24332F] font-manrope">Companion Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Tell people why you'd be a great companion…"
              rows={4}
              className="mt-1.5 w-full border-[1.5px] border-[#E8EAE6] rounded-[12px] px-4 py-3 text-sm text-[#24332F] placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#24332F] font-manrope mb-2 block">Services You'll Offer</label>
            <div className="grid grid-cols-2 gap-2">
              {services.map(s => {
                const sel = form.service_ids.includes(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => setForm(f => ({ ...f, service_ids: sel ? f.service_ids.filter(x => x !== s.id) : [...f.service_ids, s.id] }))}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-medium transition-all ${sel ? 'border-[#236B63] bg-[#E8F0EA] text-[#236B63]' : 'border-[#E8EAE6] bg-white text-[#77817C]'}`}
                  >
                    <span className="text-lg">{ServiceIcons[s.slug] || '✨'}</span>
                    <span className="leading-tight">{s.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <Button size="lg" loading={apply.isPending} onClick={() => apply.mutate()}>Submit Application</Button>
        </div>
      )}

      {step === 'docs' && (
        <div className="px-4 pb-10 space-y-5">
          <div>
            <h2 className="font-manrope font-bold text-xl text-[#24332F] mb-1">Upload Documents</h2>
            <p className="text-sm text-[#77817C]">Required for verification. Documents are stored securely and never shown publicly.</p>
          </div>
          {[
            { type: 'identity', label: 'Government ID', desc: 'Passport, Aadhaar, Driving License, etc.' },
            { type: 'selfie', label: 'Selfie', desc: 'A clear photo of your face' },
          ].map(({ type, label, desc }) => (
            <label key={type} className="block cursor-pointer">
              <div className="border-2 border-dashed border-[#E8EAE6] rounded-2xl p-6 text-center hover:border-[#236B63] transition-colors">
                <Upload size={28} className="text-[#A1AAA5] mx-auto mb-2" />
                <p className="font-semibold text-[#24332F] text-sm">{label}</p>
                <p className="text-xs text-[#A1AAA5] mt-1">{desc}</p>
              </div>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, type) }} />
            </label>
          ))}
          <div className="bg-[#E8F0EA] rounded-2xl p-4">
            <p className="text-xs text-[#236B63] font-medium">Application Submitted ✓</p>
            <p className="text-xs text-[#77817C] mt-1">We'll review your application and contact you within 2-3 business days.</p>
          </div>
          <Button size="lg" variant="secondary" onClick={() => navigate('/profile')}>Done</Button>
        </div>
      )}
    </div>
  )
}
