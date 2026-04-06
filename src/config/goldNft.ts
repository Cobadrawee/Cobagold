import { mainnet } from 'viem/chains'

/** Ethereum mainnet USDT (Tether) — verify before production */
export const MAINNET_USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as const

export function getGoldNftContractAddress(): `0x${string}` | undefined {
  const raw = import.meta.env.VITE_GOLD_NFT_CONTRACT?.trim()
  if (!raw || !/^0x[a-fA-F0-9]{40}$/.test(raw)) return undefined
  return raw as `0x${string}`
}

export function getUsdtAddressForChain(chainId: number): `0x${string}` | undefined {
  const override = import.meta.env.VITE_USDT_CONTRACT?.trim()
  if (override && /^0x[a-fA-F0-9]{40}$/.test(override)) {
    return override as `0x${string}`
  }
  if (chainId === mainnet.id) return MAINNET_USDT
  return undefined
}

export function isGoldNftConfigured(): boolean {
  return getGoldNftContractAddress() !== undefined
}
