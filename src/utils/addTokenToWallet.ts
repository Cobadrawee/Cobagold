type Eip1193Provider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>
}

export type WatchAssetOptions = {
  address: `0x${string}`
  symbol: string
  decimals: number
  image: string
}

/** EIP-747: ask the connected wallet to track an ERC-20 (logo + symbol). */
export async function requestWatchAsset(
  provider: Eip1193Provider | undefined,
  options: WatchAssetOptions,
): Promise<boolean> {
  if (!provider?.request) return false

  const payload = {
    type: 'ERC20' as const,
    options: {
      address: options.address,
      symbol: options.symbol,
      decimals: options.decimals,
      image: options.image,
    },
  }

  try {
    const result = await provider.request({
      method: 'wallet_watchAsset',
      params: payload,
    })
    if (result === true) return true
  } catch {
    // fall through to legacy param shape
  }

  try {
    const result = await provider.request({
      method: 'wallet_watchAsset',
      params: [payload],
    })
    return result === true
  } catch {
    return false
  }
}

export function getInjectedEthereumProvider(): Eip1193Provider | undefined {
  return (window as Window & { ethereum?: Eip1193Provider }).ethereum
}
