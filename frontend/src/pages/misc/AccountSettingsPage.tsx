import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Eye, Lock, Trash2, ChevronRight } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#236B63]' : 'bg-[#D1D5DB]'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
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
      <div className="screen-scroll h-dvh overflow-y-auto bg-[#FAF9F6]">
        <PageHeader title="Account Settings" back />

        <div className="px-4 pb-10 space-y-5">
          {sections.map(section => (
            <div key={section.label}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#A1AAA5] px-1 mb-2">{section.label}</p>
              <div className="bg-white rounded-2xl border border-[#E8EAE6] overflow-hidden">
                {section.items.map(({ icon: Icon, label, sub, value, onChange }, idx, arr) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 px-4 py-3.5 ${idx < arr.length - 1 ? 'border-b border-[#F4F1EA]' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#E8F0EA] flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-[#236B63]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#24332F]">{label}</p>
                      <p className="text-xs text-[#A1AAA5] mt-0.5">{sub}</p>
                    </div>
                    <Toggle checked={value} onChange={onChange} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Danger zone */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#A1AAA5] px-1 mb-2">Account</p>
            <div className="bg-white rounded-2xl border border-[#E8EAE6] overflow-hidden">
              <button className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#F4F1EA] hover:bg-[#FAF9F6]">
                <div className="w-8 h-8 rounded-xl bg-[#E8F0EA] flex items-center justify-center">
                  <Lock size={16} className="text-[#236B63]" />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-[#24332F]">Change Password</span>
                <ChevronRight size={16} className="text-[#C8CCC9]" />
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#FFF5F5]">
                <div className="w-8 h-8 rounded-xl bg-[#FDE8E8] flex items-center justify-center">
                  <Trash2 size={16} className="text-[#D76D6D]" />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-[#D76D6D]">Delete Account</span>
                <ChevronRight size={16} className="text-[#D76D6D]/40" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
