import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Locale } from '../translations'
import { privacyPolicyEn, privacyPolicyRu } from '../content/privacyPolicy'

export default function PrivacyPage({
  locale,
  setLocale,
}: {
  locale: Locale
  setLocale: Dispatch<SetStateAction<Locale>>
}) {
  const p = locale === 'ru' ? privacyPolicyRu : privacyPolicyEn

  useEffect(() => {
    document.title = p.documentTitle
    document.documentElement.lang = locale === 'ru' ? 'ru' : 'en'
    return () => {
      document.title = 'COBA Token - Gold-Backed Cryptocurrency'
    }
  }, [p.documentTitle, locale])

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-gold-500/12 via-transparent to-transparent blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/5 bg-[rgb(var(--bg))]/90 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 text-zinc-200 transition-colors hover:text-white"
          >
            <img
              src="/coba-logo-from-pdf.png"
              alt="COBA"
              className="h-12 w-auto object-contain"
            />
            <span className="text-lg font-semibold text-white">COBA</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocale((prev) => (prev === 'ru' ? 'en' : 'ru'))}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-gold-500/30 hover:bg-gold-500/10 hover:text-gold-300"
            >
              {locale === 'ru' ? 'RU' : 'EN'}
            </button>
            <Link
              to="/"
              className="text-sm font-medium text-gold-400 transition-colors hover:text-gold-300"
            >
              {p.backHome}
            </Link>
          </div>
        </div>
      </header>

      <main className="container-page pb-20 pt-12 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-3xl"
        >
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{p.heroTitle}</h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">{p.heroLead}</p>
          <p className="mt-3 text-sm text-zinc-500">{p.lastUpdated}</p>

          <section className="mt-12">
            <h2 className="text-xl font-semibold text-zinc-100">{p.principlesTitle}</h2>
            <p className="mt-2 text-sm text-zinc-400">{p.principlesIntro}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {p.principles.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="rounded-xl border border-white/5 bg-black/25 p-5"
                >
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gold-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mt-14 rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 md:p-8">
            <h2 className="text-xl font-semibold text-zinc-100">{p.policySectionTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">{p.policyIntro}</p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">{p.policyMeasuresIntro}</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {p.policyMeasures.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold-400/80" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-zinc-500">{p.policyDisclaimer}</p>
          </section>

          <section className="mt-14">
            <h2 className="text-xl font-semibold text-zinc-100">{p.rightsTitle}</h2>
            <p className="mt-2 text-sm text-zinc-400">{p.rightsIntro}</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {p.rightsItems.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold-400/80" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">{p.rightsContact}</p>
          </section>

          <section className="mt-14">
            <h2 className="text-xl font-semibold text-zinc-100">{p.transfersTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.transfersIntro}</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {p.transfersItems.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold-400/80" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14 border-t border-white/5 pt-12">
            <h2 className="text-xl font-semibold text-zinc-100">{p.changesTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">{p.changesBody}</p>
          </section>

          <div className="mt-12 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 px-6 py-2.5 text-sm font-medium text-gold-300 transition-colors hover:border-gold-500/60 hover:bg-gold-500/15"
            >
              {p.backHome}
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
