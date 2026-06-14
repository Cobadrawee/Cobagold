import { watchAsset } from 'viem/actions'
import type { WalletClient } from 'viem'

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>
}

export type WatchAssetOptions = {
  address: `0x${string}`
  symbol: string
  decimals: number
  image: string
  imageFallback?: string
}

function assetPayload(options: WatchAssetOptions, image: string) {
  return {
    type: 'ERC20' as const,
    options: {
      address: options.address,
      symbol: options.symbol,
      decimals: options.decimals,
      image,
    },
  }
}

/** EIP-747 via raw provider (MetaMask extension, some mobile wallets). */
export async function requestWatchAsset(
  provider: Eip1193Provider | undefined,
  options: WatchAssetOptions,
): Promise<boolean> {
  if (!provider?.request) return false

  const images = [options.image, options.imageFallback].filter(Boolean) as string[]

  for (const image of images) {
    const payload = assetPayload(options, image)
    try {
      const result = await provider.request({
        method: 'wallet_watchAsset',
        params: payload,
      })
      if (result === true) return true
    } catch {
      // legacy param shape
    }

    try {
      const result = await provider.request({
        method: 'wallet_watchAsset',
        params: [payload],
      })
      if (result === true) return true
    } catch {
      // try next image / provider
    }
  }

  return false
}

/** EIP-747 via viem WalletClient (WalletConnect / AppKit connected session). */
export async function requestWatchAssetViaClient(
  client: WalletClient | undefined,
  options: WatchAssetOptions,
): Promise<boolean> {
  if (!client) return false

  const images = [options.image, options.imageFallback].filter(Boolean) as string[]

  for (const image of images) {
    try {
      const ok = await watchAsset(client, assetPayload(options, image))
      if (ok) return true
    } catch {
      // try next image
    }
  }

  return false
}

export function getInjectedEthereumProvider(): Eip1193Provider | undefined {
  return (window as Window & { ethereum?: Eip1193Provider }).ethereum
}
