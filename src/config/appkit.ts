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
  (typeof window !== 'undefined' ? window.location.origin : 'https://www.cobagold.com')

// dApp icon in wallet modals: same gold medallion as the site hero (PDF outline was too faint).
const metadata = {
  name: 'COBA Token',
  description: 'Gold-Backed Cryptocurrency',
  url: siteOrigin,
  icons: [`${siteOrigin}/coba-hero-medallion.png`],
}

// viem chains are compatible with AppKitNetwork for EVM
const networks = [mainnet] as [AppKitNetwork, ...AppKitNetwork[]]

// Wallet IDs from Reown WalletGuide (Explorer API).
const explorerWalletIds = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
  '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX Wallet
]

const customWallets = [
  {
    id: 'coba-coinbase',
    name: 'Coinbase Wallet',
    image_url: 'https://cdn.svgrepo.com/show/330202/coinbase.svg',
    homepage: 'https://www.coinbase.com/wallet',
    mobile_link: 'cbwallet://',
    // Avoid broken desktop/web redirects; keep only mobile deep-link + QR handoff.
    desktop_link: null,
    webapp_link: null,
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
  // Show popular wallets as first-class choices using official WalletGuide entries.
  featuredWalletIds: [
    explorerWalletIds[0], // MetaMask
    explorerWalletIds[1], // Trust Wallet
    explorerWalletIds[3], // OKX Wallet
  ],
  // Hide WalletGuide Coinbase entry ("Base") and show our explicit Coinbase Wallet tile instead.
  excludeWalletIds: [explorerWalletIds[2]],
  // Avoid duplicate/renamed Coinbase SDK tile ("Base") in the list.
  enableCoinbase: false,
  // "Browser" path relies on injected extensions and often shows "Not detected" for most users.
  // We keep WalletConnect (QR/mobile) as the reliable flow across wallets.
  enableInjected: false,
  enableWallets: true, // required for WalletConnect QR code when user picks a wallet
  features: {
    email: false,
    socials: false,
    allWallets: true,
    swaps: true,
    connectMethodsOrder: ['wallet'],
    connectorTypeOrder: ['featured', 'custom', 'recommended', 'walletConnect', 'injected', 'recent', 'external'],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#a38242',
    '--w3m-border-radius-master': '2px',
  },
  debug: import.meta.env.DEV && !!import.meta.env.VITE_APPKIT_DEBUG, // set VITE_APPKIT_DEBUG=1 to see connection errors
})
