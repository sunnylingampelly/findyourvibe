import { useState } from 'react'
import { Bell, Eye, Lock, Trash2, ChevronRight } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200"
      style={{ background: checked ? '#C8FF4D' : '#252530' }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        style={{ background: checked ? '#0A1A00' : '#52525E' }}
      />
    </button>
  )
}

export default function AccountSettingsPage() {
  const [pushNotifs, setPushNotifs] = useState(true)
  const [emailNotifs, setEmailNotifs] = useState(false)
  const [showOnline, setShowOnline] = useState(true)
  const [discoverable, setDiscoverable] = useState(true)

  const sections = [
    {
      label: 'Notifications',
      items: [
        { icon: Bell, label: 'Push Notifications', sub: 'Receive alerts for messages & connections', value: pushNotifs, onChange: setPushNotifs },
        { icon: Bell, label: 'Email Notifications', sub: 'Updates and activity summaries', value: emailNotifs, onChange: setEmailNotifs },
      ],
    },
    {
      label: 'Privacy',
      items: [
        { icon: Eye, label: 'Show Online Status', sub: 'Let others see when you are active', value: showOnline, onChange: setShowOnline },
        { icon: Eye, label: 'Discoverable', sub: 'Appear in search and discover results', value: discoverable, onChange: setDiscoverable },
      ],
    },
  ]

  return (
    <AppShell>
      <div className="screen-scroll h-dvh overflow-y-auto bg-[#0D0D12]">
        <PageHeader title="Account Settings" back />

        <div className="px-4 pb-10 space-y-5">
          {sections.map(section => (
            <div key={section.label}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#52525E] px-1 mb-2">{section.label}</p>
              <div className="bg-[#141418] rounded-2xl border border-[#2E2E3A] overflow-hidden">
                {section.items.map(({ icon: Icon, label, sub, value, onChange }, idx, arr) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 px-4 py-3.5 ${idx < arr.length - 1 ? 'border-b border-[#2E2E3A]' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(200,255,77,0.1)' }}>
                      <Icon size={16} style={{ color: '#C8FF4D' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F2F0EB]">{label}</p>
                      <p className="text-xs text-[#52525E] mt-0.5">{sub}</p>
                    </div>
                    <Toggle checked={value} onChange={onChange} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Danger zone */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#52525E] px-1 mb-2">Account</p>
            <div className="bg-[#141418] rounded-2xl border border-[#2E2E3A] overflow-hidden">
              <button className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#2E2E3A] hover:bg-[#1C1C22] transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200,255,77,0.1)' }}>
                  <Lock size={16} style={{ color: '#C8FF4D' }} />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-[#F2F0EB]">Change Password</span>
                <ChevronRight size={16} className="text-[#52525E]" />
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#1C1C22] transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,92,122,0.1)' }}>
                  <Trash2 size={16} style={{ color: '#FF5C7A' }} />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-[#FF5C7A]">Delete Account</span>
                <ChevronRight size={16} style={{ color: 'rgba(255,92,122,0.4)' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
