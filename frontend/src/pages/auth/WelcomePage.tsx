import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share, X, Zap, Wifi, Bell } from 'lucide-react'
import { LogoMark } from '../../components/ui/Logo'
import { usePWAInstall } from '../../hooks/usePWAInstall'

const vibes = [
  { emoji: '🎬', label: 'Movie nights' },
  { emoji: '☕', label: 'Coffee dates' },
  { emoji: '✈️', label: 'Travel buddies' },
  { emoji: '🎭', label: 'Event partners' },
  { emoji: '🗺️', label: 'City walks' },
]

const benefits = [
  { icon: Zap, text: 'Instant — loads like a native app' },
  { icon: Wifi, text: 'Works offline — browse without signal' },
  { icon: Bell, text: 'Real-time — never miss a connection' },
]

export default function WelcomePage() {
  const navigate = useNavigate()
  const { canInstall, hasNativePrompt, isIOS, triggerNativePrompt } = usePWAInstall()
  const [showInstallSheet, setShowInstallSheet] = useState(false)
  const [installing, setInstalling] = useState(false)

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      setInstalling(true)
      await triggerNativePrompt()
      setInstalling(false)
      setShowInstallSheet(false)
    }
  }

  return (
    <div className="app-container relative flex flex-col min-h-dvh overflow-hidden" style={{ background: '#050508' }}>
      {/* Background photo */}
      <img
        src="/welcome-bg.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ opacity: 0.55 }}
      />

      {/* Dark gradient — heavier at bottom for text legibility */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, rgba(5,5,8,0.5) 0%, rgba(5,5,8,0.1) 30%, rgba(5,5,8,0.7) 65%, rgba(5,5,8,0.97) 100%)'
      }} />

      {/* Content */}
      <div className="relative flex flex-col h-dvh">

        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5 px-6 pt-safe pt-5"
        >
          <LogoMark size={32} />
          <span className="font-manrope font-bold text-white text-base tracking-tight flex-1">FindYourVibe</span>

          {canInstall && (
            <button
              onClick={() => setShowInstallSheet(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold text-white transition-all active:scale-95"
              style={{ background: 'rgba(200,255,77,0.12)', borderColor: 'rgba(200,255,77,0.3)', color: '#C8FF4D' }}
            >
              <Download size={12} />
              Install
            </button>
          )}
        </motion.div>

        {/* Middle: vibe chips */}
        <div className="flex-1 flex flex-col justify-end px-6 pb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            {vibes.map((v, i) => (
              <motion.span
                key={v.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white/90 text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              >
                {v.emoji} {v.label}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.45 }}
            className="mb-8"
          >
            <h1 className="font-manrope font-extrabold text-white leading-[1.1] tracking-[-1px]" style={{ fontSize: '2.4rem' }}>
              Find your<br />
              <span style={{ color: '#C8FF4D' }}>people.</span>
            </h1>
            <p className="text-white/60 mt-3 text-base leading-relaxed">
              Verified companions for every occasion — real connections, your way.
            </p>
          </motion.div>

          {/* CTAs */}
          <div className="space-y-3">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              className="w-full rounded-2xl py-4 font-manrope font-bold text-base tracking-tight"
              style={{
                background: '#C8FF4D',
                color: '#0A1A00',
                boxShadow: '0 4px 32px rgba(200,255,77,0.35)',
              }}
            >
              Get Started — It's Free
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              className="w-full rounded-2xl py-4 font-manrope font-semibold text-base text-white/80"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              I already have an account
            </motion.button>

            <p className="text-center text-white/25 text-xs pt-1">
              By continuing you agree to our Terms & Privacy Policy
            </p>
          </div>
        </div>
      </div>

      {/* Install PWA bottom sheet */}
      <AnimatePresence>
        {showInstallSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40"
              onClick={() => setShowInstallSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] rounded-t-3xl z-50 px-6 pt-5 pb-10"
              style={{ background: '#141418', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-[#2E2E3A] rounded-full mx-auto mb-5" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md" style={{ background: '#C8FF4D' }}>
                    <LogoMark size={28} />
                  </div>
                  <div>
                    <p className="font-manrope font-bold text-[#F2F0EB] text-base leading-tight">FindYourVibe</p>
                    <p className="text-[#52525E] text-xs">findyourvibe.com</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstallSheet(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#8B8B9A]"
                  style={{ background: '#252530' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Benefits */}
              <div className="rounded-2xl p-4 space-y-3 mb-6" style={{ background: '#1C1C22', border: '1px solid #2E2E3A' }}>
                {benefits.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(200,255,77,0.1)' }}>
                      <Icon size={15} style={{ color: '#C8FF4D' }} />
                    </div>
                    <span className="text-sm text-[#F2F0EB] leading-snug">{text}</span>
                  </div>
                ))}
              </div>

              {!isIOS && hasNativePrompt ? (
                <button
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="w-full rounded-2xl py-4 font-manrope font-bold text-base disabled:opacity-60 active:scale-[0.98] transition-transform"
                  style={{ background: '#C8FF4D', color: '#0A1A00' }}
                >
                  {installing ? 'Installing…' : 'Install Now'}
                </button>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#F2F0EB] mb-3">
                    {isIOS ? 'Install on iPhone / iPad' : 'Install from your browser'}
                  </p>
                  <ol className="space-y-3">
                    {isIOS ? (
                      <>
                        <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                          <span className="w-6 h-6 rounded-full text-[#0A1A00] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#C8FF4D' }}>1</span>
                          <span>Tap the <Share size={13} className="inline mb-0.5" style={{ color: '#C8FF4D' }} /> <strong>Share</strong> button in Safari.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                          <span className="w-6 h-6 rounded-full text-[#0A1A00] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#C8FF4D' }}>2</span>
                          <span>Scroll down and tap <strong>"Add to Home Screen"</strong>.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                          <span className="w-6 h-6 rounded-full text-[#0A1A00] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#C8FF4D' }}>3</span>
                          <span>Tap <strong>"Add"</strong> to confirm.</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                          <span className="w-6 h-6 rounded-full text-[#0A1A00] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#C8FF4D' }}>1</span>
                          <span>Tap the <strong>⋮ menu</strong> in your browser's top-right corner.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#F2F0EB]">
                          <span className="w-6 h-6 rounded-full text-[#0A1A00] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#C8FF4D' }}>2</span>
                          <span>Tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.</span>
                        </li>
                      </>
                    )}
                  </ol>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
