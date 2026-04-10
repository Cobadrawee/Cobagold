import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { AppKitNetwork } from '@reown/appkit-common'
import { mainnet } from 'viem/chains'

// Get project ID from https://dashboard.reown.com — required for WalletConnect QR code and wallet discovery
// Uses your .env value if present, otherwise falls back to the ID you provided.
const FALLBACK_PROJECT_ID = '29fd5495b1d67f692ad95015d9094c48'
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || FALLBACK_PROJECT_ID

const isPlaceholderProjectId =
  !import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID === 'your_project_id_here'
if (import.meta.env.DEV && isPlaceholderProjectId) {
  console.warn(
    '[COBA Connect] Using fallback WalletConnect projectId. For production, set VITE_WALLETCONNECT_PROJECT_ID in .env (get one at https://dashboard.reown.com).'
  )
}

const siteOrigin =
  import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://cobagold.com')

const metadata = {
  name: 'COBA Token',
  description: 'Gold-Backed Cryptocurrency',
  url: siteOrigin,
  icons: [`${siteOrigin}/coba-logo-from-pdf.png`],
}

// viem chains are compatible with AppKitNetwork for EVM
const networks = [mainnet] as [AppKitNetwork, ...AppKitNetwork[]]

// Wallet IDs from WalletGuide (Explorer API) – used only for exclusion to avoid duplicates
const explorerWalletIds = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
  '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX Wallet
  '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662', // Bitget Wallet
  '2fafea35bb471d22889ccb49c08d99dd0a18a37982602c33f696a5723934ba25', // Binance Web3 Wallet
  '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927', // Ledger
  '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // Safe
  '85db431492aa2e8672e93f4ea7acf10c88b97b867b0d373107af63dc4880f041', // Frontier
  '2a3c89040ac3b723a1972a33a125b1db11e258a6975d3a61252cd64e6ea5ea01', // Coin98
]

// Our own stable IDs for custom wallets – these are what AppKit sees
const walletIds = {
  metamask: 'coba-metamask',
  trust: 'coba-trust',
  binance: 'coba-binance-web3',
  coinbase: 'coba-coinbase',
  okx: 'coba-okx',
}

// Official/canonical wallet logo URLs (CDNs that allow hotlinking)
const walletImages: Record<string, string> = {
  [walletIds.metamask]: 'https://images.ctfassets.net/clixtyxoaeas/1ezuBGezqfIeifWdVtwU4c/d970d4cdf13b163efddddd5709164d2e/MetaMask-icon-Fox.svg',
  [walletIds.trust]: 'https://assets.coingecko.com/coins/images/11085/small/Trust.png',
  [walletIds.coinbase]: 'https://cdn.svgrepo.com/show/330202/coinbase.svg',
  [walletIds.okx]: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/OKX_logo.svg',
  [walletIds.binance]: 'https://cdn.svgrepo.com/show/331309/binance.svg',
}

// Custom wallets with full metadata – these define the curated top row (similar to PancakeSwap)
const customWallets = [
  {
    id: walletIds.metamask,
    name: 'MetaMask',
    image_url: walletImages[walletIds.metamask],
    homepage: 'https://metamask.io',
    mobile_link: 'https://metamask.app.link/',
    desktop_link: 'https://metamask.io',
    webapp_link: 'https://metamask.io',
  },
  {
    id: walletIds.trust,
    name: 'Trust Wallet',
    image_url: walletImages[walletIds.trust],
    homepage: 'https://trustwallet.com',
    mobile_link: 'https://link.trustwallet.com/',
    desktop_link: 'https://trustwallet.com',
    webapp_link: 'https://trustwallet.com',
  },
  {
    id: walletIds.binance,
    name: 'Binance Web3',
    image_url: walletImages[walletIds.binance],
    homepage: 'https://www.binance.com/en/web3wallet',
    mobile_link: 'https://www.binance.com/en/web3wallet',
    desktop_link: 'https://www.binance.com/en/web3wallet',
    webapp_link: 'https://www.binance.com/en/web3wallet',
  },
  {
    id: walletIds.coinbase,
    name: 'Coinbase Wallet',
    image_url: walletImages[walletIds.coinbase],
    homepage: 'https://www.coinbase.com/wallet',
    mobile_link: 'https://go.cb-w.com/',
    desktop_link: 'https://www.coinbase.com/wallet',
    webapp_link: 'https://www.coinbase.com/wallet',
  },
  {
    id: walletIds.okx,
    name: 'OKX Wallet',
    image_url: walletImages[walletIds.okx],
    homepage: 'https://www.okx.com/web3',
    mobile_link: 'https://www.okx.com/download',
    desktop_link: 'https://www.okx.com/web3',
    webapp_link: 'https://www.okx.com/web3',
  },
]

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  customWallets,
  // Prevent Explorer from showing its own tiles for these brands, so we don't get duplicates.
  excludeWalletIds: [
    explorerWalletIds[0], // MetaMask
    explorerWalletIds[1], // Trust
    explorerWalletIds[2], // Coinbase Wallet
    explorerWalletIds[3], // OKX Wallet
    explorerWalletIds[5], // Binance Web3
  ],
  enableWallets: true, // required for WalletConnect QR code when user picks a wallet
  features: {
    email: false,
    socials: false,
    allWallets: true,
    swaps: true,
    connectorTypeOrder: ['featured', 'custom', 'recommended', 'walletConnect', 'injected', 'recent', 'external'],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#f59e0b',
    '--w3m-border-radius-master': '2px',
  },
  debug: import.meta.env.DEV && !!import.meta.env.VITE_APPKIT_DEBUG, // set VITE_APPKIT_DEBUG=1 to see connection errors
})
