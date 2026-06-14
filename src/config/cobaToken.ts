const siteOrigin =
  import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://www.cobagold.com')

/** ERC-20 metadata shown in wallets after import / wallet_watchAsset */
export const COBA_TOKEN_NAME = 'COBA drawee'
export const COBA_TOKEN_SYMBOL = 'COBA'
export const COBA_TOKEN_DECIMALS = 18
/** Yellow owl on black — 512×512 for Etherscan + wallet_watchAsset */
export const COBA_TOKEN_LOGO_URL = `${siteOrigin}/coba-logo-wallet-gold.png`
/** 32×32 SVG for Etherscan tokenupdate form */
export const COBA_TOKEN_LOGO_SVG_URL = `${siteOrigin}/coba-icon.svg`
