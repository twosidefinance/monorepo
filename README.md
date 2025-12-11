<div align="center">
  <img src="apps\web\public\favicon-96x96.png" alt="Twoside Logo" width="96" height="96">
  
  # Twoside
  
  **Transform any token into a tradeable derivative**
  
  Lock tokens, mint 1:1 liquid-locked tokens, and unlock new DeFi opportunities without selling holdings.
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?logo=ethereum&logoColor=white)](https://etherscan.io/address/0xd81945ce1f5df00418a9029f3a1c6acd688f6e8a)
  [![Base](https://img.shields.io/badge/Base-0052FF?logo=coinbase&logoColor=white)](https://basescan.org/address/0xd81945ce1f5df00418a9029f3a1c6acd688f6e8a)

**Follow us on X (Twitter):** [![X](https://img.shields.io/badge/TwosideFinance-000000?style=flat&logo=x&logoColor=white)](https://x.com/TwosideFinance)

</div>

---

## 👥 Team

<div align="center">

<div align="center" style="display: flex; justify-content: center; gap: 40px; flex-wrap: wrap;">
  <table>
    <tr>
      <td align="center" style="border: none;">
        <img src="https://github.com/antpoolerjr.png" width="120px"/><br />
        <sub><b>Anthony Pooler (Founder)</b></sub><br />
        <a href="https://github.com/antpoolerjr">
          <img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white"/>
        </a>
        <a href="https://www.linkedin.com/in/anthony-pooler-27a842b5/">
          <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white"/>
        </a>
      </td>
      <td width="40px"></td>
      <td align="center" style="border: none;">
        <img src="https://github.com/bhivgadearav.png" width="120px"/><br />
        <sub><b>Arav Bhivgade (Developer)</b></sub><br />
        <a href="https://github.com/bhivgadearav">
          <img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white"/>
        </a>
        <a href="https://www.linkedin.com/in/aravbhivgade/">
          <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white"/>
        </a>
      </td>
    </tr>
  </table>
</div>

</div>

---

## 🛠️ Tech Stack

<div align="center">
  
  ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
  ![Foundry](https://img.shields.io/badge/Foundry-000000?style=for-the-badge&logo=ethereum&logoColor=white)
  ![Wagmi](https://img.shields.io/badge/Wagmi-1C1B1B?style=for-the-badge&logo=ethereum&logoColor=white)
  ![Viem](https://img.shields.io/badge/Viem-646CFF?style=for-the-badge&logo=ethereum&logoColor=white)
  ![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-4E5EE4?style=for-the-badge&logo=openzeppelin&logoColor=white)
  ![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)
  ![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
  
</div>

---

## 📖 Table of Contents

- [Introduction](#-introduction)
- [Deployed Contracts](#-deployed-contracts)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Smart Contract Behavior](#-smart-contract-behavior)
- [Smart Contract ABIs](#-smart-contract-abis)
- [Quickstart (Dev)](#-quickstart-dev)
- [Testing Guide](#-testing-guide)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Introduction

Twoside enables users to lock ERC-20 tokens into the protocol and receive fully liquid, 1:1 derivative tokens (liquid-locked tokens). These derivatives let holders access DeFi strategies (swap, farm, borrow, etc.) while still maintaining economic exposure to the locked asset.

**Key Features:**

- 🔒 Lock any ERC-20 token
- 💧 Receive liquid derivative tokens (1:1 ratio minus 0.5% fee)
- 🔓 Unlock anytime by burning derivative tokens
- 🌐 Deployed on Ethereum and Base with identical code

---

## 🚀 Deployed Contracts

The Twoside protocol is deployed on both **Ethereum** and **Base** networks using upgradeable proxy patterns:

### Ethereum Mainnet

| Contract           | Address                                      | Explorer                                                                                     |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Proxy**          | `0xd81945ce1f5df00418a9029f3a1c6acd688f6e8a` | [View on Etherscan](https://etherscan.io/address/0xd81945ce1f5df00418a9029f3a1c6acd688f6e8a) |
| **Implementation** | `0x0988ea0c630ea86cdde34a236f7d49913fdbd477` | [View on Etherscan](https://etherscan.io/address/0x0988ea0c630ea86cdde34a236f7d49913fdbd477) |

### Base Mainnet

| Contract           | Address                                      | Explorer                                                                                    |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Proxy**          | `0xd81945ce1f5df00418a9029f3a1c6acd688f6e8a` | [View on BaseScan](https://basescan.org/address/0xd81945ce1f5df00418a9029f3a1c6acd688f6e8a) |
| **Implementation** | `0x0988ea0c630ea86cdde34a236f7d49913fdbd477` | [View on BaseScan](https://basescan.org/address/0x0988ea0c630ea86cdde34a236f7d49913fdbd477) |

> **Note:** Both networks use the same contract addresses and identical code.

---

## 📁 Project Structure

```
/monorepo
├─ .husky/                  # Git hooks
├─ .turbo/                  # Turborepo cache/internals
├─ .vscode/                 # Workspace editor settings
├─ apps/
│  └─ web/                  # Next.js + TypeScript frontend/dApp
├─ contracts/
│  ├─ base/                 # Base network contract + Foundry project
│  ├─ ethereum/             # Ethereum contract + Foundry project
│  └─ solana/               # Solana Program (Anchor Project)
├─ packages/
│  ├─ eslint-config/        # ESLint shareable config
│  └─ typescript-config/    # TS config packages & shared types
├─ node_modules/
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
└─ README.md
```

Each folder is focused: `apps/web` is your dApp, `contracts` holds all on-chain code (Foundry-based for EVM), and `packages` stores shared config/util types used by both web and contracts.

---

## 🏗️ Architecture

### Website

- **Framework:** Next.js + TypeScript
- **Wallet & Blockchain:** `wagmi`, `viem`, `ethers.js`
- **Purpose:** User interface for locking/unlocking tokens, viewing positions, initiating transactions, and displaying on-chain state (balances, supply of liquid tokens)
- **Features:** Modern React hooks via `wagmi` and `viem` for seamless blockchain interactions

### Ethereum & EVM Contracts

- **Language & Tooling:** Solidity — developed & tested with Foundry (Forge)
- **Libraries:** OpenZeppelin contracts for ERC-20, access control, upgradeability patterns, and Clones
- **Pattern:** Upgradeable proxy pattern for protocol upgrades; derivative tokens deployed via OpenZeppelin Clones for gas efficiency

---

## 🔐 Smart Contract Behavior

### Lock Function

When a user locks tokens:

1. **Approval Required:** User must approve the lock amount to the Twoside contract
2. **Transfer:** Contract transfers tokens from user to itself
3. **Fee Deduction:** 0.5% fee is automatically deducted from the locked amount
4. **Derivative Minting:** Mints derivative tokens equal to `amount - fees` (1:1 ratio)
5. **First-Time Lock:** If this is the first time a token is locked:
   - Deploys a new derivative token contract using OpenZeppelin Clones
   - Clones a modified ERC-20 implementation with configurable decimals
   - Naming convention:
     - **Name:** "Liquid " + original token name
     - **Symbol:** "li" + original token symbol
     - **Decimals:** Exactly same as original token

### Unlock Function

When a user unlocks tokens:

1. **Approval Required:** User must approve the derivative token amount to the Twoside contract
2. **Transfer:** Contract transfers derivative tokens from user to itself
3. **Burn:** Derivative tokens are burned
4. **Fee Deduction:** 0.5% fee is deducted from the underlying token amount (not derivative amount)
5. **Transfer Back:** Remaining underlying tokens are sent back to the user

> **Note:** Fees are always taken from the underlying token, not the derivative.

---

## 📄 Smart Contract ABIs

### Interface (Solidity)

```solidity
interface ITwoside {
    function lock(address _token, uint256 _amount) external;
    function unlock(address _token, uint256 _amount) external;
}
```

### Minimal ABI (JSON)

```json
[
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "lock",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_token", "type": "address" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "unlock",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

### Full ABI

For the complete ABI, see: [`contracts/ethereum/src/interfaces/ITwoside.sol`](https://github.com/Buff-Cat-DeFi-Protocol/monorepo/blob/main/contracts/ethereum/src/interfaces/ITwoside.sol)

---

## 🚀 Quickstart (Dev)

### 1. Install Website Dependencies

```bash
pnpm install
```

### 2. Install Solidity Dependencies

#### Install Foundry

Follow the official [Foundry installation guide](https://book.getfoundry.sh/getting-started/installation).

#### Ethereum Contracts

```bash
cd contracts/ethereum
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts@v5.5.0
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@v5.5.0
```

#### Base Contracts

```bash
cd contracts/base
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts@v5.5.0
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@v5.5.0
```

### 4. Run Frontend Development Server

```bash
cd apps/web
pnpm dev
```

Or from the root:

```bash
pnpm --filter @twoside/web dev
```

### 5. Build Contracts

```bash
cd contracts/ethereum  # or contracts/base
forge build
```

---

## 🧪 Testing Guide

### Ethereum Contracts

#### 1. Start Local Node

```bash
anvil --chain-id 1
```

#### 2. Deploy Contracts

```bash
cd contracts/ethereum/test/script
./deployment.sh
```

Note the deployed contract address from logs, for example:

```
TwosideUpgradeable deployed at: 0xA15BB66138824a1c7167f5E85b957d04Dd34E468
```

#### 3. Configure Website

Set the contract address in [`apps/web/src/lib/envVariables.ts`](https://github.com/Buff-Cat-DeFi-Protocol/monorepo/blob/main/apps/web/src/lib/envVariables.ts) for both Ethereum and Base.

#### 4. Configure Local Tokens

In [`apps/web/src/features/dashboard/services/query/tokens.ts`](https://github.com/Buff-Cat-DeFi-Protocol/monorepo/blob/main/apps/web/src/features/dashboard/services/query/tokens.ts), add (token contract addresses may differ for you, edit them from script logs):

```typescript
const localTokens: CoinGeckoTokenType[] = [
  {
    chainId: 1,
    address: "0xb19b36b1456E65E3A6D514D3F715f204BD59f431",
    name: "Token 1",
    symbol: "T1",
    decimals: 18,
    logoURI: "/token-placeholder.png",
  },
  {
    chainId: 1,
    address: "0xeD1DB453C3156Ff3155a97AD217b3087D5Dc5f6E",
    name: "Token 2",
    symbol: "T2",
    decimals: 18,
    logoURI: "/token-placeholder.png",
  },
  {
    chainId: 1,
    address: "0x82Dc47734901ee7d4f4232f398752cB9Dd5dACcC",
    name: "Token 3",
    symbol: "T3",
    decimals: 18,
    logoURI: "/token-placeholder.png",
  },
  {
    chainId: 1,
    address: "0x05B4CB126885fb10464fdD12666FEb25E2563B76",
    name: "Token 4",
    symbol: "T4",
    decimals: 18,
    logoURI: "/token-placeholder.png",
  },
  {
    chainId: 1,
    address: "0xc6B8FBF96CF7bbE45576417EC2163AcecFA88ECC",
    name: "Token 5",
    symbol: "T5",
    decimals: 18,
    logoURI: "/token-placeholder.png",
  },
];
```

Add at the top of `getTokensList`:

```typescript
if (blockchain.id == "eth") return localTokens;
```

#### 5. Configure MetaMask

Import the following addresses from [`contracts/ethereum/test/script/.env.development`](https://github.com/Buff-Cat-DeFi-Protocol/monorepo/blob/main/contracts/ethereum/test/script/.env.development):

- `NEW_USER_PUBLIC_KEY`
- `USER1_PUBLIC_KEY`
- `USER2_PUBLIC_KEY`

Manually import the test tokens using the addresses from step 4.

#### 6. Add Local RPC

Add the local Anvil RPC URL to MetaMask:

```
http://127.0.0.1:8545
```

#### 7. Start Website

```bash
cd apps/web
pnpm run dev
```

Now you can test the Solidity contracts on your local machine with the website interface.

#### 8. Run Unit Tests (Optional)

To test contracts without the website:

```bash
cd contracts/ethereum
forge test
```

Unit tests are located in [`contracts/ethereum/test`](https://github.com/Buff-Cat-DeFi-Protocol/monorepo/tree/main/contracts/ethereum/test). You can modify existing tests or add new test cases.

### Website Testing

There are currently no automated tests for the website. Testing should be done manually through the UI.

---

## 🤝 Contributing

- Follow repository linting and formatting rules (see `packages/eslint-config` and workspace `tsconfig`)
- Create feature branches and open PRs with clear descriptions and tests
- Run `pnpm turbo run test` before opening PRs
- Ensure all Foundry tests pass with `forge test`

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  
  [Report Bug](https://github.com/Buff-Cat-DeFi-Protocol/monorepo/issues) • [Request Feature](https://github.com/Buff-Cat-DeFi-Protocol/monorepo/issues)
  
</div>
