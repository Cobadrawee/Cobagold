/**
 * Sync on-chain usdtMicroPerGram from the same spot sources as the website.
 * Run locally: GOLD_NFT_SYNC_PRIVATE_KEY=0x... GOLD_NFT_CONTRACT=0x... node scripts/sync-gold-nft-price.mjs
 * Or via GitHub Actions (hourly) with repo secrets.
 */
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

const GRAMS_PER_TROY_OZ = 31.1034768

const nftAbi = parseAbi([
  'function usdtMicroPerGram() view returns (uint256)',
  'function setUsdtMicroPerGram(uint256 v)',
])

function pickUsdPerTroyOz(candidates) {
  const valid = candidates.filter((x) => typeof x === 'number' && Number.isFinite(x) && x > 0)
  if (valid.length === 0) return null
  if (valid.length === 1) return valid[0]
  const sorted = [...valid].sort((a, b) => a - b)
  if (valid.length === 2) {
    const [a, b] = sorted
    if (b / a > 1.12) return b
    return (a + b) / 2
  }
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function fetchWithRetry(url, attempts = 3) {
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

async function fetchGoldSpotUsdPerTroyOz(metalApiKey) {
  const binancePaxg = async () => {
    const res = await fetchWithRetry('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT')
    if (!res?.ok) return null
    const d = await res.json()
    const last = parseFloat(d.lastPrice ?? '')
    return Number.isFinite(last) && last > 0 ? last : null
  }

  const coinGecko = async () => {
    const res = await fetchWithRetry(
      'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold,tether-gold&vs_currencies=usd',
    )
    if (!res?.ok) return { paxg: null, xaut: null }
    const j = await res.json()
    const pax = j['pax-gold']
    const xaut = j['tether-gold']
    return {
      paxg: typeof pax?.usd === 'number' && pax.usd > 0 ? pax.usd : null,
      xaut: typeof xaut?.usd === 'number' && xaut.usd > 0 ? xaut.usd : null,
    }
  }

  const metalApi = async () => {
    if (!metalApiKey) return null
    try {
      const res = await fetch(
        `https://metalapi.com/api/v1/latest?api_key=${encodeURIComponent(metalApiKey)}&base=USD&currencies=XAU`,
      )
      if (!res.ok) return null
      const data = await res.json()
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

  const [bPx, cg, mOz] = await Promise.all([binancePaxg(), coinGecko(), metalApi()])
  const candidates = []
  if (bPx != null) candidates.push(bPx)
  if (cg.paxg != null) candidates.push(cg.paxg)
  if (cg.xaut != null) candidates.push(cg.xaut)
  if (mOz != null) candidates.push(mOz)
  return pickUsdPerTroyOz(candidates)
}

function computeUsdtMicroPerGram(usdPerTroyOz) {
  const usdPerGram = usdPerTroyOz / GRAMS_PER_TROY_OZ
  const micro = Math.round(usdPerGram * 1e6)
  if (!Number.isFinite(micro) || micro <= 0) {
    throw new Error('invalid_usdt_micro_per_gram')
  }
  return BigInt(micro)
}

function contractAddress() {
  const raw =
    process.env.GOLD_NFT_CONTRACT?.trim() ||
    process.env.VITE_GOLD_NFT_CONTRACT?.trim() ||
    ''
  return /^0x[a-fA-F0-9]{40}$/.test(raw) ? raw : null
}

async function main() {
  const pkRaw = process.env.GOLD_NFT_SYNC_PRIVATE_KEY?.trim() ?? ''
  if (!pkRaw.startsWith('0x') || pkRaw.length < 64) {
    console.error('Missing GOLD_NFT_SYNC_PRIVATE_KEY (0x + 64 hex)')
    process.exit(1)
  }

  const address = contractAddress()
  if (!address) {
    console.error('Missing GOLD_NFT_CONTRACT or VITE_GOLD_NFT_CONTRACT')
    process.exit(1)
  }

  const rpcUrl =
    process.env.ETHEREUM_RPC_URL?.trim() ||
    process.env.VITE_ETHEREUM_RPC_URL?.trim() ||
    'https://eth.llamarpc.com'

  const metalKey = process.env.VITE_METALAPI_KEY || process.env.METALAPI_KEY

  const usdPerOz = await fetchGoldSpotUsdPerTroyOz(metalKey)
  if (usdPerOz == null) {
    console.error('Could not fetch gold spot')
    process.exit(1)
  }

  const nextMicro = computeUsdtMicroPerGram(usdPerOz)

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  const current = await publicClient.readContract({
    address,
    abi: nftAbi,
    functionName: 'usdtMicroPerGram',
  })

  if (current === nextMicro) {
    console.log(JSON.stringify({ ok: true, skipped: true, usdPerTroyOz: usdPerOz, usdtMicroPerGram: nextMicro.toString() }))
    return
  }

  const account = privateKeyToAccount(pkRaw)
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(rpcUrl),
  })

  const hash = await walletClient.writeContract({
    address,
    abi: nftAbi,
    functionName: 'setUsdtMicroPerGram',
    args: [nextMicro],
  })

  console.log(
    JSON.stringify({
      ok: true,
      skipped: false,
      txHash: hash,
      usdPerTroyOz: usdPerOz,
      previousUsdtMicroPerGram: current.toString(),
      newUsdtMicroPerGram: nextMicro.toString(),
    }),
  )
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
