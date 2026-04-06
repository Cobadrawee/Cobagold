# COBA Gold NFT — full step-by-step (Trust Wallet + publish contract + connect website)

Use this document from top to bottom. **Your website is built for Ethereum mainnet and USDT on Ethereum only** (not Tron TRC20, not BSC).

---

## Part 0 — What you are using (one clear path)

| Choice | What to use |
|--------|-------------|
| **Blockchain** | **Ethereum** (mainnet) |
| **USDT** | **USDT on Ethereum** (also called **ERC-20**). In Trust Wallet, pick **Ethereum**, not Tron, not BNB. |
| **Fees** | Paid in **ETH** on Ethereum (small amount for each transaction). |
| **Wallet** | **Trust Wallet** (Ethereum network selected when you act). |

**Contract file in this project:** `contracts/src/CobaGoldBackedNFT.sol`

---

## Part 1 — Prepare Trust Wallet

1. Open **Trust Wallet** and make sure you have a wallet (recovery phrase saved safely, never share it).
2. **Switch network to Ethereum** (mainnet), not BNB Smart Chain, not Tron.
3. Copy your **Ethereum receive address** (`0x…`). You will use it as **treasury** (where USDT from sales goes) unless you use another company wallet.
4. Get **some ETH on Ethereum** in that wallet (for gas). You need it for **deploying** the contract and later for **test mints**; users who mint also need a little ETH for their own gas.
5. (Optional for testing buys) Get **USDT on Ethereum** in the same wallet — same network, **ERC-20 USDT**.

---

## Part 2 — Decide the numbers before you deploy

The contract needs **constructor** values in **this exact order**:

1. **`usdt_`** — USDT token address on **Ethereum mainnet**  
   - Commonly used address: **`0xdAC17F958D2ee523a2206206994597C13D831ec7`**  
   - **Always confirm** on [Etherscan USDT token page](https://etherscan.io/token/0xdAC17F958D2ee523a2206206994597C13D831ec7) that it is “Tether USD” on Ethereum.

2. **`treasury_`** — Address that **receives all USDT** when people mint. Usually **your Trust Wallet Ethereum address** (`0x…`).

3. **`name_`** — Collection name, e.g. `COBA Gold Share` (can include spaces in Remix quotes).

4. **`symbol_`** — Short ticker, e.g. `COBAG`.

5. **`usdtMicroPerGram_`** — Price in **micro-USDT per 1 gram** (USDT has **6 decimals**, so 1 USDT = `1_000_000` micro units).

   **Formula for one NFT:**  
   `USDT per NFT = (usdtMicroPerGram × 96) ÷ 10`  
   (that is **9.6 × USDT per gram**).

   **Examples:**
   - **100 USDT per gram** → `usdtMicroPerGram = 100_000_000`  
     → one NFT = **960 USDT**.
   - **150 USDT per gram** → `150_000_000`  
     → one NFT = **1440 USDT**.

6. **`baseURI_`** — Prefix for metadata URLs. With OpenZeppelin ERC-721 (as in this repo), **`tokenURI` is `baseURI` + the token number as text** — there is **no** automatic `.json` added.  
   - Example: base `https://www.cobagold.com/nft/metadata/` → token **1** → `https://www.cobagold.com/nft/metadata/1` (your server must return valid JSON at that URL, or put `.json` inside `baseURI` if you prefer paths like `.../metadata/1.json`).  
   - If you do not have hosting yet, you can use a **temporary** placeholder and later call **`setBaseURI`** as owner (see Part 7). The constructor **requires** a non-empty string — use a URL you control or one you will replace.

---

## Part 3 — Publish (deploy) the contract with Remix + Trust Wallet

**Remix** is a website that compiles Solidity and deploys using your wallet.

### 3.1 Open Remix

1. In a browser, open **https://remix.ethereum.org**
2. Close any tutorial popups if you want.

### 3.2 Add OpenZeppelin (needed for imports)

The contract uses OpenZeppelin libraries. In Remix:

1. In the **left file panel**, click the **“+”** or create a new workspace.
2. Remix can resolve **`@openzeppelin/contracts/...`** if the **Solidity compiler** plugin can load npm packages.  
   - Open the **Solidity Compiler** plugin (left sidebar).
   - Compiler version: select **`0.8.20`** (or any **0.8.20+** matching `^0.8.20`).
   - Enable **optimization** if you see it (optional but fine).

**If compile fails on `@openzeppelin/...` imports:**

- Use Remix **plugin manager** and search for **“OpenZeppelin”** / dependencies, **or**
- On your computer, if you have the project: run in `contracts/` folder:
  ```bash
  forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit
  forge build
  ```
  Then deploy using **Foundry** (`forge create ...`) with help from a developer — same constructor arguments as below.

### 3.3 Create the contract file

1. In Remix, under **contracts**, create file **`CobaGoldBackedNFT.sol`**.
2. **Copy the entire contents** of your project file  
   `contracts/src/CobaGoldBackedNFT.sol`  
   and paste into Remix (replace everything in the file).

### 3.4 Compile

1. Open **Solidity Compiler**.
2. Select compiler **0.8.20** (or compatible).
3. Click **Compile CobaGoldBackedNFT.sol**.
4. Fix any errors (usually missing OpenZeppelin — see 3.2).

### 3.5 Connect Trust Wallet to Remix

**On mobile (common):**

1. Open **Trust Wallet** → use the **DApp browser** (browser inside Trust Wallet).
2. Go to **https://remix.ethereum.org**
3. In Remix, go to **Deploy & Run Transactions**.
4. **Environment:** choose **“Injected Provider”** (or **WalletConnect** if Remix shows it and you prefer QR from Trust Wallet — depends on Trust/Remix version).
5. Confirm the connection in Trust Wallet when it asks.
6. Ensure the network shown is **Ethereum Mainnet**.

**On desktop:**

- If Trust Wallet offers a **browser extension**, use **Injected Provider** after unlocking Ethereum mainnet.
- Or use **WalletConnect** in Remix (if available) and connect from Trust Wallet mobile app by scanning QR.

You must see your **account address** and **Ethereum mainnet** before deploying.

### 3.6 Deploy

1. Open **Deploy & Run Transactions** (left sidebar).
2. **Contract** dropdown: select **`CobaGoldBackedNFT`**.
3. Open the **deploy** section (orange button area). You should see **constructor fields**:
   - `usdt_`
   - `treasury_`
   - `name_`
   - `symbol_`
   - `usdtMicroPerGram_`
   - `baseURI_`
4. Fill them exactly as you decided in **Part 2** (addresses `0x…`, strings in quotes if Remix asks for strings, numbers without quotes for `usdtMicroPerGram_`).
5. Click **Deploy**.
6. **Trust Wallet** will pop up — check **network = Ethereum** and **fee (ETH)** — then **Confirm**.
7. Wait until the transaction **succeeds**.

### 3.7 Save the contract address

1. In Remix, under **Deployed Contracts**, expand your new **CobaGoldBackedNFT**.
2. Copy the **contract address** (`0x…`). This is your **NFT contract address**.
3. Save it in a safe place (notes, password manager).

**You are now the “owner”** of the contract (the wallet that deployed it). Only that wallet can call owner functions like `setUsdtMicroPerGram`, `setTreasury`, `setBaseURI`.

---

## Part 4 — Verify the contract on Etherscan (recommended)

Verification lets everyone read your source code on Etherscan.

1. Open [etherscan.io](https://etherscan.io) and paste your **contract address** in the search box.
2. Go to the **Contract** tab → **Verify and Publish** (if shown).
3. Choose:
   - Compiler: **same as Remix** (e.g. **0.8.20**)
   - License: **MIT**
   - Optimization: **match Remix** (on/off and runs)
4. Paste your **flattened** source or use the **standard JSON** from Remix (Compiler tab → compilation details → **ABI** + metadata if Etherscan asks).
5. Enter **constructor arguments** exactly as deployed (Etherscan often has an **ABI-encoded constructor** tool — use Remix’s transaction details or deployment log if needed).

If this step is confusing, a developer can verify in a few minutes with the same source file and compiler settings.

---

## Part 5 — Connect the contract to your website

1. In your project root, create or edit **`.env.local`** (not committed to git if `.gitignore` includes it).
2. Add:
   ```env
   VITE_GOLD_NFT_CONTRACT=0xYourContractAddressFromPart3
   ```
3. Restart dev server (`npm run dev`) or rebuild for production (`npm run build`).

Users must use **Ethereum mainnet** + **USDT (Ethereum)** on the **Gold NFT** page.

---

## Part 6 — After deploy: metadata and image (for wallets / OpenSea)

1. Host **JSON** files so that `baseURI + id + ".json"` works (and JSON points to your **image** URL).
2. As **contract owner**, call **`setBaseURI`** with your real base URL (via Etherscan **Write Contract** after verification, or Remix **Deployed Contracts**).

---

## Part 7 — Change price or treasury later (owner only)

On **Etherscan** → your contract → **Contract** → **Write as Proxy** is not used here; use **Write Contract** for a normal contract:

- **`setUsdtMicroPerGram`** — new micro-USDT per gram (same 6-decimal logic as Part 2).
- **`setTreasury`** — new USDT receiver address.
- **`setBaseURI`** — new metadata prefix.

Connect with **the same wallet that deployed** (owner).

---

## Quick checklist

- [ ] Trust Wallet: **Ethereum mainnet**, ETH for gas  
- [ ] USDT type for users: **USDT on Ethereum (ERC-20)** only  
- [ ] Deployed `CobaGoldBackedNFT` via Remix with correct constructor  
- [ ] Saved **contract address**  
- [ ] (Recommended) Verified on Etherscan  
- [ ] Set **`VITE_GOLD_NFT_CONTRACT`** in `.env.local`  
- [ ] Real **`baseURI`** + metadata when ready  
- [ ] Legal/terms for what the NFT represents (your responsibility)

---

## If you get stuck

- **“Wrong network”** on the website → wallet must be **Ethereum**, not BSC/Tron.  
- **Compile errors in Remix** → OpenZeppelin imports; use Foundry in `contracts/` or get a developer to compile once.  
- **Deploy fails** → need more **ETH** for gas, or wrong network in Trust Wallet.  
- **USDT mint fails for users** → they need **USDT (Ethereum)** + **ETH** for gas, and they must **Approve** then **Buy** on your site.

This guide matches the contract in **`contracts/src/CobaGoldBackedNFT.sol`** and the mint page in the COBA web app.
