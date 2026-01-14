// Stellar Network Configuration for Invisible Rail
// Non-custodial payment layer on Stellar Protocol 25

import { Networks, Asset } from '@stellar/stellar-sdk'

// Network Configuration
export const STELLAR_CONFIG = {
    network: Networks.TESTNET,
    networkPassphrase: Networks.TESTNET,
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    mercuryUrl: 'https://api.mercurydata.app/graphql',
    launchtubeUrl: 'https://api.launchtube.xyz/v1'
} as const

// USDC Asset on Stellar Testnet
// Note: Using Circle's testnet USDC issuer
export const USDC_ASSET = new Asset(
    'USDC',
    'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' // Circle USDC issuer on testnet
)

// Soroban Contract Addresses (kept for reference, identity now on Base)
// export const CONTRACTS = {
//     walletFactory: 'CC4CG6Q4UPOHY6ATNOVEK7ZLY5YZL74FZVA4FCDMZY47UMJSMFLCPEG5',
//     zkVerifier: 'CATK34GW5MOOUS4LKER6Y7M35YWQPHG2JBUVIHFLHS7NSUGW2OS57YG6',
// } as const

// App Constants
export const APP_NAME = 'Invisible Rail'
export const APP_DESCRIPTION = 'Pay with stablecoins as easily as UPI - powered by Stellar'

// SEP-0007 Payment URI format
export function createPaymentUri(
    destination: string,
    amount: string,
    memo?: string
): string {
    const params = new URLSearchParams({
        destination,
        amount,
        asset_code: 'USDC',
        asset_issuer: USDC_ASSET.getIssuer()!
    })

    if (memo) {
        params.set('memo', memo)
        params.set('memo_type', 'MEMO_TEXT')
    }

    return `web+stellar:pay?${params.toString()}`
}

// Parse SEP-0007 Payment URI
export function parsePaymentUri(uri: string): {
    destination: string
    amount: string
    memo?: string
    assetCode?: string
} | null {
    try {
        if (!uri.startsWith('web+stellar:pay?')) {
            return null
        }

        const paramString = uri.replace('web+stellar:pay?', '')
        const params = new URLSearchParams(paramString)

        const destination = params.get('destination')
        const amount = params.get('amount')

        if (!destination || !amount) {
            return null
        }

        return {
            destination,
            amount,
            memo: params.get('memo') ?? undefined,
            assetCode: params.get('asset_code') ?? 'USDC'
        }
    } catch {
        return null
    }
}

// Validate Stellar public key format
export function isValidStellarAddress(address: string): boolean {
    return /^G[A-Z2-7]{55}$/.test(address)
}

// Shorten Stellar address for display
export function shortenAddress(address: string): string {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 4)}...${address.slice(-4)}`
}
