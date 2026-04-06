// v2: invalidate caches from older logic that could show ~$573 for 9.6g (stale daily spot)
const KEY = 'coba_gold_price_v2'

export type GoldPriceCache = {
  usdt9_6g: number
  change24hPct: number | null
  updatedAt: number
}

export function readGoldPriceCache(): GoldPriceCache | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as GoldPriceCache
    if (typeof v.usdt9_6g !== 'number' || !Number.isFinite(v.usdt9_6g) || v.usdt9_6g <= 0) return null
    return v
  } catch {
    return null
  }
}

export function writeGoldPriceCache(usdt9_6g: number, change24hPct: number | null) {
  try {
    const payload: GoldPriceCache = {
      usdt9_6g,
      change24hPct,
      updatedAt: Date.now(),
    }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // quota / private mode
  }
}
