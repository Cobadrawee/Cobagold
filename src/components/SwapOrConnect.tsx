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
    'bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-[#2f1600] shadow-lg shadow-[0_12px_30px_rgba(249,115,22,0.34)] hover:shadow-[0_14px_34px_rgba(249,115,22,0.42)]'
  const secondaryClass =
    'border border-gold-500/40 bg-gold-500/10 text-gold-300 hover:bg-gold-500/20'

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
