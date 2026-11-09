import { useState } from 'react'
import { ChevronDown, MessageCircle, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AppShell from '../../components/layout/AppShell'
import PageHeader from '../../components/layout/PageHeader'

const faqs = [
  { q: 'How do I find companions?', a: 'Use the Discover tab to browse companions near you. You can filter by activity type, location, and interests. Swipe right to like or left to pass.' },
  { q: 'How does the connection process work?', a: 'Send a connection request with a personal message. If the companion accepts, you can start chatting and arrange your activity.' },
  { q: 'Is my information safe?', a: 'Yes. We use industry-standard encryption to protect your personal data. You control what information is visible on your profile.' },
  { q: 'How do I become a verified companion?', a: 'Go to Profile → Become a Companion to start your application. You\'ll need to verify your identity and agree to our companion guidelines.' },
  { q: 'Can I block someone?', a: 'Yes. On any profile, tap the flag icon and select a report reason. You can also block users from their profile page.' },
  { q: 'How do I delete my account?', a: 'Go to Profile → Account Settings → Delete Account. This action is permanent and cannot be undone.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#F4F1EA] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <span className="font-manrope font-semibold text-sm text-[#24332F] leading-snug">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-[#A1AAA5] shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-sm text-[#77817C] leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HelpPage() {
  return (
    <AppShell>
      <div className="screen-scroll h-dvh overflow-y-auto bg-[#FAF9F6]">
        <PageHeader title="Help & Support" back />

        <div className="px-4 pb-10 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#A1AAA5] px-1 mb-2">Frequently Asked Questions</p>
            <div className="bg-white rounded-2xl border border-[#E8EAE6] overflow-hidden">
              {faqs.map(f => <FaqItem key={f.q} {...f} />)}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#A1AAA5] px-1 mb-2">Contact Us</p>
            <div className="bg-white rounded-2xl border border-[#E8EAE6] overflow-hidden">
              <button className="w-full flex items-center gap-3 px-4 py-4 border-b border-[#F4F1EA]">
                <div className="w-9 h-9 bg-[#E8F0EA] rounded-xl flex items-center justify-center">
                  <MessageCircle size={18} className="text-[#236B63]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm text-[#24332F]">Live Chat</p>
                  <p className="text-xs text-[#A1AAA5]">Usually responds in a few minutes</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 bg-[#E8F0EA] rounded-xl flex items-center justify-center">
                  <Mail size={18} className="text-[#236B63]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm text-[#24332F]">Email Support</p>
                  <p className="text-xs text-[#A1AAA5]">support@findyourvibe.com</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
