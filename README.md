# 🚂 Invisible Rail

> **UPI-like crypto payments for India** — powered by Aadhaar ZK proofs, Stellar, and Base L2

[![Demo](https://img.shields.io/badge/Demo-Live-green)](http://localhost:3000)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue)](https://stellar.org)
[![Base](https://img.shields.io/badge/Base-Sepolia-purple)](https://base.org)

**Invisible Rail** makes crypto payments as easy as UPI by eliminating seed phrases, passwords, and wallet complexity. Users authenticate with **passkeys** and recover wallets using **Aadhaar ZK proofs** — no private keys to manage.

---

## ✨ Features

- 🔐 **Passkey Authentication** — No passwords, hardware-backed security
- 🇮🇳 **Aadhaar Recovery** — Recover wallet on any device using Aadhaar (privacy-preserving ZK proofs)
- 💸 **Instant USDC Payments** — Stellar network (3-5 sec, near-zero fees)
- 👤 **@rail Usernames** — Send to `rahul@rail` instead of `GAPP...XQIM`
- 📱 **QR Code Payments** — Scan to pay, just like UPI
- ⛓️ **On-Chain Identity** — Nullifier stored on Base Sepolia for cross-device recovery

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Device   │     │  Base Sepolia   │     │ Stellar Network │
│                 │     │                 │     │                 │
│  • Next.js PWA  │     │  Identity       │     │  • Payments     │
│  • Passkeys     │────▶│  Registry       │     │  • USDC         │
│  • Anon Aadhaar │     │  (Nullifier→    │     │  • Fast/Cheap   │
│                 │     │   Wallet)       │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Tech Stack
- **Frontend:** Next.js 16, React 19, TailwindCSS, Framer Motion
- **Auth:** WebAuthn/Passkeys
- **Payments:** Stellar SDK, USDC
- **Identity:** Anon Aadhaar (ZK proofs), Base Sepolia (Solidity)
- **Deployment:** Vercel (frontend), Base Sepolia (contracts)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Aadhaar card (for testing recovery)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/invisible-rail.git
cd invisible-rail

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📱 Usage

### 1. Create Wallet
- Click **"Create Wallet"**
- Set up passkey (Face ID/Touch ID/Windows Hello)
- Wallet created instantly!

### 2. Verify Aadhaar (Optional but Recommended)
- Go to **"Verify"** tab
- Scan your Aadhaar QR code
- ZK proof generated (takes ~3 min first time)
- Identity registered on Base Sepolia

### 3. Send USDC
- Enter `@rail` username or Stellar address
- Enter amount
- Confirm with passkey

### 4. Recover Wallet (New Device)
- Click **"Recover Wallet"**
- Scan same Aadhaar QR code
- Wallet restored from Base! 🎉

---

## 🛠️ Smart Contracts

### Base Sepolia - IdentityRegistry

**Address:** `0x180a9b92653819d8B0e724AF3320Ffbe4b4170e8`

**Functions:**
- `registerWallet(bytes32 nullifierHash, string stellarAddress, string username)`
- `getWallet(bytes32 nullifierHash) → (string, string)`
- `isRegistered(bytes32 nullifierHash) → bool`

**Deploy:**
```bash
cd contracts/base
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network baseSepolia
```

---

## 🔒 Security

### For Demo/Hackathon
- ✅ Testnet only (Stellar Testnet + Base Sepolia)
- ✅ Demo wallet sponsors gas (acceptable for hackathon)
- ✅ Aadhaar data stays private (only nullifier on-chain)

### For Production
- [ ] Move gas sponsorship to backend API
- [ ] Add rate limiting
- [ ] Deploy to mainnets
- [ ] Implement proper key management

---

## 📂 Project Structure

```
invisible-rail/
├── src/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   │   ├── AadhaarVerification.tsx
│   │   ├── AadhaarRecovery.tsx
│   │   ├── WalletConnect.tsx
│   │   └── SendUSDC.tsx
│   ├── providers/           # Context providers
│   │   ├── StellarProvider.tsx
│   │   └── Web3Provider.tsx
│   └── lib/                 # Utilities
│       ├── base-identity.ts
│       ├── base-config.ts
│       └── stellar-config.ts
├── contracts/
│   └── base/
│       ├── contracts/
│       │   └── IdentityRegistry.sol
│       └── scripts/
│           └── deploy.js
└── public/                  # Static assets
```

---

## 🎯 Roadmap

- [x] Passkey wallet creation
- [x] Aadhaar ZK verification
- [x] Base Sepolia identity registry
- [x] Cross-device recovery
- [x] USDC payments on Stellar
- [ ] Mainnet deployment
- [ ] Backend API for gas sponsorship
- [ ] Mobile app (React Native)
- [ ] Multi-chain support

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🙏 Acknowledgments

- [Anon Aadhaar](https://github.com/anon-aadhaar/anon-aadhaar) - ZK proofs for Aadhaar
- [Stellar](https://stellar.org) - Fast, cheap payments
- [Base](https://base.org) - L2 for identity storage
- [Passkey Kit](https://github.com/stellar/passkey-kit) - WebAuthn for Stellar

---

**Built for hackathons, designed for India 🇮🇳**
