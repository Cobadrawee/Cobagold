import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from 'wagmi'
import { formatUnits, maxUint256, parseUnits } from 'viem'
import { mainnet } from 'viem/chains'
import { useAppKit } from '@reown/appkit/react'
import type { Locale } from '../translations'
import { translations } from '../translations'
import { cobaGoldBackedNftAbi, erc20ApproveAbi } from '../abi/cobaGoldBackedNft'
import {
  COBA_TOKEN_DECIMALS,
  COBA_TOKEN_LOGO_SVG_URL,
  COBA_TOKEN_LOGO_URL,
  COBA_TOKEN_SYMBOL,
} from '../config/cobaToken'
import { getGoldNftContractAddress, getUsdtAddressForChain, isGoldNftConfigured } from '../config/goldNft'
import {
  getInjectedEthereumProvider,
  requestWatchAsset,
  requestWatchAssetViaClient,
} from '../utils/addTokenToWallet'

type NftFlowMode = 'mint' | 'redeem'
type AddTokenStatus = 'idle' | 'success' | 'error' | 'pending'

type MintReceipt = {
  cobaAmount: string
  usdtPaid: string
  pricePerCoba: string
}

export default function GoldNftMintPage({
  locale,
  setLocale,
}: {
  locale: Locale
  setLocale: Dispatch<SetStateAction<Locale>>
}) {
  const t = translations[locale].nftMint
  const { open } = useAppKit()
  const { data: walletClient } = useWalletClient()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchPending } = useSwitchChain()
  const nftAddress = getGoldNftContractAddress()
  const usdtAddress = getUsdtAddressForChain(chainId)

  const [mode, setMode] = useState<NftFlowMode>('mint')
  const [amountStr, setAmountStr] = useState('0.001')
  const pendingIntentRef = useRef<'approve' | 'mint' | 'redeem' | null>(null)
  const [showMintSuccess, setShowMintSuccess] = useState(false)
  const [showRedeemSuccess, setShowRedeemSuccess] = useState(false)
  const [isAddingToken, setIsAddingToken] = useState(false)
  const [addTokenStatus, setAddTokenStatus] = useState<AddTokenStatus>('idle')
  const [isCopyingAddress, setIsCopyingAddress] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [mintReceipt, setMintReceipt] = useState<MintReceipt | null>(null)
  const pendingMintReceiptRef = useRef<MintReceipt | null>(null)

  useEffect(() => {
    document.title = t.documentTitle
    document.documentElement.lang = locale === 'ru' ? 'ru' : 'en'
    return () => {
      document.title = 'COBA Token - Gold-Backed Cryptocurrency'
    }
  }, [t.documentTitle, locale])

  const enabled =
    isGoldNftConfigured() && !!nftAddress && !!address && chainId === mainnet.id && !!usdtAddress

  const { data: pricePerToken, refetch: refetchPrice } = useReadContract({
    address: nftAddress,
    abi: cobaGoldBackedNftAbi,
    functionName: 'usdtForOneToken',
    query: { enabled: !!nftAddress && chainId === mainnet.id },
  })

  const { data: minBuyAmount, refetch: refetchMinBuyAmount } = useReadContract({
    address: nftAddress,
    abi: cobaGoldBackedNftAbi,
    functionName: 'minBuyAmount',
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

  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: nftAddress,
    abi: erc20ApproveAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!nftAddress && !!address && chainId === mainnet.id },
  })

  const { data: treasuryAllowance, refetch: refetchTreasuryAllowance } = useReadContract({
    address: nftAddress,
    abi: cobaGoldBackedNftAbi,
    functionName: 'treasuryUsdtAllowance',
    query: { enabled: !!nftAddress && chainId === mainnet.id },
  })

  const { data: treasuryCobaBalance, refetch: refetchTreasuryCobaBalance } = useReadContract({
    address: nftAddress,
    abi: cobaGoldBackedNftAbi,
    functionName: 'treasuryCobaBalance',
    query: { enabled: !!nftAddress && chainId === mainnet.id },
  })

  const tokenAmount = useMemo(() => {
    const raw = amountStr.trim().replace(',', '.')
    if (!raw) return undefined
    try {
      const v = parseUnits(raw, 18)
      if (v <= 0n) return undefined
      return v
    } catch {
      return undefined
    }
  }, [amountStr])

  const totalCost = useMemo(() => {
    if (pricePerToken === undefined || tokenAmount === undefined) return undefined
    return (tokenAmount * pricePerToken) / 10n ** 18n
  }, [pricePerToken, tokenAmount])

  const needsApprove =
    totalCost !== undefined && allowance !== undefined ? allowance < totalCost : true

  const insufficientUsdt =
    totalCost !== undefined && usdtBalance !== undefined ? usdtBalance < totalCost : false

  const belowMinBuy =
    mode === 'mint' && tokenAmount !== undefined && minBuyAmount !== undefined ? tokenAmount < minBuyAmount : false

  const insufficientToken =
    mode === 'redeem' && tokenAmount !== undefined && tokenBalance !== undefined ? tokenBalance < tokenAmount : false

  const treasuryReady =
    totalCost !== undefined && treasuryAllowance !== undefined ? treasuryAllowance >= totalCost : false

  const insufficientTreasuryCoba =
    mode === 'mint' && tokenAmount !== undefined && treasuryCobaBalance !== undefined
      ? treasuryCobaBalance < tokenAmount
      : false

  const treasuryAllowanceLabel = useMemo(() => {
    if (treasuryAllowance === undefined) return null
    if (treasuryAllowance >= maxUint256 / 2n) return t.treasuryAllowanceUnlimited
    return `${formatUnits(treasuryAllowance, 6)} USDT`
  }, [treasuryAllowance, t.treasuryAllowanceUnlimited])

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleAddTokenToWallet = async () => {
    if (!nftAddress) return

    const asset = {
      address: nftAddress,
      symbol: COBA_TOKEN_SYMBOL,
      decimals: COBA_TOKEN_DECIMALS,
      image: COBA_TOKEN_LOGO_URL,
      imageFallback: COBA_TOKEN_LOGO_SVG_URL,
    }

    try {
      setIsAddingToken(true)
      setAddTokenStatus('pending')

      const tryAll = async () => {
        if (await requestWatchAssetViaClient(walletClient, asset)) return true
        const injected = getInjectedEthereumProvider()
        if (await requestWatchAsset(injected, asset)) return true
        return false
      }

      if (await tryAll()) {
        setAddTokenStatus('success')
        return
      }

      await new Promise((r) => window.setTimeout(r, 1200))
      if (await tryAll()) {
        setAddTokenStatus('success')
        return
      }

      setAddTokenStatus('error')
    } catch {
      setAddTokenStatus('error')
    } finally {
      setIsAddingToken(false)
    }
  }

  const handleCopyTokenAddress = async () => {
    if (!nftAddress || !navigator?.clipboard) return
    try {
      setIsCopyingAddress(true)
      await navigator.clipboard.writeText(nftAddress)
      setCopiedAddress(true)
      window.setTimeout(() => setCopiedAddress(false), 2200)
    } finally {
      setIsCopyingAddress(false)
    }
  }

  useEffect(() => {
    if (!isConfirmed || !txHash) return
    const intent = pendingIntentRef.current
    if (intent === 'mint') {
      setMintReceipt(pendingMintReceiptRef.current)
      setShowMintSuccess(true)
      window.setTimeout(() => {
        void handleAddTokenToWallet()
      }, 400)
    }
    if (intent === 'redeem') setShowRedeemSuccess(true)
    pendingIntentRef.current = null
    void refetchAllowance()
    void refetchBalance()
    void refetchTokenBalance()
    void refetchPrice()
    void refetchTreasuryAllowance()
    void refetchTreasuryCobaBalance()
    void refetchMinBuyAmount()
    reset()
  }, [
    isConfirmed,
    txHash,
    refetchAllowance,
    refetchBalance,
    refetchTokenBalance,
    refetchPrice,
    refetchTreasuryAllowance,
    refetchTreasuryCobaBalance,
    refetchMinBuyAmount,
    reset,
  ])

  useEffect(() => {
    setShowMintSuccess(false)
    setShowRedeemSuccess(false)
    setAddTokenStatus('idle')
    setCopiedAddress(false)
    pendingIntentRef.current = null
    reset()
  }, [mode, reset])

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
    if (!nftAddress || tokenAmount === undefined) return
    setShowMintSuccess(false)
    setMintReceipt(null)
    setAddTokenStatus('idle')
    setCopiedAddress(false)
    if (totalCost !== undefined && pricePerToken !== undefined) {
      pendingMintReceiptRef.current = {
        cobaAmount: amountStr.trim() || formatUnits(tokenAmount, 18),
        usdtPaid: formatUnits(totalCost, 6),
        pricePerCoba: formatUnits(pricePerToken, 6),
      }
    } else {
      pendingMintReceiptRef.current = null
    }
    pendingIntentRef.current = 'mint'
    writeContract({
      address: nftAddress,
      abi: cobaGoldBackedNftAbi,
      functionName: 'buy',
      args: [tokenAmount],
    })
  }

  const handleRedeem = () => {
    if (!nftAddress || tokenAmount === undefined) return
    setShowRedeemSuccess(false)
    pendingIntentRef.current = 'redeem'
    writeContract({
      address: nftAddress,
      abi: cobaGoldBackedNftAbi,
      functionName: 'redeem',
      args: [tokenAmount],
    })
  }

  const holdingsUsdtValue = useMemo(() => {
    if (tokenBalance === undefined || pricePerToken === undefined || tokenBalance <= 0n) return null
    const micro = (tokenBalance * pricePerToken) / 10n ** 18n
    return formatUnits(micro, 6)
  }, [tokenBalance, pricePerToken])

  const wrongNetwork = isConnected && chainId !== mainnet.id
  const configured = isGoldNftConfigured()

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
            <img src="/coba-logo-wallet-gold.png" alt="COBA" className="h-12 w-12 rounded-full object-cover" />
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
            <Link to="/" className="text-sm font-medium text-gold-400 transition-colors hover:text-gold-300">
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
          <h1 className="text-3xl font-semibold tracking-tight text-gold-400 sm:text-4xl">{t.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">{t.subtitle}</p>

          {!configured && (
            <div className="mt-8 rounded-2xl border border-gold-500/25 bg-gold-500/10 p-5 text-sm text-gold-200/90">
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
                  className="mt-8 w-full rounded-xl border border-[#146B54] bg-[#0B513F] py-3.5 text-sm font-semibold text-[#09CF91] shadow-lg shadow-[0_12px_28px_rgba(11,81,63,0.35)]"
                >
                  {t.connect}
                </button>
              )}

              {isConnected && enabled && (
                <div className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
                  <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
                    <button
                      type="button"
                      onClick={() => setMode('mint')}
                      className={`flex-1 whitespace-pre-line rounded-lg py-2 text-xs font-semibold leading-tight transition-colors ${
                        mode === 'mint' ? 'bg-[#0B513F] text-[#09CF91]' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t.modeMint}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('redeem')}
                      className={`flex-1 whitespace-pre-line rounded-lg py-2 text-xs font-semibold leading-tight transition-colors ${
                        mode === 'redeem' ? 'bg-[#0B513F] text-[#09CF91]' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t.modeRedeem}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{t.priceLabel}</p>
                    <p className="text-2xl font-semibold text-gold-400">
                      {pricePerToken !== undefined
                        ? `${formatUnits(pricePerToken, 6)} USDT`
                        : '—'}
                    </p>
                    <p className="text-xs text-zinc-500">{t.perNft}</p>
                  </div>

                  <p className="text-xs text-zinc-500">{t.gramsNote}</p>

                  {mode === 'mint' && (
                    <>
                      <label className="block">
                        <span className="text-xs font-medium text-zinc-400">{t.quantity}</span>
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={amountStr}
                          onChange={(e) => {
                            setShowMintSuccess(false)
                            setAmountStr(e.target.value)
                          }}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-gold-500/40"
                        />
                        {minBuyAmount !== undefined && (
                          <span className="mt-1 block text-xs text-zinc-500">
                            {t.minAmount}: {formatUnits(minBuyAmount, 18)}
                          </span>
                        )}
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

                      {tokenBalance !== undefined && tokenBalance > 0n && (
                        <p className="text-xs text-zinc-500">
                          {t.tokenBalance}: {formatUnits(tokenBalance, 18)} COBA
                          {holdingsUsdtValue != null && (
                            <span className="text-gold-300/90">
                              {' '}
                              (≈ {holdingsUsdtValue} USDT)
                            </span>
                          )}
                        </p>
                      )}

                      {treasuryCobaBalance !== undefined && (
                        <p className="text-xs text-zinc-500">
                          {t.treasuryCobaInventory}: {formatUnits(treasuryCobaBalance, 18)} COBA
                        </p>
                      )}

                      {needsApprove && totalCost !== undefined && (
                        <p className="text-xs text-gold-200/80">{t.needApprove}</p>
                      )}

                      {!needsApprove && insufficientUsdt && (
                        <p className="text-xs text-red-300/90">{t.insufficientUsdt}</p>
                      )}
                      {belowMinBuy && (
                        <p className="text-xs text-red-300/90">{t.minAmountError}</p>
                      )}
                      {insufficientTreasuryCoba && (
                        <p className="text-xs text-red-300/90">{t.insufficientTreasuryCoba}</p>
                      )}

                      {needsApprove ? (
                        <button
                          type="button"
                          disabled={isPending || isConfirming || totalCost === undefined}
                          onClick={handleApprove}
                          className="w-full rounded-xl border border-[#146B54] bg-[#0B513F] py-3.5 text-sm font-semibold text-[#09CF91] transition-colors hover:bg-[#0F614B] disabled:cursor-not-allowed disabled:opacity-40"
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
                            insufficientUsdt ||
                            belowMinBuy ||
                            insufficientTreasuryCoba
                          }
                          onClick={handleMint}
                          className="w-full rounded-xl border border-[#146B54] bg-[#0B513F] py-3.5 text-sm font-semibold text-[#09CF91] shadow-lg shadow-[0_12px_28px_rgba(11,81,63,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isPending || isConfirming ? t.minting : t.mint}
                        </button>
                      )}
                    </>
                  )}

                  {mode === 'redeem' && (
                    <>
                      <label className="block">
                        <span className="text-xs font-medium text-zinc-400">{t.amount}</span>
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={amountStr}
                          onChange={(e) => {
                            setShowRedeemSuccess(false)
                            setAmountStr(e.target.value)
                          }}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-gold-500/40"
                        />
                        {tokenAmount === undefined && amountStr.trim() !== '' && (
                          <span className="mt-1 block text-xs text-red-300/90">{t.invalidAmount}</span>
                        )}
                      </label>

                      <div className="flex justify-between border-t border-white/5 pt-4 text-sm">
                        <span className="text-zinc-400">{t.redeemPayout}</span>
                        <span className="font-semibold text-white">
                          {totalCost !== undefined ? `${formatUnits(totalCost, 6)} USDT` : '—'}
                        </span>
                      </div>

                      {tokenBalance !== undefined && (
                        <p className="text-xs text-zinc-500">
                          {t.tokenBalance}: {formatUnits(tokenBalance, 18)} COBA
                          {holdingsUsdtValue != null && (
                            <span className="text-gold-300/90">
                              {' '}
                              ({t.holdingsValue}: ≈ {holdingsUsdtValue} USDT)
                            </span>
                          )}
                        </p>
                      )}

                      <p className="text-xs text-zinc-600">{t.treasuryLiquidity}</p>

                      {treasuryAllowance !== undefined && totalCost !== undefined && (
                        <p className="text-xs text-zinc-500">
                          <span className="block">{t.treasuryAllowance}</span>
                          <span className="mt-1 block break-all font-mono text-[11px] text-zinc-400">
                            {treasuryAllowanceLabel ?? '—'}
                          </span>
                        </p>
                      )}

                      {!treasuryReady && totalCost !== undefined && treasuryAllowance !== undefined && (
                        <p className="text-xs text-red-300/90">{t.treasuryAllowanceTooLow}</p>
                      )}
                      {insufficientToken && (
                        <p className="text-xs text-red-300/90">{t.insufficientToken}</p>
                      )}
                      <button
                        type="button"
                        disabled={
                          isPending ||
                          isConfirming ||
                          tokenAmount === undefined ||
                          insufficientToken ||
                          !treasuryReady
                        }
                        onClick={handleRedeem}
                        className="w-full rounded-xl border border-[#146B54] bg-[#0B513F] py-3.5 text-sm font-semibold text-[#09CF91] shadow-lg shadow-[0_12px_28px_rgba(11,81,63,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isPending || isConfirming ? t.redeeming : t.redeem}
                      </button>
                    </>
                  )}

                  {isConfirming && (
                    <p className="text-center text-xs text-zinc-500">
                      {mode === 'mint' ? (needsApprove ? t.waitApprove : t.waitMint) : t.waitRedeem}
                    </p>
                  )}

                  {showMintSuccess && (
                    <div className="space-y-3 text-center">
                      <p className="text-sm font-medium text-emerald-400">{t.successMint}</p>
                      {mintReceipt && (
                        <div className="mx-auto w-full max-w-sm rounded-xl border border-gold-500/25 bg-gold-500/10 p-4 text-left">
                          <div className="flex items-center gap-3">
                            <img
                              src="/coba-logo-wallet-gold.png"
                              alt="COBA"
                              className="h-12 w-12 shrink-0 rounded-full object-cover"
                            />
                            <p className="text-sm font-semibold text-gold-200">{t.purchaseReceiptTitle}</p>
                          </div>
                          <dl className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                              <dt className="text-zinc-400">{t.purchaseReceiptReceived}</dt>
                              <dd className="font-semibold text-white">{mintReceipt.cobaAmount} COBA</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                              <dt className="text-zinc-400">{t.purchaseReceiptPaid}</dt>
                              <dd className="font-semibold text-white">{mintReceipt.usdtPaid} USDT</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                              <dt className="text-zinc-400">{t.purchaseReceiptRate}</dt>
                              <dd className="font-semibold text-gold-300">{mintReceipt.pricePerCoba} USDT</dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-2">
                              <dt className="text-zinc-300">{t.purchaseReceiptValue}</dt>
                              <dd className="text-lg font-bold text-gold-300">{mintReceipt.usdtPaid} USDT</dd>
                            </div>
                          </dl>
                        </div>
                      )}
                      {(addTokenStatus === 'pending' || isAddingToken) && (
                        <div className="mx-auto w-full max-w-sm rounded-xl border border-gold-400/40 bg-gold-500/15 px-4 py-3">
                          <p className="text-sm font-semibold text-gold-100">{t.addTokenWalletPopup}</p>
                          <p className="mt-1 text-xs text-gold-200/80">{t.addTokenPrompt}</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleAddTokenToWallet()}
                        disabled={isAddingToken}
                        className="mx-auto inline-flex rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isAddingToken ? t.addingToken : t.addTokenToWallet}
                      </button>
                      {addTokenStatus === 'success' && (
                        <p className="text-xs text-emerald-300">{t.addTokenSuccess}</p>
                      )}
                      {addTokenStatus === 'error' && (
                        <p className="text-xs text-red-300/90">{t.addTokenError}</p>
                      )}
                      <div className="mx-auto w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left">
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">{t.tokenContractLabel}</p>
                        <p className="mt-1 break-all font-mono text-xs text-zinc-300">{nftAddress}</p>
                        <button
                          type="button"
                          onClick={() => void handleCopyTokenAddress()}
                          disabled={isCopyingAddress}
                          className="mt-2 inline-flex rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {copiedAddress ? t.tokenAddressCopied : t.copyTokenAddress}
                        </button>
                      </div>
                      <p className="text-[11px] leading-relaxed text-zinc-500">{t.manualImportHint}</p>
                    </div>
                  )}

                  {showRedeemSuccess && (
                    <p className="text-center text-sm font-medium text-emerald-400">{t.successRedeem}</p>
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
