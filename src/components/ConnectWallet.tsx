import { motion } from 'framer-motion'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'

/**
 * PancakeSwap‑style Connect Wallet pill.
 * - Disconnected: gold gradient button with wallet icon + \"Connect Wallet\" label.
 * - Connected: pill with green status dot, truncated address and a small chevron.
 * Clicking always opens the AppKit modal (Connect or Account view).
 */
export default function ConnectWallet({ locale = 'en' }: { locale?: 'ru' | 'en' }) {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const isRu = locale === 'ru'

  const truncateAddress = (addr: string) => {
    const evmAddr = addr.includes(':') ? addr.split(':').pop() ?? addr : addr
    return `${evmAddr.slice(0, 6)}...${evmAddr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <motion.button
        type="button"
        onClick={() => open({ view: 'Account' })}
        className="flex max-w-[12.5rem] items-center gap-1.5 rounded-full border border-emerald-500/45 bg-emerald-500/12 px-2.5 py-2 text-xs font-medium text-emerald-200 shadow-sm shadow-emerald-700/25 transition-all hover:border-emerald-400 hover:bg-emerald-500/22 sm:max-w-none sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/30 sm:h-6 sm:w-6">
          <span className="h-2.5 w-2.5 rounded-[6px] bg-[rgb(12,10,20)] shadow-inner sm:h-3 sm:w-3" />
        </span>
        <span className="flex min-w-0 items-center gap-1 sm:gap-2">
          <span className="hidden items-center gap-1 text-xs text-emerald-400 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isRu ? 'Подключен' : 'Connected'}</span>
          </span>
          <span className="truncate text-emerald-50">{truncateAddress(address)}</span>
        </span>
        <svg
          className="ml-0.5 h-3.5 w-3.5 shrink-0 text-emerald-200"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 10L12 15L17 10"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={() => open({ view: 'Connect' })}
      className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-700/35 transition-all hover:shadow-emerald-700/50 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950/25 sm:h-6 sm:w-6">
        <svg
          className="h-3 w-3 sm:h-3.5 sm:w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="4"
            y="7"
            width="16"
            height="10"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M16 12.5H18.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>{isRu ? 'Подключить' : 'Connect'}</span>
    </motion.button>
  )
}
