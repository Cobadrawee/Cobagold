import { motion } from 'framer-motion'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'

/**
 * Button that opens Connect Wallet when disconnected, or Swap view when connected.
 * Used for "Обменять" and "Поменять USDT на COBA" flows.
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
  const { open } = useAppKit()
  const { isConnected } = useAppKitAccount()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isConnected) {
      open({ view: 'Swap' })
    } else {
      open({ view: 'Connect' })
    }
  }

  const baseClass =
    'inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold transition-all'
  const primaryClass =
    'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
  const secondaryClass =
    'border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      className={`${baseClass} ${variant === 'primary' ? primaryClass : secondaryClass} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  )
}
