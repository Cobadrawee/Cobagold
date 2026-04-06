import { motion } from 'framer-motion'

/** Flat-top hexagon: 50,15  79,37.5  79,62.5  50,85  21,62.5  21,37.5 */
const HEX_POINTS = '50,15 79,37.5 79,62.5 50,85 21,62.5 21,37.5'

/**
 * Small gold hexagon accent with pulse - for tokenomics / tech sections.
 */
export default function GoldHex({ className = '', size = 64 }: { className?: string; size?: number }) {
  return (
    <div
      className={`pointer-events-none absolute overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <motion.svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        animate={{
          rotate: [0, 6, -6, 0],
          scale: [1, 1.06, 1],
        }}
        transition={{
          type: 'spring',
          stiffness: 80,
          damping: 22,
          rotate: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 0.5 },
        }}
      >
        <defs>
          <linearGradient id="hexGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(253,230,138,0.45)" />
            <stop offset="50%" stopColor="rgba(212,175,55,0.55)" />
            <stop offset="100%" stopColor="rgba(184,134,11,0.45)" />
          </linearGradient>
          <filter id="hexGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.polygon
          points={HEX_POINTS}
          fill="url(#hexGold)"
          stroke="rgba(251,191,36,0.4)"
          strokeWidth="1.2"
          filter="url(#hexGlow)"
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.svg>
    </div>
  )
}
