# MiniPay India - Kshitij 2026 Hackathon Submission

---

## 1. Executive Summary

**Track Selected:** Track 1 - The Invisible Rail (Re-imagining Web3 Payments for the Next Billion Users)

**One-Liner:** A non-custodial crypto payment app where users pay with stablecoins as easily as UPI—using passkeys and Aadhaar for wallet recovery, with zero seed phrases.

**Team Name:** [YOUR TEAM NAME]

**The Problem in One Sentence:** Current Web3 payments require users to manage seed phrases, hex addresses, and gas fees—creating massive friction that prevents mainstream adoption in India.

---

## 2. Market Research & Validation

### Target Audience
- **Primary:** Indian smartphone users (18-35) familiar with UPI but new to crypto
- **Secondary:** Merchants who want to accept stablecoin payments without crypto complexity
- **Tertiary:** Migrant workers sending remittances who lose 5-7% to traditional services

### Competitor Analysis

| Solution | Approach | Our Advantage |
|----------|----------|---------------|
| **UPI (PhonePe, GPay)** | Fiat-only, bank-dependent | We enable borderless stablecoin payments |
| **MetaMask** | Seed phrases, manual gas | We use passkeys, no seed phrase ever shown |
| **Coinbase Wallet** | Smart wallet, but no Indian identity | We integrate Aadhaar ZK for recovery |
| **Clave/Privy** | Passkey wallets | No India-specific identity recovery |

**Why we're better:** No existing solution combines passkey-based wallets with Aadhaar-linked recovery. We're building for India's identity infrastructure.

### User Persona: "Day in the Life"

**Priya, 24, Bangalore Software Engineer**

*Morning:* Priya splits breakfast bill with roommates. Opens MiniPay → Scans QR → Touches fingerprint → ₹150 USDC sent. No "gas fees" popup, no hex addresses.

*Afternoon:* Priya loses her phone on the metro. Panics about her crypto.

*Evening:* Gets new phone. Opens MiniPay → "Recover with Aadhaar" → Scans Aadhaar QR → ZK proof generated → "Welcome back, priya@minipay!" All funds intact. No seed phrase needed.

---

## 3. The Solution & Innovation

### Core Value Proposition

MiniPay India makes blockchain invisible:
1. **No seed phrases** - Passkey (fingerprint/FaceID) creates and secures wallet
2. **No hex addresses** - Users have UPI-style IDs like `priya@minipay`
3. **No gas confusion** - Transactions show only USDC amount (gas abstracted)
4. **Aadhaar recovery** - Lost phone? Verify Aadhaar → Same wallet restored

### The "Magic Moment"

> *"The user scans a QR code, sees 'Pay 100 USDC to rahul@minipay', touches their fingerprint, and the payment is done. They never see a wallet address, never approve gas, never worry about losing access. It just works—like UPI, but global."*

### Unique Selling Point (USP)

**Aadhaar-based ZK wallet recovery** - No other crypto wallet uses India's identity infrastructure for trustless recovery. The same Aadhaar that Indians use for bank accounts can now recover their crypto wallet—without exposing any personal data (zero-knowledge proof).

### Success Metric

- **Primary:** Time to first payment < 60 seconds (from app open to payment sent)
- **Secondary:** Recovery success rate > 95% (users who lose device and recover wallet)
- **Tertiary:** Zero support tickets about "lost seed phrase"

---

## 4. Technical Feasibility & Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER DEVICE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   Next.js   │    │   Wagmi     │    │ Anon-Aadhaar│                 │
│  │   Frontend  │◄──►│   + Viem    │◄──►│  ZK Proofs  │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│         │                  │                  │                         │
│         ▼                  ▼                  ▼                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Coinbase Smart Wallet SDK                     │   │
│  │                    (Passkey Authentication)                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BASE BLOCKCHAIN (L2)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │    USDC     │    │   Smart     │    │  Identity   │                 │
│  │  Contract   │    │   Wallet    │    │  Registry   │                 │
│  │  (ERC-20)   │    │  (ERC-4337) │    │ (Nullifier) │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Current Demo Implementation:**
| Layer | Technology | Status |
|-------|------------|--------|
| **Frontend** | Next.js 14, React 19, TailwindCSS, Framer Motion | ✅ Working |
| **Blockchain** | Base (Ethereum L2) - Low fees, Coinbase ecosystem | ✅ Working |
| **Wallet** | Coinbase Smart Wallet (ERC-4337 Account Abstraction) | ✅ Working |
| **Authorization** | WebAuthn Passkeys (fingerprint/FaceID) | ✅ Working |
| **Identity** | Anon-Aadhaar (ZK proofs for Aadhaar verification) | ✅ Working |
| **Stablecoin** | USDC (Circle) - Regulatory compliant, widely accepted | ✅ Working |

**Production Architecture (Post-Hackathon):**
| Layer | Technology | Advantage Over Demo |
|-------|------------|---------------------|
| **Blockchain** | Stellar Protocol 25 (X-Ray) | Native BN254 + Poseidon support |
| **Smart Contracts** | Soroban | On-chain ZK verification vs off-chain |
| **Fee Sponsorship** | Launchtube | True gasless (₹0) vs subsidized gas |
| **Mobile** | React Native | Native biometric vs web-based |
| **ZK Verification** | X-Ray BN254 host functions | Hardware-accelerated on-chain |
| **Recovery** | Deterministic from Aadhaar signature | Mathematical guarantee vs localStorage |

### Key Technical Challenge

**Challenge:** Making Aadhaar recovery work across devices without storing sensitive data.

**Solution:** 
- Aadhaar ZK proof generates a deterministic "nullifier" (unique identifier)
- Same Aadhaar → Same nullifier (always)
- We store: `nullifier → wallet_address` mapping
- Recovery: Verify Aadhaar → Get nullifier → Lookup wallet → Restore access
- User's Aadhaar number is NEVER stored or transmitted

---

## 5. Working Prototype & Demo

### GitHub Repository
[INSERT GITHUB LINK]

### Live Demo/Deployment Link
[INSERT VERCEL/DEPLOYMENT LINK]

### Demo Video (2-3 Mins)
[INSERT VIDEO LINK]

### Screenshots

**Screen 1: Wallet Creation with Passkey**
[INSERT SCREENSHOT]

**Screen 2: UPI-Style Payment with Username**
[INSERT SCREENSHOT]

**Screen 3: Aadhaar Recovery Flow**
[INSERT SCREENSHOT]

**Screen 4: QR Code Payment Confirmation**
[INSERT SCREENSHOT]

---

## 6. Business Model & Future Roadmap

### Monetization Strategy

| Revenue Stream | Model | Potential |
|----------------|-------|-----------|
| **Transaction Fees** | 0.1% on payments (vs 2% credit card) | High volume, low margin |
| **Merchant Services** | Monthly subscription for business dashboard | B2B SaaS |
| **Fiat On-Ramp** | Partner commission from Transak/MoonPay | Per transaction |
| **Premium Features** | Higher limits, priority support | Freemium |

### Compliance & Regulatory Path

- **KYC:** Aadhaar ZK proof provides identity verification without storing PII
- **TDS:** Can integrate 1% TDS deduction for transactions > ₹50,000 (as per Indian crypto tax rules)
- **RBI Guidelines:** Non-custodial wallet—user controls keys, we don't hold funds
- **CERT-In:** Data localization compliant—ZK proofs processed on-device

### The "Next 6 Months" Roadmap

| Priority | Feature | Impact |
|----------|---------|--------|
| **1** | **Paymaster Integration** | True gasless transactions—users never see ETH |
| **2** | **On-Chain Identity Registry** | Decentralized nullifier→wallet mapping |
| **3** | **Merchant Dashboard** | QR generation, settlement reports, analytics |
| **4** | **Fiat On/Off Ramp** | Buy/sell USDC with UPI directly in app |
| **5** | **Multi-Currency Support** | USDT, DAI, and INR-pegged stablecoins |
| **6** | **React Native App** | True biometric experience on mobile |

---


## Contact

- **Email:** [YOUR EMAIL]
- **GitHub:** [YOUR GITHUB]
- **Twitter/X:** [YOUR HANDLE]

---

*Built for Kshitij 2026 - IIT Kharagpur*
