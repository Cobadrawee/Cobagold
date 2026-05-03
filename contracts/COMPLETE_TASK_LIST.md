# COBA — Complete task list (do in order)

Read from **top to bottom**. Skip a step only if you already did it.

**Big picture:** You deploy a smart contract on **Ethereum**. Your website talks to that address. Users pay **USDT (Ethereum only)** to mint. To let users **sell back** (redeem), your **treasury** wallet must hold USDT and **approve** the contract. A **GitHub Action** (or a script on your PC) can update the gold price on-chain every hour.

**If you already deployed an older contract:** that old address still has **whatever rules it was deployed with**. Changing code in GitHub does **not** change Ethereum. To use the **new** contract (no on-chain mint cap, etc.), you must **deploy again** and then **point the website + secrets to the new address**.

---

## Step 1 — Things you must have ready

| You need | Why |
|----------|-----|
| **Trust Wallet** (or MetaMask) on **Ethereum mainnet** | Deploy + owner actions |
| **ETH on Ethereum** | Gas for deploy and for you to test |
| **USDT on Ethereum** (ERC-20) | Users mint with it; treasury needs it for buybacks |
| **This repo** | Source file `contracts/src/CobaGoldBackedNFT.sol` |

**USDT on Ethereum (official):** `0xdAC17F958D2ee523a2206206994597C13D831ec7` — double-check on [Etherscan](https://etherscan.io/token/0xdAC17F958D2ee523a2206206994597C13D831ec7).

---

## Step 2 — Decide the 6 constructor values (before deploy)

When you deploy, you will paste **exactly these 6 arguments** (order matters):

| # | Name | What to put |
|---|------|----------------|
| 1 | **`usdt_`** | USDT contract: `0xdAC17F958D2ee523a2206206994597C13D831ec7` (verify on Etherscan) |
| 2 | **`treasury_`** | The `0x…` address that **receives USDT** when people mint (usually your company wallet) |
| 3 | **`name_`** | NFT collection name, e.g. `COBA Gold` |
| 4 | **`symbol_`** | Short symbol, e.g. `COBAG` |
| 5 | **`usdtMicroPerGram_`** | Price in **micro-USDT per 1 gram** (1 USDT = `1_000_000` micro units). **One NFT = 9.6 × that price in USDT.** Example: `150_000_000` = $150 per gram → **$1440 per NFT** |
| 6 | **`baseURI_`** | Start of every token link. Example: `https://www.cobagold.com/nft/metadata/` → token 1 is `…/metadata/1` (your server must serve JSON there, or put `.json` in the path if you prefer) |

**Write these down** before you open Remix. You cannot “undo” wrong constructor values without deploying a **new** contract.

---

## Step 3 — Deploy the contract (Remix + wallet)

**Short path:** use Remix in the browser and your wallet on **Ethereum mainnet**.

**Long path with screenshots-style detail:** open **`NFT_PUBLISH_STEP_BY_STEP.md`** in this folder and do **Part 3** (Remix) there — it is the same contract file.

**Minimum you must do:**

1. Open **https://remix.ethereum.org**
2. Create file **`CobaGoldBackedNFT.sol`** and paste the **full** contents from  
   **`contracts/src/CobaGoldBackedNFT.sol`** in this project.
3. Fix **OpenZeppelin imports** if compile fails (Remix plugin, **or** on your computer:  
   `cd contracts && forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit && forge build` and deploy with Foundry if you know how).
4. Compiler: **0.8.24** (or any **0.8.24+** allowed by `^0.8.24`).
5. **Deploy & Run** → **Injected Provider** → network **Ethereum Mainnet**.
6. Fill the **6 constructor fields** from Step 2 → **Deploy** → confirm in wallet.
7. **Copy the deployed contract address** (`0x…`) and save it. **You are the owner** (the wallet that deployed).

---

## Step 4 — (Recommended) Verify on Etherscan

1. Go to [etherscan.io](https://etherscan.io) → paste your **contract address**.
2. **Contract** tab → **Verify and Publish**.
3. Match **compiler** and **optimization** to what you used in Remix.
4. Submit the **same source** + constructor arguments so the public can read your code.

*(If this is hard, pay a dev once — it is routine.)*

---

## Step 5 — Connect the website to your contract

Your live site (e.g. Vercel) only knows the contract if you set an environment variable.

1. Open **Vercel** → your project → **Settings** → **Environment Variables**.
2. Add **`VITE_GOLD_NFT_CONTRACT`** = your contract address from Step 3 (`0x…`).
3. Apply to **Production** (and Preview if you use it).
4. **Redeploy** the site (Deployments → … → Redeploy) so the new variable is baked into the build.

**Local testing:** in the project root, file **`.env.local`**:

```env
VITE_GOLD_NFT_CONTRACT=0xYourContractAddress
```

Then `npm run dev` and open the **Gold NFT** page.

---

## Step 6 — Treasury: so users can SELL BACK (redeem)

Minting sends USDT **from the user → treasury** (automatic).

**Redeem** pays USDT **from treasury → user** and burns the NFT. For that, **treasury must approve USDT spending** for the NFT contract.

1. Log in to **Etherscan** with the **treasury wallet** (the same `0x` you put in `treasury_`).
2. Open the **USDT** token contract → **Contract** → **Write as Proxy** or **Write Contract** (whichever USDT uses).
3. Find **`approve`**.
4. **`spender`** = your **NFT contract address**.
5. **`amount`** = a large allowance (USDT uses 6 decimals). Many teams use **max** or a very large number so you do not run out of allowance. Confirm transaction.

**Also:** treasury must actually **hold enough USDT** to pay people who redeem.

---

## Step 7 — Auto-update gold price on-chain (GitHub Actions)

The script calls **`setUsdtMicroPerGram`** as the **contract owner**. So the private key you use must be the **owner wallet** (same as deployer, unless you transferred ownership).

1. In GitHub: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Add:
   - **`GOLD_NFT_SYNC_PRIVATE_KEY`** — owner key, `0x…`, **never** put this in `VITE_*` (never in frontend).
   - **`GOLD_NFT_CONTRACT`** — **same** address as `VITE_GOLD_NFT_CONTRACT`.
3. Optional but good:
   - **`ETHEREUM_RPC_URL`** — Alchemy / Infura mainnet HTTPS URL.
   - **`METALAPI_KEY`** or **`VITE_METALAPI_KEY`** — extra gold price source.
4. Add the workflow file if it is not in the repo yet:  
   copy **`scripts/sync-gold-nft-price.workflow.yml`** to **`.github/workflows/sync-gold-nft-price.yml`** (exact path) and commit.
5. **Actions** tab → workflow **“Sync Gold NFT on-chain price”** → **Run workflow** once to test.

**Local run (optional):** see **`GITHUB_ACTIONS_SETUP.txt`** in the project root, or:

```bash
GOLD_NFT_SYNC_PRIVATE_KEY=0x... GOLD_NFT_CONTRACT=0x... npm run sync-nft-price
```

---

## Step 8 — Metadata (when you are ready)

1. Host JSON so **`baseURI` + token id** returns valid NFT metadata (image URL inside JSON).
2. As **owner**, call **`setBaseURI`** on the NFT contract (Etherscan **Write Contract** or Remix) if your first deploy used a placeholder.

---

## Step 9 — Test like a user

1. Open your live site → **Gold NFT** page.
2. Wallet on **Ethereum mainnet**.
3. **Connect** → **Approve USDT** → **Mint** (small test amount).
4. If you set up Step 6: try **Redeem** for one token and confirm USDT arrives.

---

## One-page checklist (print me)

- [ ] Step 1: Wallet + ETH + understanding (mainnet, ERC-20 USDT)
- [ ] Step 2: Wrote down all **6 constructor** values
- [ ] Step 3: **Deployed** contract, saved **address**
- [ ] Step 4: **Verified** on Etherscan *(recommended)*
- [ ] Step 5: **`VITE_GOLD_NFT_CONTRACT`** on Vercel + **redeploy**
- [ ] Step 6: Treasury **USDT balance** + **`approve`** NFT contract as spender
- [ ] Step 7: GitHub **secrets** + workflow file + **manual run** of sync
- [ ] Step 8: **`setBaseURI`** when metadata is live
- [ ] Step 9: **End-to-end test** mint (and redeem if enabled)

---

## Where to get more detail

| Topic | File |
|--------|------|
| Trust Wallet + Remix deploy (long version) | **`NFT_PUBLISH_STEP_BY_STEP.md`** |
| GitHub Actions file location / secret names | **`GITHUB_ACTIONS_SETUP.txt`** (repo root) |
| Contract behavior + dev commands | **`README.md`** in this `contracts/` folder |

If something breaks, say **which step number** and the **exact error text** (or screenshot) — that is enough to debug.
