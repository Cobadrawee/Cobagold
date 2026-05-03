# COBA Gold-backed NFT (smart contract)

**Full beginner guide (Trust Wallet, USDT type, Remix deploy, Etherscan, website):**  
→ **[NFT_PUBLISH_STEP_BY_STEP.md](./NFT_PUBLISH_STEP_BY_STEP.md)**

---

## Quick reference

- **Source:** `contracts/src/CobaGoldBackedNFT.sol`
- **Network (website):** Ethereum mainnet  
- **USDT:** USDT on Ethereum (ERC-20) — **not** TRC20, **not** BSC  
- **Mint price:** `usdtMicroPerGram × 9.6` in micro-USDT (6 decimals)
- **Supply cap:** none on-chain; `totalMinted` is informational. Policy/treasury limits apply off-chain.
- **Redeem (sell back):** `redeem(tokenId)` pays `usdtForOneNft()` at execution time, burns the NFT, and pulls USDT from `treasury` via allowance (`treasury` must approve this contract on USDT).

### After you deploy a new contract

1. Set **`VITE_GOLD_NFT_CONTRACT`** (and **`GOLD_NFT_CONTRACT`** for Actions) to the new address on Vercel / GitHub secrets, then redeploy the site / workflows.
2. **Treasury:** fund with USDT and **`approve`** the NFT contract with enough allowance so `redeem` can pay users.
3. **Price sync:** configure `GOLD_NFT_SYNC_PRIVATE_KEY` (owner wallet) and optional `METALAPI_KEY` / `VITE_METALAPI_KEY` so `scripts/sync-gold-nft-price.mjs` (or your GitHub Action) can call `setUsdtMicroPerGram`.
4. **Audits:** re-run your usual review before moving real funds — constructor args and owner key handling are your responsibility.

Example: `usdtMicroPerGram = 150_000_000` → **1440 USDT** per NFT.

## Build with Foundry (developers)

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit
forge build
```

Constructor args: `usdt_`, `treasury_`, `name_`, `symbol_`, `usdtMicroPerGram_`, `baseURI_`.

Mainnet USDT (verify on Etherscan): `0xdAC17F958D2ee523a2206206994597C13D831ec7`

## Website env

Set `VITE_GOLD_NFT_CONTRACT` in project root `.env.local` (see `.env.example`).
