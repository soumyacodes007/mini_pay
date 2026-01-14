# Identity Registry on Base

Simple Solidity contract for storing Aadhaar nullifier → Stellar wallet mappings.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Device                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Passkey   │  │ Anon Aadhaar│  │  Stellar SDK    │ │
│  │   (Auth)    │  │  (ZK Proof) │  │   (Payments)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
           │                │                │
           │                │                │
           ▼                ▼                ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│   Device Auth    │  │    Base      │  │   Stellar    │
│   (WebAuthn)     │  │  (Identity)  │  │  (Payments)  │
└──────────────────┘  └──────────────┘  └──────────────┘
```

## Why Base?

1. **Cheap** - ~$0.001 per registration
2. **Fast** - 2 second block times
3. **EVM** - Anon Aadhaar works natively
4. **Paymaster** - Can sponsor user gas fees

## Deployment

### Using Foundry

```bash
# Install foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Deploy to Base Sepolia (testnet)
forge create --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  contracts/base/IdentityRegistry.sol:IdentityRegistry

# Deploy to Base Mainnet
forge create --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  contracts/base/IdentityRegistry.sol:IdentityRegistry
```

### Using Remix

1. Go to https://remix.ethereum.org
2. Create new file, paste IdentityRegistry.sol
3. Compile with Solidity 0.8.20
4. Deploy to Base Sepolia via MetaMask

## Contract Functions

### Write Functions

- `registerWallet(nullifierHash, stellarAddress, username)` - Register identity
- `updateWallet(nullifierHash, newStellarAddress)` - Update wallet

### Read Functions (Free)

- `getWallet(nullifierHash)` - Get wallet by nullifier (for recovery)
- `isRegistered(nullifierHash)` - Check if registered
- `totalRegistrations()` - Total count

## Gas Costs (Base)

| Function | Gas | Cost (@ $2000 ETH) |
|----------|-----|-------------------|
| registerWallet | ~50,000 | ~$0.001 |
| getWallet | 0 | Free (view) |
| isRegistered | 0 | Free (view) |

## Integration

The frontend calls this contract via ethers.js/viem:

```typescript
// Registration (backend sponsors gas)
const nullifierHash = keccak256(nullifier)
await contract.registerWallet(nullifierHash, stellarAddress, username)

// Recovery (free read)
const [stellarAddress, username] = await contract.getWallet(nullifierHash)
```
