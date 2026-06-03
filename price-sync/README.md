# COBA price sync (standalone repo)

Push this folder to **client GitHub** (not the website repo). Hourly job updates `usdtMicroPerGram` on the COBA contract.

## One-time setup

1. Create empty repo on client GitHub (e.g. `cobagold-price-sync`).
2. Push everything in this folder to that repo.
3. **Settings → Secrets → Actions** — add:
   - `GOLD_NFT_SYNC_PRIVATE_KEY` — **owner wallet** private key (`0x25914...` deployer). Not your dev key.
   - `GOLD_NFT_CONTRACT` — `0x59aCE07c94ef75209b65A516D33E167947941012`
   - `ETHEREUM_RPC_URL` — Alchemy/Infura mainnet URL (recommended)
   - `METALAPI_KEY` — optional
4. **Actions → Sync COBA on-chain price → Run workflow** once.

## Stop failure emails on Amin200321/Cobagold

The website repo workflow was removed. If emails continue, open any old run → **Disable workflow** on GitHub, or: GitHub → Settings → Notifications → uncheck **Actions → Send notifications for failed workflows only** (or mute that repo).

## Local test

```bash
cd price-sync
npm ci
GOLD_NFT_SYNC_PRIVATE_KEY=0x... GOLD_NFT_CONTRACT=0x59aC... npm run sync
```
