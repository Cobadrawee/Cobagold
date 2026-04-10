import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const MotionLink = motion.create(Link)

/**
 * Primary CTA to the USDT → Gold NFT mint page (/mint-nft).
 * Connect wallet happens on that page (Ethereum mainnet + USDT approve + mint).
 */
export default function SwapOrConnect({
  children,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}) {
  const baseClass =
    'inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold transition-all'
  const primaryClass =
    'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
  const secondaryClass =
    'border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'

  return (
    <MotionLink
      to="/mint-nft"
      className={`${baseClass} ${variant === 'primary' ? primaryClass : secondaryClass} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </MotionLink>
  )
}
