const siteOrigin =
  import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://www.cobagold.com')

/** ERC-20 metadata shown in wallets after import / wallet_watchAsset */
export const COBA_TOKEN_NAME = 'COBA drawee'
export const COBA_TOKEN_SYMBOL = 'COBA'
export const COBA_TOKEN_DECIMALS = 18
export const COBA_TOKEN_LOGO_URL = `${siteOrigin}/coba-logo-wallet-owl.png`
