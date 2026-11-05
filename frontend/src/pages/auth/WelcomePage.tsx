import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="app-container relative flex flex-col min-h-dvh overflow-hidden">
      {/* Full-bleed background photo */}
      <img
        src="/welcome-bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dark gradient overlay — stronger at bottom for button legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />

      {/* Bottom actions */}
      <div className="relative mt-auto px-6 pb-safe pb-12 flex flex-col gap-3">
        <motion.button
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          onClick={() => navigate('/register')}
          className="w-full bg-white text-[#236B63] rounded-[14px] py-4 font-manrope font-bold text-base"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}
        >
          Get Started
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          onClick={() => navigate('/login')}
          className="w-full rounded-[14px] py-4 font-manrope font-semibold text-base text-white"
          style={{ border: '2px solid rgba(255,255,255,0.55)' }}
        >
          I already have an account
        </motion.button>
      </div>
    </div>
  )
}
