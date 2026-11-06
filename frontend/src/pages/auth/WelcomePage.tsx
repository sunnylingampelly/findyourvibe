import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogoMark } from '../../components/ui/Logo'

const features = [
  { emoji: '🎬', label: 'Movie nights' },
  { emoji: '☕', label: 'Coffee chats' },
  { emoji: '✈️', label: 'Travel buddies' },
  { emoji: '🗺️', label: 'City walks' },
  { emoji: '🎭', label: 'Event partners' },
]

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="app-container relative flex flex-col min-h-dvh overflow-hidden bg-[#1a2e28]">
      {/* Background photo */}
      <img
        src="/welcome-bg.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Layered gradient: subtle top + strong bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/80" />

      {/* Content */}
      <div className="relative flex flex-col h-dvh">
        {/* Top: logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5 px-6 pt-safe pt-6"
        >
          <LogoMark size={34} />
          <span className="font-manrope font-extrabold text-white text-lg tracking-tight">FindYourVibe</span>
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
    </div>
  )
}
