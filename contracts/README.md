# Invisible Rail - Soroban Smart Contracts

## Overview

These contracts enable Aadhaar-based wallet recovery on Stellar using zero-knowledge proofs.
Built for **Stellar Protocol 25 (X-Ray)** with native BN254 support.

## Protocol 25 X-Ray Features Used

- **CAP-0074: BN254 Host Functions** - Native elliptic curve operations for ZK proofs
  - `bn254_g1_add()` - G1 point addition
  - `bn254_g1_mul()` - G1 scalar multiplication
  - `bn254_pairing_check()` - Multi-pairing verification
- **CAP-0075: Poseidon Hash** - ZK-optimized hashing (for nullifiers)

## Contracts

### 1. WalletFactory (`wallet_factory/`)
Stores nullifier → wallet address mappings for Aadhaar-based recovery.

**Key Functions:**
- `register_wallet(nullifier, wallet)` - Register a wallet with verified Aadhaar
- `get_wallet(nullifier)` - Lookup wallet by nullifier (for recovery)
- `is_registered(nullifier)` - Check if nullifier is already used
- `update_wallet(nullifier, old, new)` - Migrate to new wallet

### 2. ZKVerifier (`zk_verifier/`)
Verifies Groth16 zero-knowledge proofs from Anon-Aadhaar using BN254 curve.

**Key Functions:**
- `initialize(admin, nullifier_seed)` - Initialize with app-specific seed
- `set_verification_key(...)` - Set the Anon-Aadhaar circuit VK
- `verify_aadhaar_proof(proof, inputs)` - Verify a Groth16 proof

**Groth16 Verification Equation:**
```
e(A, B) = e(alpha, beta) * e(vk_x, gamma) * e(C, delta)
where vk_x = IC[0] + sum(public_inputs[i] * IC[i+1])
```

## Building

```bash
# Install Stellar CLI (requires Protocol 25 support)
cargo install --locked stellar-cli

# Build contracts
cd contracts/wallet_factory/contracts/hello-world
stellar contract build

cd ../../zk_verifier/contracts/hello-world
stellar contract build
```

## Testing

```bash
# Run tests
cargo test
```

## Deployment (Testnet - Protocol 25)

**Note:** Protocol 25 is live on Testnet as of January 7, 2026.

```bash
# Deploy ZK verifier first
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/zk_verifier.wasm \
  --network testnet \
  --source YOUR_SECRET_KEY

# Initialize ZK verifier
stellar contract invoke \
  --id ZK_VERIFIER_CONTRACT_ID \
  --network testnet \
  -- initialize \
  --admin YOUR_ADDRESS \
  --nullifier_seed 0x000000000000000000000000000000000000000000000000000000000000303912345

# Deploy wallet factory
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/wallet_factory.wasm \
  --network testnet \
  --source YOUR_SECRET_KEY

# Initialize wallet factory
stellar contract invoke \
  --id WALLET_FACTORY_CONTRACT_ID \
  --network testnet \
  -- initialize \
  --admin YOUR_ADDRESS \
  --verifier ZK_VERIFIER_CONTRACT_ID
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Web/Mobile)                          │
├─────────────────────────────────────────────────────────────────────┤
│  Anon-Aadhaar SDK                                                   │
│  - Scan Aadhaar QR                                                  │
│  - Generate Groth16 proof (client-side)                             │
│  - Extract nullifier                                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STELLAR BLOCKCHAIN (Protocol 25)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐          ┌─────────────────┐                  │
│  │  WalletFactory  │◀────────▶│   ZKVerifier    │                  │
│  │                 │          │                 │                  │
│  │ - nullifier map │          │ - BN254 pairing │                  │
│  │ - register      │          │ - Groth16 verify│                  │
│  │ - recover       │          │ - VK storage    │                  │
│  └─────────────────┘          └─────────────────┘                  │
│           │                           │                             │
│           │    X-Ray Host Functions   │                             │
│           │    (CAP-0074 BN254)       │                             │
│           ▼                           ▼                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Stellar Core (Protocol 25)                      │   │
│  │  - bn254_g1_add()                                            │   │
│  │  - bn254_g1_mul()                                            │   │
│  │  - bn254_pairing_check()                                     │   │
│  │  - poseidon_hash()                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Security Notes

1. **Nullifier Uniqueness**: Each Aadhaar can only register ONE wallet (Sybil resistance)
2. **ZK Privacy**: Aadhaar data never leaves the device - only proof is submitted
3. **Recovery Auth**: Wallet updates require old wallet signature
4. **Admin Controls**: VK can only be set by admin
5. **Nullifier Seed**: App-specific seed prevents cross-app nullifier reuse

## BN254 Curve Parameters

```
Field prime p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
Curve order r = 21888242871839275222246405745257275088548364400416034343698204186575808495617
Curve equation: Y^2 = X^3 + 3
Embedding degree: 12
```

## Status

| Contract | Status | Notes |
|----------|--------|-------|
| WalletFactory | ✅ Production-ready | Fully functional |
| ZKVerifier | ⚠️ Testnet-ready | Full BN254 pairing when Protocol 25 mainnet launches (Jan 22, 2026) |

## Protocol 25 Timeline

- **January 7, 2026**: Testnet upgrade ✅
- **January 22, 2026**: Mainnet upgrade (scheduled)

## References

- [CAP-0074: BN254 Host Functions](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0074.md)
- [CAP-0075: Poseidon Hash](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0075.md)
- [Anon-Aadhaar Documentation](https://documentation.anon-aadhaar.pse.dev/)
- [BN254 Curve Specification](https://hackmd.io/@jpw/bn254)
- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf)

## License

MIT
