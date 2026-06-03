const siteOrigin =
  import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://www.cobagold.com')

/** ERC-20 metadata shown in wallets after import / wallet_watchAsset */
export const COBA_TOKEN_NAME = 'COBA drawee'
export const COBA_TOKEN_SYMBOL = 'COBA'
export const COBA_TOKEN_DECIMALS = 18
/** Yellow owl on black — matches site branding; 512×512 for Etherscan + wallets */
export const COBA_TOKEN_LOGO_URL = `${siteOrigin}/coba-logo-wallet-gold.png`
