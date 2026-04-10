import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import type { Locale } from './translations'
import App from './App'
import PrivacyPage from './pages/PrivacyPage'
import GoldNftMintPage from './pages/GoldNftMintPage'
import FileProtocolBanner from './components/FileProtocolBanner'

export default function RouterApp() {
  const [locale, setLocale] = useState<Locale>('ru')

  return (
    <>
      <FileProtocolBanner locale={locale} />
      <Routes>
        <Route path="/" element={<App locale={locale} setLocale={setLocale} />} />
        <Route path="/privacy" element={<PrivacyPage locale={locale} setLocale={setLocale} />} />
        <Route path="/mint-nft" element={<GoldNftMintPage locale={locale} setLocale={setLocale} />} />
        {/* Unknown paths → home (SPA) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
