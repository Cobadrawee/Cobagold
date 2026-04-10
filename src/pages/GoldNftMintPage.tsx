import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { formatUnits, maxUint256 } from 'viem'
import { mainnet } from 'viem/chains'
import { useAppKit } from '@reown/appkit/react'
import type { Locale } from '../translations'
import { translations } from '../translations'
import { cobaGoldBackedNftAbi, erc20ApproveAbi } from '../abi/cobaGoldBackedNft'
import { getGoldNftContractAddress, getUsdtAddressForChain, isGoldNftConfigured } from '../config/goldNft'

export default function GoldNftMintPage({
  locale,
  setLocale,
}: {
  locale: Locale
  setLocale: Dispatch<SetStateAction<Locale>>
}) {
  const t = translations[locale].nftMint
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchPending } = useSwitchChain()
  const nftAddress = getGoldNftContractAddress()
  const usdtAddress = getUsdtAddressForChain(chainId)

  const [quantity, setQuantity] = useState(1)
  const pendingIntentRef = useRef<'approve' | 'mint' | null>(null)
  const [showMintSuccess, setShowMintSuccess] = useState(false)

  useEffect(() => {
    document.title = t.documentTitle
    document.documentElement.lang = locale === 'ru' ? 'ru' : 'en'
    return () => {
      document.title = 'COBA Token - Gold-Backed Cryptocurrency'
    }
  }, [t.documentTitle, locale])

  const enabled =
    isGoldNftConfigured() && !!nftAddress && !!address && chainId === mainnet.id && !!usdtAddress

  const { data: pricePerNft, refetch: refetchPrice } = useReadContract({
    address: nftAddress,
    abi: cobaGoldBackedNftAbi,
    functionName: 'usdtForOneNft',
    query: { enabled: !!nftAddress && chainId === mainnet.id },
  })

  const { data: totalMinted, refetch: refetchMinted } = useReadContract({
    address: nftAddress,
    abi: cobaGoldBackedNftAbi,
    functionName: 'totalMinted',
    query: { enabled: !!nftAddress && chainId === mainnet.id },
  })

  const { data: maxSupply } = useReadContract({
    address: nftAddress,
    abi: cobaGoldBackedNftAbi,
    functionName: 'MAX_SUPPLY',
    query: { enabled: !!nftAddress && chainId === mainnet.id },
  })

  const { data: maxPerTx } = useReadContract({
    address: nftAddress,
    abi: cobaGoldBackedNftAbi,
    functionName: 'MAX_MINT_PER_TX',
    query: { enabled: !!nftAddress && chainId === mainnet.id },
  })

  const { data: usdtBalance, refetch: refetchBalance } = useReadContract({
    address: usdtAddress,
    abi: erc20ApproveAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!usdtAddress && !!address },
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdtAddress,
    abi: erc20ApproveAbi,
    functionName: 'allowance',
    args: address && nftAddress ? [address, nftAddress] : undefined,
    query: { enabled: !!usdtAddress && !!address && !!nftAddress },
  })

  const maxQ = maxPerTx ? Number(maxPerTx) : 20
  const safeQty = Math.min(Math.max(1, quantity), maxQ)

  const totalCost = useMemo(() => {
    if (pricePerNft === undefined) return undefined
    return pricePerNft * BigInt(safeQty)
  }, [pricePerNft, safeQty])

  const needsApprove =
    totalCost !== undefined && allowance !== undefined ? allowance < totalCost : true

  const insufficientUsdt =
    totalCost !== undefined && usdtBalance !== undefined ? usdtBalance < totalCost : false

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (!isConfirmed || !txHash) return
    if (pendingIntentRef.current === 'mint') setShowMintSuccess(true)
    pendingIntentRef.current = null
    void refetchAllowance()
    void refetchBalance()
    void refetchMinted()
    void refetchPrice()
    reset()
  }, [isConfirmed, txHash, refetchAllowance, refetchBalance, refetchMinted, refetchPrice, reset])

  const handleApprove = () => {
    if (!nftAddress || !usdtAddress) return
    pendingIntentRef.current = 'approve'
    writeContract({
      address: usdtAddress,
      abi: erc20ApproveAbi,
      functionName: 'approve',
      args: [nftAddress, maxUint256],
    })
  }

  const handleMint = () => {
    if (!nftAddress) return
    setShowMintSuccess(false)
    pendingIntentRef.current = 'mint'
    writeContract({
      address: nftAddress,
      abi: cobaGoldBackedNftAbi,
      functionName: 'mint',
      args: [BigInt(safeQty)],
    })
  }

  const wrongNetwork = isConnected && chainId !== mainnet.id
  const configured = isGoldNftConfigured()

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-amber-500/12 via-transparent to-transparent blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/5 bg-[rgb(var(--bg))]/90 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 text-zinc-200 transition-colors hover:text-white"
          >
            <img src="/coba-logo-from-pdf.png" alt="COBA" className="h-12 w-auto object-contain" />
            <span className="text-lg font-semibold text-white">COBA</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocale((prev) => (prev === 'ru' ? 'en' : 'ru'))}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300"
            >
              {locale === 'ru' ? 'RU' : 'EN'}
            </button>
            <Link to="/" className="text-sm font-medium text-amber-400 transition-colors hover:text-amber-300">
              {t.backHome}
            </Link>
          </div>
        </div>
      </header>

      <main className="container-page pb-20 pt-12 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-lg"
        >
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">{t.subtitle}</p>

          {!configured && (
            <div className="mt-8 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-sm text-amber-200/90">
              {t.notConfigured}
            </div>
          )}

          {configured && wrongNetwork && (
            <div className="mt-8 space-y-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200/90">
              <p>{t.wrongNetwork}</p>
              <button
                type="button"
                disabled={isSwitchPending}
                onClick={() => switchChain?.({ chainId: mainnet.id })}
                className="w-full rounded-xl border border-red-400/40 bg-red-500/20 py-3 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSwitchPending ? '…' : t.switchNetwork}
              </button>
            </div>
          )}

          {configured && !wrongNetwork && (
            <>
              {!isConnected && (
                <button
                  type="button"
                  onClick={() => open({ view: 'Connect' })}
                  className="mt-8 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/25"
                >
                  {t.connect}
                </button>
              )}

              {isConnected && enabled && (
                <div className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{t.priceLabel}</p>
                    <p className="text-2xl font-semibold text-amber-400">
                      {pricePerNft !== undefined
                        ? `${formatUnits(pricePerNft, 6)} USDT`
                        : '—'}
                    </p>
                    <p className="text-xs text-zinc-500">{t.perNft}</p>
                  </div>

                  <p className="text-xs text-zinc-500">{t.gramsNote}</p>
                  <p className="text-xs text-zinc-600">{t.priceTracksSite}</p>

                  {totalMinted !== undefined && maxSupply !== undefined && (
                    <p className="text-sm text-zinc-400">
                      {t.supply}: {totalMinted.toString()} / {maxSupply.toString()}
                    </p>
                  )}

                  <label className="block">
                    <span className="text-xs font-medium text-zinc-400">{t.quantity}</span>
                    <input
                      type="number"
                      min={1}
                      max={maxQ}
                      value={safeQty}
                      onChange={(e) => {
                        setShowMintSuccess(false)
                        setQuantity(Number(e.target.value) || 1)
                      }}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-amber-500/40"
                    />
                    <span className="mt-1 block text-xs text-zinc-600">
                      {t.maxPerTx}: {maxQ}
                    </span>
                  </label>

                  <div className="flex justify-between border-t border-white/5 pt-4 text-sm">
                    <span className="text-zinc-400">{t.total}</span>
                    <span className="font-semibold text-white">
                      {totalCost !== undefined ? `${formatUnits(totalCost, 6)} USDT` : '—'}
                    </span>
                  </div>

                  {usdtBalance !== undefined && (
                    <p className="text-xs text-zinc-500">
                      {t.balance}: {formatUnits(usdtBalance, 6)} USDT
                    </p>
                  )}

                  {needsApprove && totalCost !== undefined && (
                    <p className="text-xs text-amber-200/80">{t.needApprove}</p>
                  )}

                  {!needsApprove && insufficientUsdt && (
                    <p className="text-xs text-red-300/90">{t.insufficientUsdt}</p>
                  )}

                  {needsApprove ? (
                    <button
                      type="button"
                      disabled={isPending || isConfirming || totalCost === undefined}
                      onClick={handleApprove}
                      className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 py-3.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isPending || isConfirming ? t.approving : t.approve}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        isPending ||
                        isConfirming ||
                        totalCost === undefined ||
                        insufficientUsdt
                      }
                      onClick={handleMint}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isPending || isConfirming ? t.minting : t.mint}
                    </button>
                  )}

                  {isConfirming && (
                    <p className="text-center text-xs text-zinc-500">
                      {needsApprove ? t.waitApprove : t.waitMint}
                    </p>
                  )}

                  {showMintSuccess && (
                    <p className="text-center text-sm font-medium text-emerald-400">{t.successMint}</p>
                  )}

                  {writeError && (
                    <p className="text-center text-xs text-red-400">{writeError.message.slice(0, 200)}</p>
                  )}
                </div>
              )}
            </>
          )}

          <p className="mt-10 text-xs leading-relaxed text-zinc-600">{t.disclaimer}</p>
        </motion.div>
      </main>
    </div>
  )
}
