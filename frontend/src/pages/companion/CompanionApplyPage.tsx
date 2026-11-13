import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ShieldCheck, Upload, ChevronRight, CheckCircle2, Clock, Loader2 } from 'lucide-react'
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
  submitted: 'Submitted — Under Review',
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

const ServiceIcons: Record<string, string> = {
  'movie-companion': '🎬', 'coffee-buddy': '☕', 'event-companion': '🎭',
  'travel-buddy': '✈️', 'shopping-companion': '🛍️', 'food-explorer': '🍜',
  'city-explorer': '🗺️', 'weekend-companion': '🌅', 'adventure-companion': '🏔️', 'gaming-buddy': '🎮',
}

export default function CompanionApplyPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState<'info' | 'form' | 'docs' | 'pending'>('info')
  const [form, setForm] = useState({ legal_name: '', bio: '', service_ids: [] as string[] })
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [uploadedTypes, setUploadedTypes] = useState<Set<string>>(new Set())

  const { data: appData, refetch } = useQuery({
    queryKey: ['companion-app'],
    queryFn: () => profileApi.getCompanionApp(),
  })
  const { data: servicesData } = useQuery({ queryKey: ['services'], queryFn: () => discoverApi.getServices() })

  const application: CompanionApplication | null = appData?.data?.data ?? null
  const services: Service[] = servicesData?.data?.data ?? []

  useEffect(() => {
    if (application?.status === 'draft' && (step === 'info' || step === 'form')) {
      setStep('docs')
    }
  }, [application, step])

  const apply = useMutation({
    mutationFn: () => profileApi.startCompanionApp({ legal_name: form.legal_name, submission_notes: form.bio }),
    onSuccess: () => { refetch(); setStep('docs') },
    onError: () => toast('Could not save application', 'error'),
  })

  const submitApp = useMutation({
    mutationFn: () => profileApi.updateCompanionApp({ submit: true }),
    onSuccess: () => { refetch(); setStep('pending') },
    onError: () => toast('Submission failed', 'error'),
  })

  const uploadDoc = async (file: File, type: string) => {
    setUploadingType(type)
    try {
      await profileApi.uploadCompanionDoc(file, type)
      setUploadedTypes(prev => new Set([...prev, type]))
      toast('Document uploaded!', 'success')
      refetch()
    } catch {
      toast('Upload failed', 'error')
    } finally {
      setUploadingType(null)
    }
  }

  if (application && application.status !== 'draft' && step !== 'pending') {
    const isApproved = application.status === 'approved'
    const isPending = application.status === 'submitted' || application.status === 'under_review' || application.status === 'additional_info_required'

    return (
      <div className="app-container min-h-dvh bg-[#0D0D12]">
        <PageHeader title="Companion Status" back />
        <div className="px-4 pb-10">
          <div className="py-10 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: isApproved ? 'rgba(200,255,77,0.12)' : isPending ? 'rgba(255,159,67,0.12)' : 'rgba(255,92,122,0.12)' }}
            >
              {isApproved
                ? <CheckCircle2 size={36} style={{ color: '#C8FF4D' }} />
                : isPending
                  ? <Clock size={36} style={{ color: '#FF9F43' }} />
                  : <ShieldCheck size={36} style={{ color: '#FF5C7A' }} />
              }
            </div>
            <h2 className="font-manrope font-bold text-xl text-[#F2F0EB] mb-2">Application Status</h2>
            <Badge variant={STATUS_VARIANTS[application.status] || 'muted'} className="text-sm px-4 py-1.5 mb-4">
              {STATUS_LABELS[application.status]}
            </Badge>

            {isPending && (
              <div className="rounded-2xl p-4 mt-4 text-left" style={{ background: 'rgba(255,159,67,0.08)', border: '1px solid rgba(255,159,67,0.2)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#FF9F43' }}>Application Under Review</p>
                <p className="text-xs text-[#8B8B9A]">We're reviewing your submission. This typically takes 2-3 business days. We'll notify you once a decision is made.</p>
              </div>
            )}
            {application.admin_notes && (
              <div className="rounded-2xl p-4 mt-4 text-left" style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}>
                <p className="text-xs text-[#52525E] mb-1">Notes from reviewer:</p>
                <p className="text-sm text-[#F2F0EB]">{application.admin_notes}</p>
              </div>
            )}
            {application.rejection_reason && (
              <div className="rounded-2xl p-4 mt-3 text-left" style={{ background: 'rgba(255,92,122,0.08)', border: '1px solid rgba(255,92,122,0.2)' }}>
                <p className="text-xs text-[#FF5C7A] mb-1">Reason for rejection:</p>
                <p className="text-sm text-[#F2F0EB]">{application.rejection_reason}</p>
              </div>
            )}
            <button
              onClick={() => navigate('/profile')}
              className="mt-6 w-full py-3 rounded-2xl text-sm text-[#8B8B9A]"
              style={{ border: '1px solid #2E2E3A' }}
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container min-h-dvh bg-[#0D0D12]">
      <PageHeader title="Become a Companion" back />

      {step !== 'info' && step !== 'pending' && (
        <div className="flex gap-1.5 px-4 pb-4">
          {(['form', 'docs'] as const).map(s => (
            <div key={s} className="h-1 flex-1 rounded-full transition-colors" style={{ background: (step === s || (s === 'form' && step === 'docs')) ? '#C8FF4D' : '#2E2E3A' }} />
          ))}
        </div>
      )}

      {step === 'info' && (
        <div className="px-4 pb-10">
          <div className="rounded-3xl p-6 mb-6" style={{ background: 'linear-gradient(135deg, #141418 0%, #1C1C22 100%)', border: '1px solid rgba(200,255,77,0.15)', boxShadow: '0 0 40px rgba(200,255,77,0.06)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(200,255,77,0.12)' }}>
              <ShieldCheck size={24} style={{ color: '#C8FF4D' }} />
            </div>
            <h2 className="font-manrope font-bold text-xl text-[#F2F0EB] mb-2">Join as a Verified Companion</h2>
            <p className="text-[#8B8B9A] text-sm leading-relaxed">
              Share your time and create meaningful experiences for others. All companions are verified for trust and safety.
            </p>
          </div>
          <div className="space-y-3 mb-8">
            {['Fill in your application details', 'Upload identity documents', 'Submit for admin review (2-3 days)', 'Get your verified badge'].map((item, i) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(200,255,77,0.12)' }}>
                  <span className="text-xs font-bold" style={{ color: '#C8FF4D' }}>{i + 1}</span>
                </div>
                <span className="text-sm text-[#F2F0EB]">{item}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(255,92,122,0.08)', border: '1px solid rgba(255,92,122,0.15)' }}>
            <p className="text-xs text-[#FF5C7A] font-medium mb-1">Platform Policy</p>
            <p className="text-xs text-[#8B8B9A]">Find Your Vibe is strictly a platonic companionship platform. Companions agree to maintain respectful, appropriate interactions at all times.</p>
          </div>
          <Button size="lg" onClick={() => setStep('form')}>
            <span className="flex items-center gap-2">Start Application <ChevronRight size={18} /></span>
          </Button>
        </div>
      )}

      {step === 'form' && (
        <div className="px-4 pb-10 space-y-5">
          <div>
            <h2 className="font-manrope font-bold text-xl text-[#F2F0EB] mb-1">Application Details</h2>
            <p className="text-sm text-[#8B8B9A]">This information will be reviewed by our team</p>
          </div>
          <Input
            label="Legal Name (as on ID)"
            placeholder="Your full legal name"
            value={form.legal_name}
            onChange={e => setForm(f => ({ ...f, legal_name: e.target.value }))}
          />
          <div>
            <label className="text-sm font-medium text-[#8B8B9A] font-manrope">About Yourself</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Tell people why you'd be a great companion…"
              rows={4}
              className="mt-1.5 w-full rounded-[12px] px-4 py-3 text-sm text-[#F2F0EB] placeholder:text-[#52525E] focus:outline-none resize-none transition-colors"
              style={{ background: '#1C1C22', border: '1.5px solid #2E2E3A' }}
              onFocus={e => e.target.style.borderColor = '#C8FF4D'}
              onBlur={e => e.target.style.borderColor = '#2E2E3A'}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#8B8B9A] font-manrope mb-2 block">Services You'll Offer</label>
            <div className="grid grid-cols-2 gap-2">
              {services.map(s => {
                const sel = form.service_ids.includes(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => setForm(f => ({ ...f, service_ids: sel ? f.service_ids.filter(x => x !== s.id) : [...f.service_ids, s.id] }))}
                    className="flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-medium transition-all"
                    style={sel
                      ? { borderColor: '#C8FF4D', background: 'rgba(200,255,77,0.08)', color: '#C8FF4D' }
                      : { borderColor: '#2E2E3A', background: '#1C1C22', color: '#8B8B9A' }
                    }
                  >
                    <span className="text-lg">{ServiceIcons[s.slug] || '✨'}</span>
                    <span className="leading-tight">{s.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <Button
            size="lg"
            loading={apply.isPending}
            disabled={!form.legal_name.trim()}
            onClick={() => apply.mutate()}
          >
            <span className="flex items-center gap-2">Save & Continue <ChevronRight size={18} /></span>
          </Button>
        </div>
      )}

      {step === 'docs' && (
        <div className="px-4 pb-10 space-y-5">
          <div>
            <h2 className="font-manrope font-bold text-xl text-[#F2F0EB] mb-1">Upload Documents</h2>
            <p className="text-sm text-[#8B8B9A]">Required for verification. Documents are stored securely and never shown publicly.</p>
          </div>

          {[
            { type: 'identity', label: 'Government ID', desc: 'Passport, Aadhaar, Driving License, or any official ID' },
            { type: 'selfie', label: 'Selfie with ID', desc: 'A clear photo of your face holding your ID' },
            { type: 'other', label: 'Additional Document (optional)', desc: 'Any supporting document' },
          ].map(({ type, label, desc }) => {
            const uploaded = uploadedTypes.has(type) || (application?.documents ?? []).some((d: { document_type: string }) => d.document_type === type)
            const isUploading = uploadingType === type

            return (
              <label key={type} className="block cursor-pointer">
                <div
                  className="border-2 rounded-2xl p-5 text-center transition-colors"
                  style={uploaded
                    ? { borderColor: '#C8FF4D', background: 'rgba(200,255,77,0.06)' }
                    : { borderColor: '#2E2E3A', borderStyle: 'dashed', background: '#1C1C22' }
                  }
                >
                  {isUploading ? (
                    <Loader2 size={28} className="mx-auto mb-2 animate-spin" style={{ color: '#C8FF4D' }} />
                  ) : uploaded ? (
                    <CheckCircle2 size={28} className="mx-auto mb-2" style={{ color: '#C8FF4D' }} />
                  ) : (
                    <Upload size={28} className="mx-auto mb-2 text-[#52525E]" />
                  )}
                  <p className="font-semibold text-sm" style={{ color: uploaded ? '#C8FF4D' : '#F2F0EB' }}>
                    {uploaded ? `${label} — Uploaded ✓` : label}
                  </p>
                  <p className="text-xs text-[#52525E] mt-1">{uploaded ? 'Tap to replace' : desc}</p>
                  <p className="text-[10px] text-[#52525E] mt-1">Any file type accepted (max 20 MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  disabled={isUploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, type) }}
                />
              </label>
            )
          })}

          <div className="rounded-2xl p-4" style={{ background: '#141418', border: '1px solid #2E2E3A' }}>
            <p className="text-xs text-[#8B8B9A]">Upload at least your Government ID before submitting. Your application will be reviewed by our team within 2-3 business days.</p>
          </div>

          {(() => {
            const hasIdentity = uploadedTypes.has('identity') ||
              (application?.documents ?? []).some((d: { document_type: string }) => d.document_type === 'identity')
            return (
              <>
                {!hasIdentity && (
                  <p className="text-xs text-center flex items-center justify-center gap-1.5" style={{ color: '#FF9F43' }}>
                    ⚠️ Upload your Government ID to enable submission
                  </p>
                )}
                <Button
                  size="lg"
                  loading={submitApp.isPending}
                  disabled={!hasIdentity}
                  onClick={() => submitApp.mutate()}
                >
                  Submit Application
                </Button>
              </>
            )
          })()}
          <button onClick={() => navigate('/profile')} className="w-full py-2.5 text-sm text-[#52525E]">
            Save & finish later
          </button>
        </div>
      )}

      {step === 'pending' && (
        <div className="px-4 pb-10 text-center">
          <div className="py-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,159,67,0.12)' }}>
              <Clock size={36} style={{ color: '#FF9F43' }} />
            </div>
            <h2 className="font-manrope font-bold text-xl text-[#F2F0EB] mb-2">Application Submitted!</h2>
            <p className="text-sm text-[#8B8B9A] mb-6 leading-relaxed max-w-[280px] mx-auto">
              Your application is now under review. We'll notify you within 2-3 business days once a decision is made.
            </p>
            <div className="rounded-2xl p-4 text-left mb-6" style={{ background: 'rgba(255,159,67,0.08)', border: '1px solid rgba(255,159,67,0.2)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#FF9F43' }}>What happens next?</p>
              <div className="space-y-1.5">
                {['Our team reviews your application & documents', 'We may contact you for additional info', 'Upon approval, your profile gets a verified badge'].map(item => (
                  <div key={item} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#FF9F43' }} />
                    <p className="text-xs text-[#8B8B9A]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <Button size="lg" onClick={() => navigate('/profile')}>Back to Profile</Button>
          </div>
        </div>
      )}
    </div>
  )
}
