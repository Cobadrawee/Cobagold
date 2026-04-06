import { motion } from 'framer-motion'

/**
 * Hero visual: gold orb with clear animation and hover interaction.
 */
export default function GoldMedallion() {
  return (
    <div className="relative flex justify-center md:justify-end">
      <motion.div
        className="relative h-56 w-56 sm:h-64 sm:w-64 cursor-default select-none"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* Glow – breathes and reacts on hover */}
        <motion.div
          className="pointer-events-none absolute inset-[-48px] rounded-full bg-[radial-gradient(circle,_rgba(212,175,55,0.22)_0%,_transparent_65%)] blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />

        {/* Orbit rings – visible spin, speed up on hover via parent scale */}
        <motion.div
          className="absolute inset-2 rounded-full border border-amber-400/25"
          style={{ boxShadow: '0 0 24px rgba(251,191,36,0.2)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-6 rounded-full border border-amber-300/30"
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />

        {/* Core sphere – subtle pulse */}
        <motion.div
          className="absolute inset-8 rounded-full overflow-hidden"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,_rgba(255,255,255,0.5),_rgba(253,230,138,0.35)_38%,_rgba(212,175,55,0.6)_65%,_rgba(184,134,11,0.85))]"
            style={{
              boxShadow: '0 0 50px rgba(212,175,55,0.35), inset 0 -6px 24px rgba(0,0,0,0.2)',
            }}
          />
          {/* Moving shine sweep – clearly animated */}
          <motion.div
            className="absolute inset-0"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.8 }}
          >
            <div
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent"
              style={{ filter: 'blur(10px)' }}
            />
          </motion.div>
        </motion.div>

        {/* Gentle float */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ zIndex: -1 }}
        >
          <div className="absolute inset-[-24px] rounded-full bg-amber-500/5 blur-2xl" />
        </motion.div>
      </motion.div>
    </div>
  )
}
