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
    'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-700/30 hover:shadow-emerald-700/45'
  const secondaryClass =
    'border border-emerald-500/45 bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/22'

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
