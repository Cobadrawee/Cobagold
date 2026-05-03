import { motion } from 'framer-motion'

export default function GoldOrb() {
  return (
    <div className="relative flex justify-center md:justify-end">
      <motion.div
        className="relative h-64 w-64 sm:h-80 sm:w-80 float-slow"
        initial={{ opacity: 0, y: 40, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.25, type: 'spring', stiffness: 60, damping: 18 }}
      >
        {/* Outer glow - breathing */}
        <motion.div
          className="pointer-events-none absolute inset-[-80px] rounded-full bg-[radial-gradient(circle,_rgba(205,180,120,0.2)_0%,_transparent_70%)] blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Conic glow */}
        <div className="pointer-events-none absolute inset-[-50px] rounded-full bg-[conic-gradient(at_top,_#e2d2b3,_#b99758,_#8a6d37,_#e2d2b3)] opacity-20 blur-3xl" />

        {/* Core orb - gold sphere with subtle pulse */}
        <motion.div
          className="absolute inset-6 rounded-full bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.52),_rgba(226,210,179,0.42)_35%,_rgba(185,151,88,0.62)_65%,_rgba(138,109,55,0.88))] shadow-[0_0_80px_rgba(185,151,88,0.45),inset_0_-10px_40px_rgba(0,0,0,0.22)]"
          animate={{
            scale: [1, 1.04, 1],
            boxShadow: [
              '0 0 80px rgba(185,151,88,0.45)',
              '0 0 100px rgba(205,180,120,0.5)',
              '0 0 80px rgba(185,151,88,0.45)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Rotating orbit rings - 3 layers */}
        <motion.div
          className="absolute inset-2 rounded-full border border-gold-400/25"
          style={{ boxShadow: '0 0 24px rgba(205, 180, 120, 0.22)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-8 rounded-full border border-gold-300/35"
          animate={{ rotate: -360 }}
          transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-14 rounded-full border border-gold-200/28"
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-20 rounded-full border border-gold-500/20"
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />

        {/* Orbiting dots - two sets */}
        <motion.div
          className="absolute inset-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        >
          <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-gold-300 shadow-[0_0_14px_rgba(205,180,120,0.75)]" />
          <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-gold-400 shadow-[0_0_10px_rgba(185,151,88,0.65)]" />
          <span className="absolute left-1/2 bottom-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-gold-400 shadow-[0_0_10px_rgba(205,180,120,0.65)]" />
          <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-gold-300 shadow-[0_0_10px_rgba(226,210,179,0.55)]" />
        </motion.div>
        <motion.div
          className="absolute inset-12"
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        >
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-gold-200/90" />
          <span className="absolute right-0 top-1/3 h-2 w-2 -translate-y-1/2 rounded-full bg-gold-300/90" />
          <span className="absolute left-0 top-2/3 h-2 w-2 -translate-y-1/2 rounded-full bg-gold-300/90" />
        </motion.div>

        {/* Scanning arc */}
        <motion.div
          className="absolute inset-5 overflow-hidden rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg,_transparent_0deg,_transparent_200deg,rgba(205,180,120,0.42)_250deg,transparent_310deg)]" />
        </motion.div>
      </motion.div>
    </div>
  )
}
