/**
 * Spot USD per troy ounce of gold — aggregated from liquid market sources so the
 * UI matches typical web / exchange quotes (~$140+/g → ~$1300+ for 9.6g), not stale
 * daily feeds that can sit far below live spot.
 */

export type FetchRetry = (url: string, attempts?: number) => Promise<Response | null>

/** How we combine multiple quotes when they disagree (stale low vs live). */
export function pickUsdPerTroyOz(candidates: number[]): number | null {
  const valid = candidates.filter((x) => typeof x === 'number' && Number.isFinite(x) && x > 0)
  if (valid.length === 0) return null
  if (valid.length === 1) return valid[0]
  const sorted = [...valid].sort((a, b) => a - b)
  if (valid.length === 2) {
    const [a, b] = sorted
    // One source often lags (e.g. daily index) — prefer the higher when spread is wide
    if (b / a > 1.12) return b
    return (a + b) / 2
  }
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

export async function fetchGoldSpotUsdPerTroyOz(
  fetchWithRetry: FetchRetry,
  metalApiKey: string | undefined,
): Promise<{ usdPerTroyOz: number; change24hPct: number | null } | null> {
  const binancePaxg = async (): Promise<{ price: number; change24h: number | null } | null> => {
    const res = await fetchWithRetry('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT')
    if (!res?.ok) return null
    const d = (await res.json()) as { lastPrice?: string; priceChangePercent?: string }
    const last = parseFloat(d.lastPrice ?? '')
    const pct = parseFloat(d.priceChangePercent ?? '')
    if (!Number.isFinite(last) || last <= 0) return null
    return {
      price: last,
      change24h: Number.isFinite(pct) ? pct : null,
    }
  }

  const coinGeckoPaxgXaut = async (): Promise<{
    paxg: number | null
    xaut: number | null
    change24h: number | null
  }> => {
    const res = await fetchWithRetry(
      'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold,tether-gold&vs_currencies=usd&include_24hr_change=true',
    )
    if (!res?.ok) return { paxg: null, xaut: null, change24h: null }
    const j = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number } | undefined>
    const pax = j['pax-gold']
    const xaut = j['tether-gold']
    const paxg = typeof pax?.usd === 'number' && pax.usd > 0 ? pax.usd : null
    const xautUsd = typeof xaut?.usd === 'number' && xaut.usd > 0 ? xaut.usd : null
    const ch =
      typeof pax?.usd_24h_change === 'number'
        ? pax.usd_24h_change
        : typeof xaut?.usd_24h_change === 'number'
          ? xaut.usd_24h_change
          : null
    return { paxg, xaut: xautUsd, change24h: ch }
  }

  const metalApi = async (): Promise<number | null> => {
    if (!metalApiKey) return null
    try {
      const res = await fetch(
        `https://metalapi.com/api/v1/latest?api_key=${encodeURIComponent(metalApiKey)}&base=USD&currencies=XAU`,
      )
      if (!res.ok) return null
      const data = (await res.json()) as { rates?: { USDXAU?: number; XAU?: number } }
      if (typeof data?.rates?.USDXAU === 'number' && data.rates.USDXAU > 0) {
        return data.rates.USDXAU
      }
      const xau = data?.rates?.XAU
      if (typeof xau === 'number' && xau > 0) return 1 / xau
      return null
    } catch {
      return null
    }
  }

  const [bPx, cg, mOz] = await Promise.all([binancePaxg(), coinGeckoPaxgXaut(), metalApi()])

  const candidates: number[] = []
  if (bPx != null) candidates.push(bPx.price)
  if (cg.paxg != null) candidates.push(cg.paxg)
  if (cg.xaut != null) candidates.push(cg.xaut)
  if (mOz != null) candidates.push(mOz)

  const usdPerTroyOz = pickUsdPerTroyOz(candidates)
  if (usdPerTroyOz == null) return null

  const change24hPct: number | null = cg.change24h ?? bPx?.change24h ?? null

  return { usdPerTroyOz, change24hPct }
}
