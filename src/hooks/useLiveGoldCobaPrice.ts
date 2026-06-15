import { useEffect, useState } from 'react'
import { readGoldPriceCache, writeGoldPriceCache } from '../utils/goldPriceCache'
import { fetchGoldSpotUsdPerTroyOz } from '../utils/goldSpotUsdPerOz'

const GRAMS_PER_TROY_OZ = 31.1034768
const GRAMS_PER_COBA = 9.6
const REFETCH_MS = 60_000

export type LiveGoldPriceStatus = 'loading' | 'ok' | 'error'

async function fetchWithRetry(url: string, attempts = 3): Promise<Response | null> {
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

/** Live COBA USDT price from gold spot (9.6 g). Refreshes ~every minute in the browser. */
export function useLiveGoldCobaPrice() {
  const [usdtPerCoba, setUsdtPerCoba] = useState<number | null>(() => readGoldPriceCache()?.usdt9_6g ?? null)
  const [change24hPct, setChange24hPct] = useState<number | null>(() => readGoldPriceCache()?.change24hPct ?? null)
  const [status, setStatus] = useState<LiveGoldPriceStatus>(() => (readGoldPriceCache() ? 'ok' : 'loading'))
  const [isStale, setIsStale] = useState(false)

  useEffect(() => {
    let cancelled = false
    const apiKey = import.meta.env.VITE_METALAPI_KEY

    const applyLive = (usdPerOunce: number, change24h: number | null) => {
      const usdt = (usdPerOunce * GRAMS_PER_COBA) / GRAMS_PER_TROY_OZ
      if (cancelled) return
      setUsdtPerCoba(usdt)
      setChange24hPct(change24h)
      setStatus('ok')
      setIsStale(false)
      writeGoldPriceCache(usdt, change24h)
    }

    const load = async () => {
      try {
        const spot = await fetchGoldSpotUsdPerTroyOz(fetchWithRetry, apiKey)
        const usdPerOunce = spot?.usdPerTroyOz ?? null
        let change24h: number | null = spot?.change24hPct ?? null

        if (usdPerOunce == null) {
          const cached = readGoldPriceCache()
          if (cached && !cancelled) {
            setUsdtPerCoba(cached.usdt9_6g)
            setChange24hPct(cached.change24hPct)
            setStatus('ok')
            setIsStale(true)
            return
          }
          if (!cancelled) {
            setUsdtPerCoba(null)
            setChange24hPct(null)
            setStatus('error')
            setIsStale(false)
          }
          return
        }

        if (change24h == null) {
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
            // optional 24h change
          }
        }

        applyLive(usdPerOunce, change24h)
      } catch {
        const cached = readGoldPriceCache()
        if (cached && !cancelled) {
          setUsdtPerCoba(cached.usdt9_6g)
          setChange24hPct(cached.change24hPct)
          setStatus('ok')
          setIsStale(true)
        } else if (!cancelled) {
          setUsdtPerCoba(null)
          setChange24hPct(null)
          setStatus('error')
          setIsStale(false)
        }
      }
    }

    void load()
    const id = window.setInterval(load, REFETCH_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return { usdtPerCoba, change24hPct, status, isStale }
}
