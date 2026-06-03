import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { mainnet } from 'viem/chains'
import { cobaGoldBackedNftAbi } from '../abi/cobaGoldBackedNft'
import { getGoldNftContractAddress, isGoldNftConfigured } from '../config/goldNft'

/** Live COBA price from mainnet contract (same source as mint page). */
export function useCobaContractPrice() {
  const address = getGoldNftContractAddress()
  const enabled = isGoldNftConfigured() && !!address

  const { data, isLoading, isError } = useReadContract({
    address,
    abi: cobaGoldBackedNftAbi,
    functionName: 'usdtForOneToken',
    chainId: mainnet.id,
    query: { enabled, refetchInterval: 60_000 },
  })

  const usdtPerToken =
    data !== undefined ? Number.parseFloat(formatUnits(data, 6)) : null

  return {
    usdtPerToken,
    isLoading: enabled && isLoading,
    isConfigured: enabled,
    isError: enabled && isError,
  }
}
