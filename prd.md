Product Requirements Document: The Invisible Rail

Executive Summary

Project Name: The Invisible Rail Track: Track 1 - Re-imagining Web3 Payments for the Next Billion Users Version: 1.0 Last Updated: January 14, 2026 Status: Pre-Development

Vision Statement

Build a non-custodial payment layer where blockchain becomes invisible, enabling users to pay in stablecoins as easily as scanning a QR code—without ever seeing private keys, managing gas fees, or understanding crypto complexities.

Success Metrics

User Onboarding: < 60 seconds from download to first payment

Payment Flow: < 5 seconds from QR scan to transaction confirmation

User Awareness: 0% exposure to blockchain terminology (no "gas", "wallets", "keys")

Recovery: 100% account recovery success rate via Aadhaar re-scan

Cost: < ₹0.10 per transaction (including gas sponsorship)

1. Problem Statement

Current Web3 Payment Friction Points

Cognitive Overload: 12-word seed phrases, hexadecimal addresses, manual gas management

Poor UX: 15+ steps for wallet setup vs 3 steps for UPI

Recovery Nightmare: Lost seed phrase = lost funds permanently

Privacy Concerns: Public addresses reveal entire transaction history

Gas Complexity: Users must hold native tokens, understand fluctuating fees

The UPI Gold Standard

Onboarding: Link phone number → Set UPI PIN → Done (< 2 minutes)

Payments: Scan QR → Enter PIN → Confirm (< 10 seconds)

Recovery: Re-link phone number on new device

Privacy: Transactions not publicly visible

Cost: ₹0 for users (merchants pay minimal fees)

Our Mission

Match UPI's simplicity while maintaining Web3's core value: non-custodial ownership.

2. Technical Architecture

2.1 Core Technology Stack

Blockchain Layer

Network: Stellar Protocol 25 (with X-Ray support)

Stellar X-Ray Overview

Protocol 25 Upgrade Guide

Smart Contracts: Soroban (Stellar's smart contract platform)

Soroban Documentation

Token Standard: Stellar Asset Contract (for USDC stablecoin)

Zero-Knowledge Layer

Identity Protocol: Anon Aadhaar (PSE - Privacy & Scaling Explorations)

Anon Aadhaar Documentation

GitHub Repository

ZK Cryptography: BN254 elliptic curve (native to Stellar X-Ray)

BN254 Technical Spec

Hash Function: Poseidon (ZK-optimized, native to X-Ray)

Poseidon Research Paper

Authentication Layer

Biometric Auth: WebAuthn Passkeys

Stellar Passkey Kit

WebAuthn Specification

Smart Wallets: Stellar Smart Wallets (Protocol 21+)

Smart Wallets Guide

Gas Abstraction Layer

Fee Sponsorship: Launchtube

Launchtube Platform

Stellar Fee-Bump Transactions

Frontend Stack

Mobile: React Native

Web: Next.js 14+ (App Router)

SDK Integration:

@anon-aadhaar/react-native - Aadhaar ZK proofs

@stellar/passkey-kit - Biometric authentication

stellar-sdk - Blockchain interaction

@zxing/browser - QR code scanning

3. Product Features & Requirements

3.1 Feature: Aadhaar-Based Onboarding

User Story

As a new user, I want to create a payment wallet by scanning my Aadhaar QR code and setting up biometric authentication, so I can start making payments without managing seed phrases.

Technical Requirements

FR-1.1: Aadhaar QR Code Scanning

Support offline QR scanning (no internet required for initial scan)

Parse Aadhaar Secure QR Code v2.0 format

Extract signed data for ZK proof generation

Tech: @anon-aadhaar/core with react-native-qrcode-scanner

Reference: Aadhaar QR Code Specification

FR-1.2: Zero-Knowledge Proof Generation

Generate ZK-SNARK proof of valid Aadhaar ownership

Compute unique nullifier (prevents duplicate accounts)

Bind proof to derived wallet address via signal

Runs entirely client-side (no server upload of Aadhaar data)

Tech: Anon Aadhaar SDK with Circom circuits

Circuit: Aadhaar Verifier Circuit

FR-1.3: On-Chain Proof Verification

Smart contract verifies BN254 proof using Stellar X-Ray host functions

Validates nullifier hasn't been used (Sybil resistance)

Stores nullifier hash on-chain (Poseidon hash for efficiency)

Contract Functions:

verify_aadhaar_proof(proof: Bytes, public_inputs: Bytes) -> boolregister_nullifier(nullifier_hash: BytesN<32>) -> Result<(), Error> 

Reference: X-Ray BN254 Host Functions

FR-1.4: Deterministic Wallet Derivation

Derive wallet keypair from Aadhaar signature (deterministic)

Use Aadhaar RSA signature as entropy source

Apply HKDF for key derivation

Formula: wallet_seed = HKDF(aadhaar_signature, salt="stellar-wallet-v1")

Reference: RFC 5869 - HKDF

FR-1.5: Smart Wallet Deployment

Deploy Stellar smart wallet contract for user

Configure with passkey as primary signer

Set Aadhaar-derived key as recovery signer

Gas sponsored via Launchtube

Reference: Smart Wallet Deployment Tutorial

FR-1.6: Passkey Registration

Register device biometric (FaceID/TouchID/Fingerprint) as passkey

Store public key in smart wallet contract

Configure as primary transaction signer

Tech: @stellar/passkey-kit with WebAuthn API

Reference: Passkey Kit Quickstart

Acceptance Criteria

✅ User completes onboarding in < 60 seconds

✅ No manual entry of addresses, keys, or seed phrases

✅ ZK proof verification succeeds on-chain

✅ Nullifier prevents duplicate Aadhaar usage

✅ Passkey successfully authenticates on device

✅ Gas fees fully sponsored (user sees ₹0 cost)

✅ Works offline-first (proof generation without internet)

Non-Functional Requirements

Performance: Proof generation < 5 seconds on mid-range Android (Snapdragon 6-series)

Security: Private keys never leave secure enclave/keystore

Privacy: Zero Aadhaar PII transmitted to servers or blockchain

Accessibility: Support regional languages (Hindi, Tamil, Bengali, etc.)

3.2 Feature: QR Code Payment Flow

User Story

As a user, I want to scan a merchant's QR code and confirm payment with my fingerprint/face, so I can complete transactions as easily as UPI.

Technical Requirements

FR-2.1: Merchant QR Code Parsing

Support Stellar Payment Request format (SEP-0007)

Parse payment details: recipient address, amount, asset, memo

Display human-readable confirmation screen

Format: web+stellar:pay?destination=G...&amount=100&asset=USDC&memo=Invoice123

Reference: SEP-0007 Specification

FR-2.2: Transaction Preview

Show merchant name (if available via Federation/MEMO)

Display amount in INR equivalent (live exchange rate)

Show fee: ₹0 (sponsored)

Estimated confirmation time: ~5 seconds

Currency API: CoinGecko API or Stellar Market Data

FR-2.3: Biometric Transaction Signing

Prompt FaceID/TouchID/Fingerprint confirmation

Generate passkey signature for transaction

Sign transaction locally (no server roundtrip)

Tech: WebAuthn navigator.credentials.get() with userVerification: required

Reference: Passkey Transaction Signing

FR-2.4: Gas-Sponsored Transaction Submission

Wrap user's transaction in fee-bump envelope

Launchtube sponsors transaction fees

Submit to Stellar network

Return transaction hash instantly

Reference: Launchtube Integration Guide

FR-2.5: Real-Time Payment Confirmation

Subscribe to transaction status via Horizon SSE

Display confirmation within 5 seconds

Show merchant receipt (optional)

Update wallet balance

Tech: Horizon Server-Sent Events (SSE)

Reference: Horizon Streaming

FR-2.6: Privacy Layer (Optional)

Attach ZK proof of payment authorization (without revealing identity)

Use nullifier to prevent double-spending detection

Merchant sees payment but not user's Aadhaar-linked identity

Implementation: Include Anon Aadhaar proof in transaction memo

Acceptance Criteria

✅ Payment completes in < 10 seconds (scan to confirmation)

✅ Biometric prompt appears within 1 second of QR scan

✅ Transaction confirmation visible in app immediately

✅ Works in offline-first mode (queues transaction, submits when online)

✅ Merchant receives payment notification

✅ User never sees hex addresses or transaction hashes

✅ Zero gas fees visible to user

Non-Functional Requirements

Reliability: 99.9% transaction success rate

Latency: < 500ms from biometric confirm to network submission

Error Handling: Clear user-friendly messages (no "insufficient XLM for fees")

Offline Mode: Queue up to 10 transactions for later submission

3.3 Feature: Account Recovery

User Story

As a user who lost their phone, I want to recover my wallet by scanning my Aadhaar QR code on a new device, so I can regain access without seed phrases.

Technical Requirements

FR-3.1: Aadhaar Re-Scan Recovery

User scans Aadhaar QR on new device

Generate same ZK proof with matching nullifier

Derive same wallet keys (deterministic)

Validation: Nullifier matches on-chain record

Reference: Same as FR-1.2 (deterministic derivation)

FR-3.2: Wallet Lookup via Nullifier

Query smart contract for wallet address by nullifier hash

Use Mercury indexer for fast lookups

Tech: Mercury GraphQL API

Query:

query GetWalletByNullifier($nullifier: String!) {  wallet(nullifier_hash: $nullifier) {    address    balance    last_activity  }} 

Reference: Mercury Documentation

FR-3.3: Passkey Re-Registration

Deactivate old device passkey (if compromise suspected)

Register new device biometric

Update smart wallet signers on-chain

Security: Require Aadhaar ZK proof for signer updates

Reference: Smart Wallet Signer Management

FR-3.4: Social Recovery (Advanced)

Optional: Designate 3 trusted contacts (guardians)

Guardians can collectively approve recovery without Aadhaar

Requires 2-of-3 multisig approval

Implementation: Soroban multi-sig contract

Reference: Stellar Multisig

Acceptance Criteria

✅ Recovery completes in < 90 seconds

✅ Works even if original device destroyed

✅ No loss of funds during recovery

✅ Transaction history visible after recovery

✅ Social recovery (if enabled) works with 2-of-3 guardians

✅ Old device automatically deactivated

Non-Functional Requirements

Security: Recovery requires fresh ZK proof (prevents replay attacks)

Auditability: All recovery events logged on-chain

Privacy: Recovery doesn't reveal Aadhaar details to guardians

3.4 Feature: UPI-Style User Experience

User Story

As a user familiar with UPI, I want the app to feel as simple and familiar, so I don't need to learn new blockchain concepts.

Technical Requirements

FR-4.1: Familiar UI/UX Patterns

Home screen shows balance in INR (not USDC)

"Pay" and "Receive" buttons (no "Send Transaction")

Recent transactions show merchant names, not addresses

Design Reference: Google Pay, PhonePe UI patterns

FR-4.2: Human-Readable Identifiers

Support Stellar Federation protocol for username@domain addresses

Allow payment to phone numbers (via lookup service)

QR codes display merchant names, not G... addresses

Tech: SEP-0002 Federation

Reference: Federation Protocol

FR-4.3: Zero Blockchain Terminology

Replace "wallet" with "account"

Replace "transaction" with "payment"

Hide: gas, confirmations, blocks, addresses

Show: amount, merchant, time, status

FR-4.4: Instant Payment Feedback

Optimistic UI updates (show "paid" immediately)

Confetti animation on success

Sound effects for confirmation

Push notification to merchant

FR-4.5: Balance Management

Auto-convert USDC to INR display

Show pending transactions

Monthly spending insights

Low balance alerts (< ₹100)

Acceptance Criteria

✅ User testing shows 0% awareness they're using blockchain

✅ 90%+ of test users complete payment without help

✅ App feels "as easy as UPI" in user surveys

✅ No technical jargon visible anywhere in UI

✅ Error messages are actionable and non-technical

4. Smart Contract Architecture

4.1 Core Contracts

AadhaarWalletFactory

Purpose: Deploy and manage Aadhaar-linked smart wallets

Key Functions:

pub fn create_wallet(     env: Env,     aadhaar_proof: Bytes,     public_inputs: Bytes,     nullifier: BytesN<32>,     passkey_pubkey: BytesN<64> ) -> Result<Address, Error>  pub fn verify_and_register(     env: Env,     proof: Bytes,     inputs: Bytes ) -> bool 

Storage:

nullifier_to_wallet: Map<BytesN<32>, Address>

wallet_to_nullifier: Map<Address, BytesN<32>>

registered_wallets: Set<Address>

Events:

WalletCreated { wallet: Address, nullifier_hash: BytesN<32> } NullifierRegistered { nullifier: BytesN<32>, timestamp: u64 } 

Reference: Soroban Contract Tutorial

AadhaarSmartWallet

Purpose: Individual user wallet with Aadhaar recovery

Key Functions:

pub fn initialize(     env: Env,     owner: Address,     passkey_signer: BytesN<64>,     aadhaar_recovery_key: BytesN<32> )  pub fn execute_payment(     env: Env,     recipient: Address,     amount: i128,     asset: Address,     passkey_signature: Bytes ) -> Result<(), Error>  pub fn recover_via_aadhaar(     env: Env,     new_passkey: BytesN<64>,     aadhaar_proof: Bytes ) -> Result<(), Error> 

Authorization Logic:

Primary: Passkey signature (biometric)

Recovery: Aadhaar ZK proof verification

Emergency: Social recovery (2-of-3 multisig)

Reference: Smart Wallet Implementation

ZKVerifier

Purpose: On-chain verification of Anon Aadhaar proofs

Key Functions:

pub fn verify_bn254_proof(     env: Env,     proof: Bytes,      // BN254 proof points     public_inputs: Bytes  // Public signals ) -> bool  pub fn verify_poseidon_hash(     env: Env,     inputs: Vec<BytesN<32>>,     expected_hash: BytesN<32> ) -> bool 

X-Ray Integration:

// Use Stellar X-Ray host functions use soroban_sdk::crypto::Bn254;  let valid = env.crypto().bn254_pairing_check(     proof.g1_points,     proof.g2_points )?; 

Reference: X-Ray Host Functions

PaymentSponsor

Purpose: Gas fee sponsorship via Launchtube

Key Functions:

pub fn sponsor_transaction(     env: Env,     user_wallet: Address,     transaction: Bytes ) -> Result<Bytes, Error>  // Returns fee-bump envelope  pub fn check_sponsorship_eligibility(     env: Env,     wallet: Address ) -> bool 

Sponsorship Rules:

Free tier: 100 transactions/month per wallet

Rate limit: 10 transactions/hour

Max amount: ₹10,000 per transaction

Whitelist verified wallets (Aadhaar-linked)

Reference: Launchtube API

4.2 Contract Deployment

Testnet Deployment:

Network: Stellar Testnet (with Protocol 25)

RPC: https://soroban-testnet.stellar.org

Explorer: https://stellar.expert/explorer/testnet

Build & Deploy:

# Install Stellar CLI cargo install --locked stellar-cli  # Build contract stellar contract build  # Deploy to testnet stellar contract deploy \   --wasm target/wasm32-unknown-unknown/release/aadhaar_wallet.wasm \   --network testnet \   --source SIGNER_SECRET_KEY  # Initialize contract stellar contract invoke \   --id CONTRACT_ID \   --network testnet \   -- initialize \   --admin ADMIN_ADDRESS 

Reference: Soroban Deployment Guide

5. API Specifications

5.1 Backend Services

Aadhaar Proof Service (Client-Side Only)

Note: All proof generation happens client-side. No backend needed.

Client SDK Usage:

import { init, prove } from '@anon-aadhaar/react-native'  // Initialize (download proving keys once) await init({   wasmURL: 'https://cdn.anon-aadhaar.pse.dev/wasm/aadhaar-verifier.wasm',   zkeyURL: 'https://cdn.anon-aadhaar.pse.dev/zkey/aadhaar-verifier.zkey',   vkeyURL: 'https://cdn.anon-aadhaar.pse.dev/vkey/aadhaar-verifier.json' })  // Generate proof from QR scan const proof = await prove({   qrData: scannedQRCodeData,   signal: walletAddress,   nullifierSeed: 12345 })  // Proof structure interface AnonAadhaarProof {   proof: string           // BN254 SNARK proof   publicInputs: string[]  // Public signals   nullifier: string       // Unique identifier   timestamp: number } 

Reference: Anon Aadhaar SDK

Wallet Indexer API (Mercury)

GraphQL Endpoint: https://api.mercurydata.app/graphql

Example Queries:

# Get wallet by nullifier query GetWallet($nullifier: String!) {   aadhaar_wallet(where: {nullifier_hash: {_eq: $nullifier}}) {     address     balance     created_at     last_transaction   } }  # Get transaction history query GetTransactions($wallet: String!, $limit: Int = 20) {   payments(     where: {source: {_eq: $wallet}}     order_by: {ledger: desc}     limit: $limit   ) {     id     destination     amount     asset     memo     timestamp   } }  # Get account balance query GetBalance($address: String!) {   account(where: {address: {_eq: $address}}) {     balances {       asset_code       asset_issuer       balance     }   } } 

Reference: Mercury Data Platform

Fee Sponsorship API (Launchtube)

Endpoint: https://api.launchtube.xyz/v1/sponsor

Request:

POST /v1/sponsor Content-Type: application/json  {   "network": "testnet",   "transaction_xdr": "AAAAAgAAAAC...",  // User's transaction   "sponsor_address": "GDXXX...",         // Your sponsor account   "max_fee": "1000"                      // Max fee in stroops } 

Response:

{   "fee_bump_xdr": "AAAABQAAAADsP...",   "fee_charged": "100",   "sponsor_sequence": "12345678",   "estimated_cost_usd": "0.00001" } 

Reference: Launchtube Integration

5.2 Third-Party Integrations

Exchange Rate API

Provider: CoinGecko Endpoint: https://api.coingecko.com/api/v3/simple/price

GET /simple/price?ids=usd-coin&vs_currencies=inr  Response: {   "usd-coin": {     "inr": 83.24   } } 

Fallback: Stellar DEX USDC/XLM → XLM/INR conversion

Push Notifications

Provider: Firebase Cloud Messaging (FCM)

Use Cases:

Payment received confirmation

Low balance alert (< ₹100)

Suspicious activity detection

Gas sponsorship quota warnings

Reference: FCM Documentation

6. Security & Privacy

6.1 Security Model

Threat Model

Device Compromise: Passkey in secure enclave (hardware-backed)

Aadhaar Leak: ZK proofs reveal nothing (zero-knowledge)

Man-in-the-Middle: HTTPS + certificate pinning

Replay Attacks: Nonce in passkey challenges, nullifier prevents double-registration

Smart Contract Exploits: Formal verification + audits

Security Measures

Client-Side:

Private keys never leave secure enclave (iOS Keychain, Android Keystore)

Passkey signatures require biometric confirmation

Certificate pinning for API calls

ProGuard/R8 obfuscation (Android)

Jailbreak/root detection

Smart Contract:

Reentrancy guards on all external calls

Access control via require_auth() checks

Pausable contracts (emergency stop)

Upgrade mechanism via proxy pattern

Formal verification with Certora/Halmos

Network:

TLS 1.3 for all connections

Rate limiting on Launchtube

DDoS protection via Cloudflare

Horizon API key rotation

Reference:

Soroban Security Best Practices

OWASP Mobile Security

6.2 Privacy Guarantees

What's Private (Zero-Knowledge)

✅ User's Aadhaar number ✅ User's name, address, photo ✅ User's date of birth ✅ Which specific Aadhaar was used

What's Public (On-Chain)

⚠️ Nullifier hash (unique but unlinkable to identity) ⚠️ Wallet address (pseudonymous) ⚠️ Transaction amounts and recipients ⚠️ Transaction timestamps

Privacy Features

Selective Disclosure:

Can prove "age > 18" without revealing exact birthdate

Can prove "state = Maharashtra" without full address

Can prove "valid Aadhaar" without any PII

Transaction Privacy (Advanced):

Optional: Use Stellar Turrets for private memos

Optional: Shielded transactions via ZK rollups (future)

Merchant sees payment, not identity

Data Minimization:

No user data stored on servers

Proofs generated client-side only

Blockchain only stores nullifier hash

Reference:

Anon Aadhaar Privacy Guarantees

Stellar Privacy Considerations

6.3 Compliance

KYC/AML Considerations

Aadhaar verification satisfies KYC requirements (India)

Nullifiers enable unique user tracking (prevents Sybil)

Transaction monitoring possible via on-chain analysis

Configurable privacy allows regulatory compliance

Data Protection

GDPR Compliance: No EU user data stored

India DPDP Act: Aadhaar processed locally on device

Right to Erasure: User can delete app (keys in secure enclave deleted)

Data Portability: Export transaction history as CSV

Reference: India DPDP Act 2023

7. Performance Requirements

7.1 Latency Targets

Operation Target Acceptable Unacceptable App Launch < 1s < 2s > 3s QR Scan < 500ms < 1s > 2s ZK Proof Gen < 5s < 10s > 15s Biometric Prompt < 300ms < 1s > 2s Tx Submission < 1s < 3s > 5s Tx Confirmation < 5s < 10s > 30s Balance Refresh < 500ms < 2s > 5s

7.2 Scalability

Concurrent Users:

Target: 10,000 concurrent users (MVP)

Scale: 100,000 concurrent users (production)

Transaction Throughput:

Stellar Network: ~1,000 TPS (operations per second)

Our Target: 100 payments/second (well within limits)

Storage:

On-Chain: ~100 bytes per wallet registration

Client: ~50MB app size, ~10MB cache

Reference: Stellar Network Performance

7.3 Device Support

Minimum Requirements:

iOS: iOS 15+, Face ID or Touch ID

Android: Android 9+ (API 28), Fingerprint sensor or Face unlock

RAM: 2GB minimum, 4GB recommended

Storage: 100MB free space

Browser Support (Web App):

Chrome 90+, Safari 14+, Firefox 88+

WebAuthn support required

Reference: WebAuthn Browser Support

8. Testing Strategy

8.1 Unit Tests

Smart Contracts (Rust):

# Run Soroban contract tests cargo test  # Coverage report cargo tarpaulin --out Html 

Test Coverage Target: > 80% code coverage

Key Test Cases:

ZK proof verification (valid/invalid proofs)

Nullifier uniqueness enforcement

Passkey signature validation

Fee sponsorship logic

Recovery mechanisms

Reference: Soroban Testing Guide

8.2 Integration Tests

End-to-End Flows:

Onboarding: Aadhaar scan → Proof gen → Wallet creation

Payment: QR scan → Biometric → Transaction confirmation

Recovery: Re-scan Aadhaar → Wallet restored

Tools:

Mobile: Detox (React Native E2E testing)

Web: Playwright or Cypress

Contract Testing: Stellar CLI test framework

Test Environment:

Stellar Testnet with Protocol 25 enabled

Mock Aadhaar QR codes (test data)

Launchtube testnet integration

Reference: Detox Documentation

8.3 Security Audits

Pre-Launch Audits:

Smart Contract Audit - External security firm (e.g., Trail of Bits, OpenZeppelin)

ZK Circuit Review - PSE team or ZK security specialists

Mobile App Security - Penetration testing (OWASP Mobile Top 10)

Infrastructure Audit - API security, key management review

Continuous Security:

Automated dependency scanning (Dependabot)

SAST/DAST tools (Snyk, SonarQube)

Bug bounty program post-launch

8.4 User Testing

Usability Testing:

Participants: 20 users (10 UPI-familiar, 10 crypto-naive)

Tasks:

Onboard new wallet

Make payment to merchant

Recover account on new device

Success Metrics:

90%+ task completion without help

< 3 user errors per flow

System Usability Scale (SUS) score > 80

A/B Testing (Post-MVP):

Onboarding flow variations

Payment confirmation UI

Error message clarity

Reference: SUS Calculator

9. Development Roadmap

Phase 1: Foundation (Week 1)

Goals: Setup infrastructure, validate core technologies

Tasks:

[x] Development environment setup

[ ] Stellar testnet account creation

[ ] Anon Aadhaar SDK integration

[ ] Generate first ZK proof locally

[ ] Deploy test smart contract with X-Ray

[ ] Verify BN254 proof on-chain (testnet)

Deliverables:

Working proof-of-concept: Aadhaar QR → ZK proof → On-chain verification

Technical feasibility validated

Resources:

Stellar Testnet Faucet

Soroban CLI Setup

Anon Aadhaar Quick Setup

Phase 2: Smart Contracts (Week 2)

Goals: Build and deploy production-ready contracts

Tasks:

[ ] Implement AadhaarWalletFactory contract

[ ] Implement AadhaarSmartWallet contract

[ ] Implement ZKVerifier with X-Ray functions

[ ] Integrate Launchtube for fee sponsorship

[ ] Write comprehensive unit tests (>80% coverage)

[ ] Deploy to testnet and verify all functions

Deliverables:

Deployed smart contracts on testnet

Contract addresses documented

Test suite passing

Milestones:

✅ Wallet creation with Aadhaar proof verification

✅ Passkey signature validation

✅ Fee-sponsored transactions working

Phase 3: Mobile App (Week 3)

Goals: Build user-facing application

Tasks:

[ ] React Native project setup

[ ] Aadhaar QR scanner implementation

[ ] ZK proof generation UI flow

[ ] Passkey registration (FaceID/TouchID)

[ ] Payment QR scanning

[ ] Transaction signing with biometrics

[ ] Balance display and transaction history

[ ] Account recovery flow

Deliverables:

Working mobile app (iOS + Android)

Connected to testnet contracts

Basic UI/UX implemented

Tech Stack:

React Native 0.73+

TypeScript

React Navigation

React Query (data fetching)

Zustand (state management)

Phase 4: Polish & Demo (Week 4)

Goals: Prepare for hackathon submission

Tasks:

[ ] UI/UX refinement (match UPI patterns)

[ ] Error handling and edge cases

[ ] Performance optimization

[ ] User testing (5-10 participants)

[ ] Create demo video (3-5 minutes)

[ ] Prepare presentation deck

[ ] Write comparison analysis (UPI vs Web3 vs Our Solution)

Deliverables:

Polished demo app

Demo video showcasing key features

Presentation deck (15-20 slides)

GitHub repository with documentation

Demo Script:

Show UPI payment (baseline)

Show traditional Web3 wallet (MetaMask/Coinbase)

Show our solution (Invisible Rail)

Highlight friction point comparison

10. Success Criteria & KPIs

10.1 Hackathon Judging Criteria

Innovation (30 points):

✅ Novel use of Stellar X-Ray for Aadhaar ZK verification

✅ First Aadhaar-based blockchain wallet in India

✅ Gas abstraction + biometric auth combination

✅ Truly "invisible blockchain" experience

Technical Execution (30 points):

✅ Working prototype on testnet

✅ Smart contracts deployed and verified

✅ Clean, well-documented code

✅ Security best practices followed

User Experience (25 points):

✅ < 60 second onboarding

✅ < 10 second payment flow

✅ Zero blockchain terminology

✅ UPI-level simplicity demonstrated

Market Impact (15 points):

✅ Addresses real problem (Web3 UX)

✅ Scalable solution (1 billion+ Aadhaar holders)

✅ Regulatory-friendly (KYC via Aadhaar)

✅ Clear go-to-market strategy

10.2 User Experience Metrics

Onboarding Success:

Target: 95% completion rate

Measurement: Users who scan Aadhaar → Wallet created

Payment Flow Speed:

Target: 90% of payments < 10 seconds

Measurement: QR scan timestamp → Confirmation timestamp

Error Rate:

Target: < 5% failed transactions

Reasons: Network issues, invalid QR, biometric failure

User Satisfaction:

Target: SUS score > 80 (Excellent)

Measurement: Post-testing survey (10 questions)

10.3 Technical Performance Metrics

Proof Generation:

Target: < 5 seconds on mid-range Android

Device: Snapdragon 6-series or equivalent

Transaction Finality:

Target: < 5 seconds on Stellar testnet

Measurement: Submission → Confirmed in ledger

Contract Gas Efficiency:

Target: < 100,000 operations per wallet creation

Stellar Metric: Instructions executed

App Performance:

Target: 60 FPS during all interactions

Tool: React Native Performance Monitor

11. Risk Analysis & Mitigation

11.1 Technical Risks

Risk Probability Impact Mitigation X-Ray not ready on testnet Low High Already live on testnet (Jan 7) ✅ ZK proof generation too slow Medium High Optimize circuit, use WebAssembly, test on target devices Launchtube quota exhausted Medium Medium Implement our own fee sponsor, request quota increase Passkey incompatibility Low Medium Fallback to PIN-based signing, test across devices Aadhaar QR parsing failures Medium High Test with real QR codes, add manual entry fallback

Mitigation Strategy:

Early testing on real devices

Multiple fallback mechanisms

Clear error messages for users

Monitoring and alerting

11.2 Security Risks

Risk Probability Impact Mitigation Smart contract exploit Low Critical Security audit, formal verification, bug bounty Aadhaar data leakage Very Low Critical ZK proofs reveal nothing, no server upload Passkey compromise Low High Secure enclave protection, device attestation Replay attack Low Medium Nonce in challenges, nullifier checks Phishing (fake QR codes) Medium Medium Verify merchant identity, user education

Security Practices:

Regular dependency updates

Penetration testing

Incident response plan

User security education

11.3 Regulatory Risks

Risk Probability Impact Mitigation Aadhaar usage restrictions Low High Consult legal, use Anon Aadhaar (privacy-preserving) Crypto regulation changes Medium Medium Non-custodial design, compliance documentation Data privacy violations Low High No PII storage, DPDP Act compliance AML/KYC requirements Low Medium Nullifier tracking, transaction monitoring

Legal Considerations:

Legal counsel consultation (India)

Terms of Service and Privacy Policy

Aadhaar usage guidelines compliance

Reserve Bank of India (RBI) regulations monitoring

12. Go-To-Market Strategy (Post-Hackathon)

12.1 Target Users

Primary: India's 1.3 billion Aadhaar holders

Digital payment users (UPI-familiar)

Unbanked/underbanked populations

Cross-border remittance receivers

Freelancers receiving crypto payments

Early Adopters:

Tech-savvy millennials (18-35)

Crypto-curious but deterred by complexity

Users frustrated with custodial wallets

12.2 Distribution Channels

Phase 1 (MVP):

Google Play Store (Android)

Apple App Store (iOS)

Direct APK download (website)

Phase 2 (Growth):

Partnership with UPI apps (integration)

Merchant adoption program (QR codes)

Fintech partnerships (Razorpay, PhonePe)

Phase 3 (Scale):

Government pilots (Jan Dhan accounts)

Banking partnerships (HDFC, ICICI)

International expansion (other countries with national ID)

12.3 Business Model

Revenue Streams:

Interchange Fees: 0.1% on merchant transactions (competitive with UPI)

Premium Features: Advanced privacy, higher limits, priority support ($2/month)

B2B API: Aadhaar-linked wallets for businesses (volume pricing)

Cross-Border Fees: 1% on international transfers (vs 3-5% traditional)

Cost Structure:

Transaction fees: Sponsored initially, eventually 0.0001 XLM (~$0.00001)

Infrastructure: Cloud hosting, API costs (~$500/month)

Team: 2-3 developers, 1 designer (post-hackathon)

Break-Even: ~50,000 active users with 10 transactions/month

13. Documentation & Resources

13.1 Developer Resources

Stellar Ecosystem:

Stellar Developers Portal

Soroban Documentation

Stellar X-Ray Announcement

Passkey Kit GitHub

Launchtube Platform

Mercury Data API

Zero-Knowledge Proofs:

Anon Aadhaar Documentation

Anon Aadhaar GitHub

Circom Tutorial

BN254 Curve Specification

Poseidon Hash Paper

Authentication & Security:

WebAuthn Guide

W3C WebAuthn Spec

OWASP Mobile Security

Aadhaar QR Code Spec

Development Tools:

Stellar Laboratory

Stellar Expert Explorer

Soroban CLI

React Native Documentation

13.2 Community & Support

Stellar Community:

Stellar Discord - #protocol-next channel for X-Ray

Stellar Stack Exchange

Stellar Developer Blog

Anon Aadhaar:

PSE Discord - #anon-aadhaar channel

GitHub Discussions

Hackathon Support:

Project GitHub: [To be created]

Demo Video: [To be recorded]

Presentation Deck: [To be designed]

13.3 References

Academic Papers:

"Poseidon: A New Hash Function for Zero-Knowledge Proof Systems" - Grassi et al., 2019

"Groth16: Quadratic Span Programs and Succinct NIZKs without PCPs" - Groth, 2016

"Identity-Based Encryption from the Weil Pairing" - Boneh & Franklin, 2001

Technical Specifications:

SEP-0007: URI Scheme for Payment Requests

SEP-0002: Federation Protocol

SEP-0010: Stellar Authentication

CAP-0046: Smart Contract Standardized Asset

Protocol 25: X-Ray (BN254 + Poseidon)

Industry Reports:

"State of UPI in India" - NPCI, 2024

"Web3 User Experience Report" - Consensys, 2024

"Aadhaar Adoption Statistics" - UIDAI, 2024

14. Appendices

Appendix A: Glossary

BN254: Barreto-Naehrig elliptic curve with 254-bit prime, optimized for pairing-based cryptography

Nullifier: Unique deterministic identifier derived from Aadhaar signature, prevents duplicate registrations

Passkey: WebAuthn credential stored in device secure enclave, enables biometric authentication

Poseidon: Hash function designed for efficient computation in zero-knowledge circuits

Smart Wallet: Programmable account on Stellar with custom authorization logic (vs traditional keypair)

X-Ray: Stellar Protocol 25 upgrade adding native BN254 and Poseidon support

ZK-SNARK: Zero-Knowledge Succinct Non-Interactive Argument of Knowledge - proves statement without revealing data

Launchtube: Service providing transaction fee sponsorship on Stellar network

Sybil Attack: Creating multiple fake identities; prevented by Aadhaar nullifier uniqueness

SEP: Stellar Ecosystem Proposal - standardized protocol for Stellar applications

Appendix B: Sample Code Snippets

Generating Aadhaar ZK Proof:

import { prove, init } from '@anon-aadhaar/react-native'  // Initialize proving system await init({   wasmURL: WASM_URL,   zkeyURL: ZKEY_URL })  // Scan Aadhaar QR code const qrData = await scanQRCode()  // Generate proof const proof = await prove({   qrData,   signal: walletAddress,      // Binds proof to wallet   nullifierSeed: 12345         // App-specific seed })  console.log('Proof:', proof.proof) console.log('Nullifier:', proof.nullifier) console.log('Public Inputs:', proof.publicInputs) 

Verifying Proof On-Chain:

use soroban_sdk::{contract, contractimpl, Env, Bytes, BytesN};  #[contract] pub struct ZKVerifier;  #[contractimpl] impl ZKVerifier {     pub fn verify_aadhaar(         env: Env,         proof: Bytes,         public_inputs: Bytes     ) -> bool {         // Use X-Ray BN254 pairing check         let g1_points = parse_g1_points(&proof);         let g2_points = parse_g2_points(&proof);                  env.crypto().bn254_pairing_check(             g1_points,             g2_points         ).unwrap_or(false)     } } 

Creating Passkey:

// Register passkey for wallet const credential = await navigator.credentials.create({   publicKey: {     challenge: new Uint8Array(32),     rp: { name: "Invisible Rail", id: "invisiblerail.app" },     user: {       id: walletAddress,       name: "user@invisiblerail.app",       displayName: "My Wallet"     },     pubKeyCredParams: [       { type: "public-key", alg: -7 }  // ES256     ],     authenticatorSelection: {       authenticatorAttachment: "platform",       userVerification: "required"      // Force biometric     }   } })  // Store public key in smart wallet await stellarSDK.updateWalletSigner({   wallet: walletAddress,   passkey: credential.publicKey }) 

Making Payment:

async function payMerchant(merchantQR: string) {   // Parse QR code   const { recipient, amount, memo } = parsePaymentRequest(merchantQR)      // Build transaction   const tx = new StellarSDK.TransactionBuilder(smartWallet, {     fee: '0',  // Sponsored     networkPassphrase: Networks.TESTNET   })     .addOperation(Operation.payment({       destination: recipient,       asset: Asset.native(),       amount: amount     }))     .setTimeout(30)     .build()      // Sign with passkey (triggers FaceID)   const signature = await signWithPasskey(tx.hash())      // Submit via Launchtube (fee sponsored)   const result = await launchtube.submitSponsored(tx, signature)      return result.hash } 

Appendix C: Test Aadhaar Data

For Development/Testing Only:

Mock Aadhaar QR Code Data:

<?xml version="1.0" encoding="UTF-8"?> <QRData>   <uid>123456789012</uid>   <name>Test User</name>   <gender>M</gender>   <dob>01-01-1990</dob>   <co>S/O: Test Father</co>   <vtc>Test City</vtc>   <dist>Test District</dist>   <state>Maharashtra</state>   <pc>400001</pc>   <signature>BASE64_ENCODED_RSA_SIGNATURE</signature> </QRData> 

Note: Use Anon Aadhaar test circuits for development. Never use real Aadhaar data in testing.

Appendix D: UI/UX Mockups

[Include Figma/Design Links Here]

Key Screens:

Onboarding Flow:

Welcome screen

Aadhaar QR scan screen

Processing/proof generation

Biometric setup (FaceID)

Success confirmation

Home Screen:

Balance display (INR)

Pay/Receive buttons

Recent transactions

Settings

Payment Flow:

QR scanner

Payment confirmation

Biometric prompt

Success animation

Recovery Flow:

Re-scan Aadhaar

Wallet found confirmation

Re-register biometric

Design Principles:

Minimize text (use icons)

Large tap targets (44x44pt minimum)

High contrast for accessibility

Motion: Subtle, purposeful animations

Inspiration: Google Pay, PhonePe UX

15. Conclusion

Why This Will Win Track 1

Perfect Alignment with Track Goals: ✅ Invisible Blockchain: Gas abstraction, no addresses, no keys visible ✅ Biometric-First: FaceID/TouchID via Passkeys ✅ Aadhaar Identity: ZK proofs for registration, recovery ✅ UPI-Level Simplicity: QR scan → Biometric → Done ✅ Innovation: First Aadhaar + Stellar X-Ray integration ✅ Technical Excellence: Cutting-edge ZK, smart contracts, mobile dev

Competitive Advantages:

Timing: X-Ray just launched (Jan 7) - we're among first to use it

Market: 1.3B Aadhaar holders = massive addressable market

UX: Truly matches UPI simplicity (proven standard)

Security: Non-custodial + biometric + ZK privacy

Compliance: KYC via Aadhaar, regulatory-friendly

Post-Hackathon Potential:

Real product-market fit (India payments market)

Clear monetization path (interchange fees)

Scalable technology (Stellar handles 1000+ TPS)

Social impact (financial inclusion)

Next Steps

Immediate (Week 1):

Fork Anon Aadhaar boilerplate

Set up Stellar testnet accounts

Generate first ZK proof

Deploy test contract with X-Ray

Short-term (Weeks 2-4):

Build smart contracts

Develop mobile app

Conduct user testing

Prepare demo & presentation

Long-term (Post-Hackathon):

Security audit

Mainnet deployment

Beta launch (100 users)

Fundraising (if needed)

Full public launch

Document Version: 1.0 Last Updated: January 14, 2026 Authors: [Your Team Name] Contact: [Your Email] GitHub: [Repository Link]

License: MIT License (for open-s