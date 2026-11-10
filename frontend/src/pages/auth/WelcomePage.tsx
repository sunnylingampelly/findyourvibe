import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share, X, Zap, Wifi, Bell } from 'lucide-react'
import { LogoMark } from '../../components/ui/Logo'
import { usePWAInstall } from '../../hooks/usePWAInstall'

const features = [
  { emoji: '🎬', label: 'Movie nights' },
  { emoji: '☕', label: 'Coffee chats' },
  { emoji: '✈️', label: 'Travel buddies' },
  { emoji: '🗺️', label: 'City walks' },
  { emoji: '🎭', label: 'Event partners' },
]

const benefits = [
  { icon: Zap, text: 'Faster — loads instantly like a native app' },
  { icon: Wifi, text: 'Works offline — browse even without internet' },
  { icon: Bell, text: 'Notifications — never miss a connection request' },
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
    <div className="app-container relative flex flex-col min-h-dvh overflow-hidden bg-[#1a2e28]">
      {/* Background photo */}
      <img
        src="/welcome-bg.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Layered gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/80" />

      {/* Content */}
      <div className="relative flex flex-col h-dvh">
        {/* Top: logo + install button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5 px-6 pt-safe pt-6"
        >
          <LogoMark size={34} />
          <span className="font-manrope font-extrabold text-white text-lg tracking-tight flex-1">FindYourVibe</span>

          {canInstall && (
            <button
              onClick={() => setShowInstallSheet(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full border border-white/25 text-white text-xs font-semibold transition-all active:scale-95"
            >
              <Download size={13} />
              Install App
            </button>
          )}
        </motion.div>

        {/* Middle: feature chips */}
        <div className="flex-1 flex flex-col justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            {features.map((f, i) => (
              <motion.span
                key={f.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-white text-sm font-medium border border-white/20"
              >
                {f.emoji} {f.label}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.45 }}
          >
            <h1 className="font-manrope font-extrabold text-white text-[2.1rem] leading-[1.15] tracking-[-0.5px]">
              Find companions<br />who match your vibe
            </h1>
            <p className="text-white/70 mt-3 text-base leading-relaxed">
              Genuine connections with verified companions for every occasion.
            </p>
          </motion.div>
        </div>

        {/* Bottom: CTAs */}
        <div className="px-6 pb-safe pb-10 space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            className="w-full bg-white text-[#236B63] rounded-2xl py-4 font-manrope font-bold text-base shadow-lg shadow-black/25 tracking-[-0.2px]"
          >
            Get Started — It's Free
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            className="w-full rounded-2xl py-4 font-manrope font-semibold text-base text-white border border-white/35"
          >
            I already have an account
          </motion.button>

          <p className="text-center text-white/40 text-xs pt-1">
            By continuing you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>

      {/* Install PWA bottom sheet */}
      <AnimatePresence>
        {showInstallSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowInstallSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-[#E8EAE6] rounded-full mx-auto mb-5" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#236B63] rounded-2xl flex items-center justify-center shadow-md">
                    <LogoMark size={28} />
                  </div>
                  <div>
                    <p className="font-manrope font-bold text-[#24332F] text-base leading-tight">FindYourVibe</p>
                    <p className="text-[#A1AAA5] text-xs">findyourvibe.com</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstallSheet(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#A1AAA5]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Benefits */}
              <div className="bg-[#F9FAF8] rounded-2xl p-4 space-y-3 mb-6">
                {benefits.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#E8F0EA] flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-[#236B63]" />
                    </div>
                    <span className="text-sm text-[#24332F] leading-snug">{text}</span>
                  </div>
                ))}
              </div>

              {/* Action: native prompt (Chrome/Android) or iOS steps */}
              {!isIOS && hasNativePrompt ? (
                <button
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="w-full bg-[#236B63] text-white rounded-2xl py-4 font-manrope font-bold text-base disabled:opacity-60 active:scale-[0.98] transition-transform"
                >
                  {installing ? 'Installing…' : 'Install Now'}
                </button>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#24332F] mb-3">
                    {isIOS ? 'Install on iPhone / iPad' : 'Install from your browser'}
                  </p>
                  <ol className="space-y-3">
                    {isIOS ? (
                      <>
                        <li className="flex items-start gap-3 text-sm text-[#24332F]">
                          <span className="w-6 h-6 rounded-full bg-[#E8F0EA] text-[#236B63] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Tap the <Share size={13} className="inline text-[#236B63] mb-0.5" /> <strong>Share</strong> button in the Safari toolbar.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#24332F]">
                          <span className="w-6 h-6 rounded-full bg-[#E8F0EA] text-[#236B63] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Scroll and tap <strong>"Add to Home Screen"</strong>.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#24332F]">
                          <span className="w-6 h-6 rounded-full bg-[#E8F0EA] text-[#236B63] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>Tap <strong>"Add"</strong> to confirm.</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-3 text-sm text-[#24332F]">
                          <span className="w-6 h-6 rounded-full bg-[#E8F0EA] text-[#236B63] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Tap the <strong>⋮ menu</strong> in your browser's top-right corner.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#24332F]">
                          <span className="w-6 h-6 rounded-full bg-[#E8F0EA] text-[#236B63] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
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
