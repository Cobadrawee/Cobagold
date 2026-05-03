import { motion } from 'framer-motion'

/**
 * Hero visual: COBA medallion image with subtle motion.
 */
export default function GoldMedallion() {
  return (
    <div className="relative flex justify-center md:justify-end">
      <motion.div
        className="relative h-56 w-56 cursor-default select-none sm:h-64 sm:w-64"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <motion.div
          className="pointer-events-none absolute inset-[-40px] rounded-full bg-[radial-gradient(circle,_rgba(245,179,1,0.25)_0%,_transparent_68%)] blur-3xl"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />

        {/* Backplate matches site bg (--bg 10 10 13) so the coin sits in the UI, not on a photo studio black */}
        <div
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_42%,_rgba(251,191,36,0.14)_0%,_rgba(10,10,13,0.92)_52%,_rgb(10,10,13)_100%)] ring-1 ring-amber-500/15"
          aria-hidden
        />

        <motion.div
          className="absolute inset-0 overflow-hidden rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img
            src="/coba-hero-medallion.png"
            alt="COBA medallion"
            className="relative z-10 h-full w-full object-contain [filter:drop-shadow(0_12px_28px_rgba(0,0,0,0.45))_drop-shadow(0_0_20px_rgba(245,179,1,0.35))]"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
