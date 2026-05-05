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
    'border border-[#146B54] bg-[#0B513F] text-[#09CF91] shadow-lg shadow-[0_12px_28px_rgba(11,81,63,0.35)] hover:bg-[#0F614B]'
  const secondaryClass =
    'border border-[#146B54] bg-[#0B513F] text-[#09CF91] hover:bg-[#0F614B]'

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
