import { motion } from 'framer-motion'

/**
 * Thin rotating gold ring - decorative accent for section headers.
 */
export default function GoldRing({ className = '', size = 48 }: { className?: string; size?: number }) {
  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{ width: size, height: size }}
    >
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-gold-400/40"
        style={{ boxShadow: '0 0 20px rgba(205, 180, 120, 0.22)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-1 rounded-full border border-gold-300/30"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}
