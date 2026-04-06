import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * WalletConnect QR requires http(s) origin — not file://. Shown in-app so users
 * who double-click index.html see what to do (no separate readme required).
 */
export default function FileProtocolBanner({ locale }: { locale: 'ru' | 'en' }) {
  const isFile = useMemo(
    () => typeof window !== 'undefined' && window.location.protocol === 'file:',
    [],
  )

  if (!isFile) return null

  const text =
    locale === 'ru'
      ? 'Кошелёк и QR-код: закройте эту вкладку и запустите в этой папке START-MAC.command или START-WINDOWS.bat — сайт должен открыться по адресу http://localhost (не через двойной щелчок по index.html).'
      : 'Wallet & QR: close this tab and run START-MAC.command or START-WINDOWS.bat in this folder so the site opens at http://localhost — not by opening index.html directly.'

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-[100] border-b border-amber-500/40 bg-amber-950/95 px-4 py-3 text-center text-xs leading-relaxed text-amber-100 shadow-lg backdrop-blur-sm sm:text-sm"
    >
      {text}
    </motion.div>
  )
}
