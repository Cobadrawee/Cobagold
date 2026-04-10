import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { translations, type Locale } from './translations'
import GoldMedallion from './components/GoldMedallion'
import GoldParticles from './components/GoldParticles'
import GoldHex from './components/GoldHex'
import GoldRing from './components/GoldRing'
import GoldOrb from './components/GoldOrb'
import { useAppKit } from '@reown/appkit/react'
import ConnectWallet from './components/ConnectWallet'
import SwapOrConnect from './components/SwapOrConnect'
import AboutProjectText from './components/AboutProjectText'
import FooterAutoplayVideo from './components/FooterAutoplayVideo'
import aboutProjectRu from './content/about-project-ru.txt?raw'
import aboutProjectEn from './content/about-project-en.txt?raw'
import { readGoldPriceCache, writeGoldPriceCache } from './utils/goldPriceCache'
import { fetchGoldSpotUsdPerTroyOz } from './utils/goldSpotUsdPerOz'

function App({
  locale,
  setLocale,
}: {
  locale: Locale
  setLocale: Dispatch<SetStateAction<Locale>>
}) {
  const { open } = useAppKit()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [projectExpanded, setProjectExpanded] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [subscribeMessage, setSubscribeMessage] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [gold9_6gUsdt, setGold9_6gUsdt] = useState<number | null>(() => readGoldPriceCache()?.usdt9_6g ?? null)
  const [gold24hChange, setGold24hChange] = useState<number | null>(
    () => readGoldPriceCache()?.change24hPct ?? null,
  )
  const [gold9_6gStatus, setGold9_6gStatus] = useState<'loading' | 'ok' | 'error'>(() =>
    readGoldPriceCache() ? 'ok' : 'loading',
  )
  /** True when live APIs failed but we still show a saved price from localStorage */
  const [goldPriceStale, setGoldPriceStale] = useState(false)
  const t = translations[locale]

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setProjectExpanded(false)
  }, [locale])

  useEffect(() => {
    document.documentElement.lang = locale === 'ru' ? 'ru' : 'en'
  }, [locale])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [locale])

  // Live comparison: 9.6 grams of gold -> USDT (USD) equivalent.
  // Multiple API sources + localStorage cache so a value usually stays visible.
  useEffect(() => {
    let cancelled = false
    const apiKey = import.meta.env.VITE_METALAPI_KEY

    const fetchWithRetry = async (url: string, attempts = 3): Promise<Response | null> => {
      for (let i = 0; i < attempts; i++) {
        try {
          const res = await fetch(url)
          if (res.ok) return res
          if (res.status === 429 && i < attempts - 1) {
            await new Promise((r) => setTimeout(r, 1200 * (i + 1)))
            continue
          }
          if (i === attempts - 1) return res
        } catch {
          if (i === attempts - 1) return null
          await new Promise((r) => setTimeout(r, 600 * (i + 1)))
        }
      }
      return null
    }

    const applyLivePrice = (usdPerOunce: number, change24h: number | null) => {
      const gramsPerOunce = 31.1034768
      const usdt = (usdPerOunce * 9.6) / gramsPerOunce
      if (cancelled) return
      setGold9_6gUsdt(usdt)
      setGold24hChange(change24h)
      setGold9_6gStatus('ok')
      setGoldPriceStale(false)
      writeGoldPriceCache(usdt, change24h)
    }

    const fetchGold = async () => {
      try {
        const spot = await fetchGoldSpotUsdPerTroyOz(fetchWithRetry, apiKey)
        let usdPerOunce = spot?.usdPerTroyOz ?? null
        let change24h: number | null = spot?.change24hPct ?? null

        // Fallback 24h % from chart if exchanges didn’t return it
        if (usdPerOunce != null && change24h == null) {
          try {
            const chartRes = await fetchWithRetry(
              'https://api.coingecko.com/api/v3/coins/pax-gold/market_chart?vs_currency=usd&days=2',
            )
            if (chartRes?.ok) {
              const chart = (await chartRes.json()) as { prices?: [number, number][] }
              const prices = chart?.prices ?? []
              if (prices.length >= 2) {
                const now = Date.now()
                const dayAgo = now - 24 * 60 * 60 * 1000
                const recent = prices.filter(([t]) => t >= dayAgo).sort((a, b) => b[0] - a[0])
                const older = prices.filter(([t]) => t < dayAgo).sort((a, b) => b[0] - a[0])
                const priceNow = recent[0]?.[1]
                const price24h = older[0]?.[1]
                if (typeof priceNow === 'number' && typeof price24h === 'number' && price24h > 0) {
                  change24h = ((priceNow - price24h) / price24h) * 100
                }
              }
            }
          } catch {
            // ignore
          }
        }

        if (typeof usdPerOunce === 'number' && usdPerOunce > 0) {
          applyLivePrice(usdPerOunce, change24h)
          return
        }

        const cached = readGoldPriceCache()
        if (cached && !cancelled) {
          setGold9_6gUsdt(cached.usdt9_6g)
          setGold24hChange(cached.change24hPct)
          setGold9_6gStatus('ok')
          setGoldPriceStale(true)
          return
        }

        if (!cancelled) {
          setGold9_6gUsdt(null)
          setGold24hChange(null)
          setGold9_6gStatus('error')
          setGoldPriceStale(false)
        }
      } catch {
        const cached = readGoldPriceCache()
        if (cached && !cancelled) {
          setGold9_6gUsdt(cached.usdt9_6g)
          setGold24hChange(cached.change24hPct)
          setGold9_6gStatus('ok')
          setGoldPriceStale(true)
        } else if (!cancelled) {
          setGold9_6gUsdt(null)
          setGold24hChange(null)
          setGold9_6gStatus('error')
          setGoldPriceStale(false)
        }
      }
    }

    fetchGold()
    const id = window.setInterval(fetchGold, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const goldValueForUI = (() => {
    if (gold9_6gStatus === 'ok' && gold9_6gUsdt != null) return gold9_6gUsdt.toFixed(2)
    if (gold9_6gStatus === 'loading') return 'Loading...'
    if (gold9_6gStatus === 'error') return 'Unavailable'
    return 'Unavailable'
  })()

  const liveCurrentPriceText =
    gold9_6gStatus === 'ok' && gold9_6gUsdt != null ? `$${gold9_6gUsdt.toFixed(2)}` : goldValueForUI

  const contactMailtoHref = (() => {
    const subject = locale === 'ru' ? 'Запрос по COBA' : 'COBA inquiry'
    const body =
      locale === 'ru'
        ? 'Здравствуйте! Хочу узнать больше о COBA и способах обмена.\n\n'
        : 'Hello! I would like to learn more about COBA and swap options.\n\n'

    return `mailto:info@cobagold.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  })()

  const handleContactUs = async () => {
    const email = 'info@cobagold.com'
    const href = contactMailtoHref

    // Always show a small confirmation so the user knows the click worked.
    setContactMessage(locale === 'ru' ? 'Открываю письмо...' : 'Opening your email...')
    setTimeout(() => setContactMessage(''), 3500)

    // Best-effort copy: useful if the browser blocks mailto.
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      // ignore
    }

    window.location.href = href
  }

  const handleSubscribe = () => {
    const email = newsletterEmail.trim()
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (!isValid) {
      setSubscribeStatus('error')
      setSubscribeMessage(locale === 'ru' ? 'Введите корректный email.' : 'Please enter a valid email.')
      return
    }

    setSubscribeStatus('success')
    const subject = locale === 'ru' ? 'Подписка на новости COBA' : 'COBA newsletter subscription'
    const body =
      locale === 'ru'
        ? `Email: ${email}\n\nЗдравствуйте! Я хочу подписаться на новости COBA.\n`
        : `Email: ${email}\n\nHello! I want to subscribe to COBA updates.\n`

    // Open the client mail app to act as a lightweight "newsletter" submission.
    window.location.href = `mailto:info@cobagold.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setSubscribeMessage(locale === 'ru' ? 'Спасибо! Подписка отправлена.' : 'Thanks! Subscription sent.')
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      {/* Ambient background layers */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-amber-500/15 via-amber-600/5 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-1/4 right-0 h-[400px] bg-gradient-to-t from-amber-900/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[rgb(var(--bg))]/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 24 }}
          >
            <motion.img
              src="/coba-logo-from-pdf.png"
              alt="COBA"
              className="h-12 w-auto object-contain"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            />
            <span className="text-lg font-semibold text-white">COBA</span>
          </motion.div>

          <nav className="hidden items-center gap-8 md:flex">
            {[
              { href: '#main', label: t.nav.home },
              { href: '#about', label: t.nav.about },
              { href: '#tokenomics', label: t.nav.tokenomics },
              { href: '#roadmap', label: t.nav.roadmap },
              { href: '#contact', label: t.nav.contact },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-link text-sm text-zinc-400 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/mint-nft"
              className="nav-link text-sm text-zinc-400 transition-colors hover:text-amber-300"
            >
              {t.nav.nftMint}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 md:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
            <motion.button
              type="button"
              onClick={() => setLocale((prev) => (prev === 'ru' ? 'en' : 'ru'))}
              className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300 sm:inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              aria-label={locale === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            >
              {locale === 'ru' ? 'RU' : 'EN'}
            </motion.button>
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <ConnectWallet locale={locale} />
            </motion.div>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="container-page pb-3 md:hidden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="rounded-2xl border border-white/10 bg-[rgb(var(--bg))]/95 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => setLocale('ru')}
                      className={`min-w-[3.1rem] rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        locale === 'ru'
                          ? 'bg-amber-500 text-amber-950'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                      aria-label="Switch to Russian"
                    >
                      RU
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocale('en')}
                      className={`min-w-[3.1rem] rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        locale === 'en'
                          ? 'bg-amber-500 text-amber-950'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                      aria-label="Switch to English"
                    >
                      EN
                    </button>
                  </div>
                  <Link
                    to="/mint-nft"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-300"
                  >
                    {t.nav.nftMint}
                  </Link>
                  {[
                    { href: '#main', label: t.nav.home },
                    { href: '#about', label: t.nav.about },
                    { href: '#tokenomics', label: t.nav.tokenomics },
                    { href: '#roadmap', label: t.nav.roadmap },
                    { href: '#contact', label: t.nav.contact },
                  ].map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-medium text-zinc-300"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* Hero Section */}
        <section id="main" className="container-page pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
            <div className="space-y-8">
              <motion.div
                className="glow-pulse inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-300"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              >
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>{t.hero.badge}</span>
              </motion.div>

              <motion.h1
                className="text-4xl font-semibold leading-[1.15] sm:text-5xl md:text-6xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 80, damping: 22, delay: 0.1 }}
              >
                {t.hero.title}
                <span className="block gradient-text-gold mt-1">{t.hero.titleHighlight}</span>
              </motion.h1>

              <motion.p
                className="max-w-lg text-base text-zinc-400 sm:text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 70, damping: 24, delay: 0.18 }}
              >
                {t.hero.description}
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 70, damping: 24, delay: 0.25 }}
              >
                <SwapOrConnect
                  variant="primary"
                  className="flex min-w-[min(100%,18rem)] flex-col gap-1.5 px-7 py-5 text-center text-sm font-semibold leading-snug shadow-xl sm:min-w-[20rem] sm:px-10 sm:py-6 sm:text-base"
                >
                  <span className="block">{t.hero.swapCombinedLine1}</span>
                  <span className="block">{t.hero.swapCombinedLine2}</span>
                </SwapOrConnect>
              </motion.div>

              {/* Quick stats – interactive hover */}
              <motion.div
                className="flex flex-wrap gap-8 pt-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 70, damping: 24, delay: 0.32 }}
              >
                {[
                  { label: t.hero.currentPrice, value: liveCurrentPriceText, accent: true },
                  { label: t.hero.totalSupply, value: locale === 'ru' ? '9.0 млрд' : '9.0B', accent: false },
                  { label: t.hero.goldPerToken, value: locale === 'ru' ? '9,6 гр.' : '9.6 g', accent: true },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    className="cursor-default"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <p className="text-xs uppercase tracking-widest text-zinc-500">{stat.label}</p>
                    <p className={`mt-1 text-2xl font-semibold ${stat.accent ? 'text-amber-400' : ''}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <GoldMedallion />
          </div>
        </section>

        <div className="container-page section-divider" />

        {/* Stats bar – staggered number pop */}
        <section className="container-page py-12 md:py-16">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {t.stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="surface flex flex-col items-center justify-center rounded-2xl border border-white/5 px-6 py-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ type: 'spring', stiffness: 90, damping: 22, delay: i * 0.08 }}
                whileHover={{ scale: 1.03, y: -4 }}
              >
                <motion.span
                  className="text-3xl font-bold text-amber-400 md:text-4xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, damping: 18, delay: i * 0.08 + 0.1 }}
                >
                  {stat.value}
                </motion.span>
                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-zinc-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="container-page section-divider" />

        {/* Features - 3 cards with alternate slide-in */}
        <section className="container-page relative py-16 md:py-24">
          <GoldRing className="left-4 top-20 opacity-60" size={40} />
          <GoldRing className="right-8 top-1/3 opacity-40" size={32} />
          <div className="grid gap-6 md:grid-cols-3">
            {t.features.map((item, i) => (
              <motion.div
                key={item.title}
                className="surface hover-glow-border group relative overflow-hidden rounded-2xl p-6"
                initial={{ opacity: 0, x: i === 0 ? -28 : i === 1 ? 0 : 28, y: 24 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ type: 'spring', stiffness: 80, damping: 20, delay: i * 0.12 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/8 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <motion.div
                  className="relative"
                  initial={{ scale: 0.95 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 + 0.2 }}
                >
                  <span className="text-3xl text-amber-400/90">{['◆', '◇', '○'][i]}</span>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{item.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="container-page section-divider" />

        {/* Use cases – who COBA is for */}
        <section className="container-page relative py-16 md:py-24">
          <GoldParticles count={8} className="opacity-40" />
          <motion.div
            className="mb-12 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 70, damping: 22 }}
          >
            <h2 className="text-3xl font-semibold sm:text-4xl">{t.useCases.title}</h2>
            <p className="mt-4 text-zinc-400">{t.useCases.subtitle}</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.useCases.items.map((item, i) => (
              <motion.div
                key={item.title}
                className="surface hover-glow-border group relative overflow-hidden rounded-2xl p-6"
                initial={{
                  opacity: 0,
                  x: i % 4 === 0 ? -24 : i % 4 === 3 ? 24 : 0,
                  y: i % 4 === 0 || i % 4 === 3 ? 0 : 32,
                  scale: i % 2 === 1 ? 0.96 : 1,
                }}
                whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ type: 'spring', stiffness: 75, damping: 20, delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="text-2xl text-amber-400/80">{['◇', '◆', '○', '◇'][i]}</span>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="container-page section-divider" />

        {/* Token Metrics */}
        <section id="tokenomics" className="container-page relative py-16 md:py-24">
          <GoldParticles count={14} className="opacity-70" />
          <GoldHex className="top-8 right-8 md:top-12 md:right-12" size={56} />
          <GoldHex className="bottom-1/4 left-4 opacity-60" size={40} />
          <div className="pointer-events-none absolute -right-32 -top-10 hidden xl:block scale-75 opacity-70">
            <GoldOrb />
          </div>
          <motion.div
            className="mb-12 max-w-2xl"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ type: 'spring', stiffness: 70, damping: 22 }}
          >
            <h2 className="text-3xl font-semibold sm:text-4xl">{t.tokenomics.title}</h2>
            <p className="mt-4 text-zinc-400">
              {t.tokenomics.subtitle}
            </p>
          </motion.div>

          <div className="surface-strong relative overflow-hidden p-6 md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,_rgba(251,191,36,0.08),transparent_60%),radial-gradient(circle_at_right,_rgba(212,175,55,0.06),transparent_60%)]" />
            <motion.div
              className="relative hover-glow-border flex flex-col gap-2 rounded-xl border border-white/5 bg-zinc-900/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ type: 'spring', stiffness: 80, damping: 22 }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <p className="text-zinc-300">
                {t.tokenomics.goldPriceLabelBefore}
                <span className="text-amber-400">{t.tokenomics.goldPrice9}</span>
                {t.tokenomics.goldPriceLabelAfter}
              </p>
              <div className="flex flex-col items-end gap-1 sm:shrink-0 sm:items-baseline sm:gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-amber-300 sm:text-4xl">
                    {gold9_6gStatus === 'ok' && gold9_6gUsdt != null ? `$${gold9_6gUsdt.toFixed(2)}` : '—'}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      (gold24hChange ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {gold24hChange == null ? '' : gold24hChange >= 0 ? '+' : ''}
                    {gold24hChange == null ? '--' : gold24hChange.toFixed(1)}% {t.tokenomics.goldPrice24h}
                  </span>
                </div>
                {goldPriceStale && (
                  <span className="max-w-[14rem] text-right text-[10px] text-zinc-500 sm:max-w-none sm:text-xs">
                    {t.tokenomics.goldPriceCachedHint}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Token details */}
            <motion.h3
              className="relative mt-10 mb-4 text-sm font-semibold uppercase tracking-wider text-amber-400/90"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {t.tokenomics.tokenDetails}
            </motion.h3>
            <motion.div
              className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
                <p className="text-xs text-zinc-500">{t.tokenomics.maxSupply}</p>
                <p className="mt-1 font-semibold">{locale === 'ru' ? '33.0 млрд' : '33.0B'}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
                <p className="text-xs text-zinc-500">{t.tokenomics.annualEmission}</p>
                <p className="mt-1 font-semibold">{locale === 'ru' ? '9.0 млрд' : '9.0B'}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
                <p className="text-xs text-zinc-500">{t.tokenomics.decimals}</p>
                <p className="mt-1 font-semibold">3</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
                <p className="text-xs text-zinc-500">{t.tokenomics.minUnit}</p>
                <p className="mt-1 font-semibold">KOH</p>
              </div>
            </motion.div>

          </div>
        </section>

        <div className="container-page section-divider" />

        {/* Security & transparency */}
        <section className="container-page relative py-16 md:py-24">
          <GoldHex className="bottom-1/4 right-12 opacity-30" size={36} />
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 70, damping: 22 }}
          >
            <h2 className="text-3xl font-semibold sm:text-4xl">{t.security.title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">{t.security.subtitle}</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {t.security.items.map((item, i) => (
              <motion.div
                key={item.title}
                className="surface hover-glow-border relative overflow-hidden rounded-2xl border border-amber-500/10 p-8"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ type: 'spring', stiffness: 80, damping: 22, delay: i * 0.12 }}
                whileHover={{ y: -6, borderColor: 'rgba(251,191,36,0.2)' }}
              >
                <motion.span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-lg font-bold text-amber-400"
                  initial={{ rotate: -10, scale: 0.9 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 + 0.15 }}
                >
                  {i + 1}
                </motion.span>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="container-page section-divider" />

        {/* How it works – different entrance per step */}
        <section id="about" className="container-page relative py-16 md:py-24">
          <GoldParticles count={10} className="opacity-50" />
          <GoldHex className="top-1/4 right-8 opacity-50" size={48} />
          <motion.div
            className="mb-12 max-w-2xl"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 70, damping: 22 }}
          >
            <h2 className="text-3xl font-semibold sm:text-4xl">{t.about.title}</h2>
            <p className="mt-4 text-zinc-400">
              {t.about.subtitle}
            </p>
          </motion.div>

          <div className="relative">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { step: '01', title: t.about.step1Title, desc: t.about.step1Desc },
                { step: '02', title: t.about.step2Title, desc: t.about.step2Desc },
                { step: '03', title: t.about.step3Title, desc: t.about.step3Desc },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  className="surface hover-glow-border relative overflow-hidden rounded-2xl p-8"
                  initial={{
                    opacity: 0,
                    x: i === 0 ? -36 : i === 1 ? 0 : 36,
                    y: i === 1 ? 40 : 20,
                    rotate: i === 1 ? -2 : 0,
                  }}
                  whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{
                    type: 'spring',
                    stiffness: 75,
                    damping: 18,
                    delay: i * 0.1,
                  }}
                  whileHover={{ y: -10, scale: 1.02 }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent opacity-60" />
                  <span className="text-4xl font-bold text-amber-500/40">{item.step}</span>
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-zinc-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <AboutProjectText
              title={t.about.projectCardTitle}
              text={locale === 'ru' ? aboutProjectRu : aboutProjectEn}
              overviewLabel={t.about.projectOverview}
              expanded={projectExpanded}
              onToggle={() => setProjectExpanded((v) => !v)}
              moreLabel={t.about.projectMore}
              lessLabel={t.about.projectLess}
              collapsedNodes={16}
            />

            {/* Why gold-backed */}
            <motion.h3
              className="mt-16 mb-8 text-center text-lg font-semibold text-zinc-300"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {t.about.whyGold}
            </motion.h3>
            <motion.div
              className="flex flex-wrap justify-center gap-16 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-10"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 70, damping: 22 }}
              whileHover={{ borderColor: 'rgba(251,191,36,0.35)' }}
            >
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-4xl font-bold text-amber-400">5,000+</p>
                <p className="mt-1 text-sm text-zinc-400">{t.about.yearsGold}</p>
              </motion.div>
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-4xl font-bold text-amber-400">24/7</p>
                <p className="mt-1 text-sm text-zinc-400">{t.about.trading}</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <div className="container-page section-divider" />

        {/* Roadmap */}
        <section id="roadmap" className="container-page relative py-16 md:py-24">
          <GoldHex className="right-12 top-20 opacity-40" size={44} />
          <motion.div
            className="mb-12 max-w-2xl"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 70, damping: 22 }}
          >
            <h2 className="text-3xl font-semibold sm:text-4xl">{t.roadmap.title}</h2>
            <p className="mt-4 text-zinc-400">
              {t.roadmap.subtitle}
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-amber-500/30 to-transparent md:left-1/2 md:-translate-x-1/2" />
            <div className="space-y-12">
              {t.roadmap.phases.map((phase, i) => {
                const status = i === t.roadmap.phases.length - 1 ? t.roadmap.inProgress : t.roadmap.completed
                return (
                <motion.div
                  key={phase.quarter}
                  className={`relative flex flex-col gap-6 md:flex-row md:items-start ${
                    i % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <div className="ml-12 flex-1 md:ml-0 md:max-w-[45%]">
                    <motion.div
                      className="surface hover-glow-border relative overflow-hidden rounded-2xl p-6"
                      whileHover={{ y: -4 }}
                    >
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          status === t.roadmap.inProgress
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {status}
                      </span>
                      <p className="mt-3 text-sm font-semibold text-amber-400">{phase.quarter}</p>
                      <h3 className="mt-2 text-xl font-semibold">{phase.title}</h3>
                      <p className="mt-2 text-sm text-zinc-400">{phase.desc}</p>
                      <ul className="mt-4 space-y-2">
                        {phase.items.map((item, j) => (
                          <motion.li
                            key={item}
                            className="flex items-center gap-2 text-sm text-zinc-400"
                            initial={{ opacity: 0, x: -8 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 + j * 0.04 }}
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                            {item}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                  <motion.div
                    className="absolute left-4 top-6 h-4 w-4 rounded-full border-2 border-amber-500 bg-[rgb(var(--bg))] md:left-1/2 md:-translate-x-1/2"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  />
                </motion.div>
              )
              })}
            </div>

            <motion.div
              className="mt-12 rounded-2xl border border-amber-500/20 bg-amber-950/10 p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 70, damping: 22 }}
              whileHover={{ borderColor: 'rgba(251,191,36,0.35)', scale: 1.01 }}
            >
              <h3 className="text-lg font-semibold">{t.roadmap.futureTitle}</h3>
              <p className="mt-2 text-zinc-400">
                {t.roadmap.futureDesc}
              </p>
            </motion.div>
          </div>
        </section>

        <div className="container-page section-divider" />

        {/* Technology / built on */}
        <section className="container-page py-12 md:py-16">
          <motion.p
            className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-zinc-500"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t.technology.title}
          </motion.p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {t.technology.items.map((name, i) => (
              <motion.div
                key={name}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 font-medium text-zinc-400"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.1 }}
                whileHover={{ scale: 1.05, color: 'rgb(251 191 36)', borderColor: 'rgba(251,191,36,0.3)' }}
              >
                {name}
              </motion.div>
            ))}
          </div>
        </section>

        <div className="container-page section-divider" />

        {/* Final CTA – connect wallet */}
        <section className="container-page relative py-16 md:py-24">
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-amber-900/10 to-transparent p-10 md:p-16"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ type: 'spring', stiffness: 60, damping: 24 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="pointer-events-none absolute -left-28 bottom-0 hidden md:block scale-75 opacity-60">
              <GoldOrb />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(251,191,36,0.08),transparent_70%)]" />
            <div className="relative flex flex-col items-center text-center">
              <motion.h2
                className="text-2xl font-semibold sm:text-3xl md:text-4xl"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                {t.cta.title}
              </motion.h2>
              <motion.p
                className="mt-4 max-w-lg text-zinc-400"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.18 }}
              >
                {t.cta.subtitle}
              </motion.p>
              <motion.button
                type="button"
                onClick={() => open({ view: 'Connect' })}
                className="mt-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-base font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {t.cta.button}
              </motion.button>
            </div>
          </motion.div>
        </section>

        <div className="container-page section-divider" />

        {/* Contact */}
        <section id="contact" className="container-page py-16 md:py-24">
          <motion.div
            className="surface hover-glow-border flex flex-col gap-8 rounded-2xl p-8 md:flex-row md:items-center md:justify-between md:p-10"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 70, damping: 22 }}
            whileHover={{ y: -4 }}
          >
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold sm:text-3xl">{t.contact.title}</h2>
              <p className="max-w-xl text-zinc-400">
                {t.contact.subtitle}
              </p>
              <p className="font-mono text-amber-400">info@cobagold.com</p>
            </div>
            <motion.button
              type="button"
              onClick={handleContactUs}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {t.contact.cta}
            </motion.button>

            {contactMessage && (
              <p className="mt-3 text-xs text-zinc-400" aria-live="polite">
                {contactMessage}
              </p>
            )}
          </motion.div>

          {/* Newsletter */}
          <motion.div
            className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-8"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 70, damping: 22 }}
            whileHover={{ borderColor: 'rgba(255,255,255,0.15)' }}
          >
            <h3 className="text-lg font-semibold">{t.contact.newsletterTitle}</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {t.contact.newsletterSubtitle}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder={t.contact.emailPlaceholder}
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value)
                  if (subscribeStatus !== 'idle') setSubscribeStatus('idle')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubscribe()
                }}
                className="flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-amber-500/50 transition-all focus:border-amber-500/50 focus:ring-2"
              />
              <motion.button
                type="button"
                className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-400 sm:whitespace-nowrap"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubscribe}
              >
                {t.contact.subscribe}
              </motion.button>
            </div>

            <p
              className={`mt-3 text-sm ${subscribeStatus === 'error' ? 'text-red-400' : 'text-emerald-400'}`}
              aria-live="polite"
            >
              {subscribeStatus === 'idle' ? '' : subscribeMessage}
            </p>
          </motion.div>
        </section>

        {/* Footer – structure from cobagold.com */}
        <footer className="border-t border-white/5 py-12">
          <motion.div
            className="container-page"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-3 md:gap-8 lg:gap-12">
              {/* Column 1 — brand */}
              <div className="flex flex-col gap-3 md:text-left">
                <div className="flex items-center gap-2">
                  <motion.img
                    src="/coba-logo-from-pdf.png"
                    alt="COBA"
                    className="h-10 w-auto object-contain"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                  />
                  <span className="text-lg font-semibold text-white">COBA</span>
                </div>
                <p className="max-w-sm text-sm text-zinc-500">
                  {t.footer.tagline}
                </p>
                <a href="mailto:info@cobagold.com" className="font-mono text-sm text-amber-400 hover:text-amber-300 transition-colors">
                  info@cobagold.com
                </a>
              </div>

              {/* Column 2 — video (aspect matches file → no black bars) */}
              <div className="flex justify-center md:pt-1">
                <FooterAutoplayVideo src="/video-footer.mp4" />
              </div>

              {/* Column 3 — links */}
              <div className="flex flex-wrap justify-center gap-12 md:ml-auto md:justify-end md:gap-10 lg:gap-16">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t.footer.company}</p>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li><a href="#about" className="nav-link hover:text-white">{t.footer.about}</a></li>
                    <li><a href="#tokenomics" className="nav-link hover:text-white">{t.footer.tokenomics}</a></li>
                  </ul>
                </div>
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t.footer.legal}</p>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li>
                      <Link to="/privacy" className="nav-link hover:text-white">
                        {t.footer.privacy}
                      </Link>
                    </li>
                    <li><a href="#" className="nav-link hover:text-white">{t.footer.terms}</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="mt-10 text-center text-xs text-zinc-600">
              {t.footer.copyright}
            </p>
          </motion.div>
        </footer>
      </main>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            aria-label={t.scrollTop}
            className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/30 bg-[rgb(var(--bg))]/90 text-amber-400 shadow-lg backdrop-blur-sm hover:border-amber-500/50 hover:bg-amber-500/10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
