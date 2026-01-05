import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

// Base Sepolia RPC
export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'MiniPay India',
      preference: 'smartWalletOnly', // Force Smart Wallet with Passkeys
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
})

// USDC Contract on Base Sepolia
export const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const

// App Constants
export const APP_NAME = 'MiniPay India'
export const APP_DESCRIPTION = 'Pay with stablecoins as easily as UPI'
