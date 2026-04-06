# COBA Gold-backed NFT (smart contract)

**Full beginner guide (Trust Wallet, USDT type, Remix deploy, Etherscan, website):**  
→ **[NFT_PUBLISH_STEP_BY_STEP.md](./NFT_PUBLISH_STEP_BY_STEP.md)**

---

## Quick reference

- **Source:** `src/CobaGoldBackedNFT.sol`
- **Network (website):** Ethereum mainnet  
- **USDT:** USDT on Ethereum (ERC-20) — **not** TRC20, **not** BSC  
- **Mint price:** `usdtMicroPerGram × 9.6` in micro-USDT (6 decimals)

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
