// Base Identity Service - Interacts with IdentityRegistry on Base Sepolia
import { ethers } from 'ethers'
import { BASE_CONFIG, IDENTITY_REGISTRY_ABI } from './base-config'

// Create provider (read-only)
const provider = new ethers.JsonRpcProvider(BASE_CONFIG.rpcUrl)

// Create contract instance (read-only)
const contract = new ethers.Contract(
    BASE_CONFIG.identityRegistry,
    IDENTITY_REGISTRY_ABI,
    provider
)

/**
 * Convert Aadhaar nullifier to bytes32 hash for contract
 */
export function nullifierToBytes32(nullifier: string): string {
    // Pad nullifier to 32 bytes and hash it
    const nullifierBytes = ethers.toUtf8Bytes(nullifier)
    return ethers.keccak256(nullifierBytes)
}

/**
 * Check if a nullifier is already registered
 */
export async function isNullifierRegistered(nullifier: string): Promise<boolean> {
    try {
        const nullifierHash = nullifierToBytes32(nullifier)
        return await contract.isRegistered(nullifierHash)
    } catch (error) {
        console.error('[BASE] Error checking registration:', error)
        return false
    }
}

/**
 * Get wallet by nullifier (for recovery)
 */
export async function getWalletByNullifier(nullifier: string): Promise<{
    stellarAddress: string
    username: string
} | null> {
    try {
        const nullifierHash = nullifierToBytes32(nullifier)
        const [stellarAddress, username] = await contract.getWallet(nullifierHash)

        if (!stellarAddress || stellarAddress === '') {
            return null
        }

        return { stellarAddress, username }
    } catch (error) {
        console.error('[BASE] Error getting wallet:', error)
        return null
    }
}

/**
 * Register wallet on Base (requires wallet connection for signing)
 * For demo, we'll use a simple approach with a burner wallet
 */
export async function registerWalletOnBase(
    nullifier: string,
    stellarAddress: string,
    username: string = ''
): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
        console.log('[BASE] Registering wallet on Base Sepolia...')
        console.log('[BASE] Nullifier:', nullifier.substring(0, 20) + '...')
        console.log('[BASE] Stellar Address:', stellarAddress)

        const nullifierHash = nullifierToBytes32(nullifier)
        console.log('[BASE] Nullifier Hash:', nullifierHash)

        // Check if already registered
        const isRegistered = await contract.isRegistered(nullifierHash)
        if (isRegistered) {
            console.log('[BASE] Already registered!')
            return { success: true, txHash: 'already-registered' }
        }

        // For demo: Use a burner wallet with small amount of ETH
        // In production, you'd use WalletConnect or similar
        const DEMO_PRIVATE_KEY = '7d45d0e9ab3e11c876820f440ebd06e9bf28d4d8eb527324a4e07254c94d73b0'
        const signer = new ethers.Wallet(DEMO_PRIVATE_KEY, provider)
        const contractWithSigner = contract.connect(signer) as ethers.Contract

        console.log('[BASE] Sending transaction...')
        const tx = await contractWithSigner.registerWallet(
            nullifierHash,
            stellarAddress,
            username
        )

        console.log('[BASE] Transaction sent:', tx.hash)
        console.log('[BASE] Waiting for confirmation...')

        const receipt = await tx.wait()
        console.log('[BASE] ✅ Transaction confirmed!')
        console.log('[BASE] Block:', receipt.blockNumber)

        return { success: true, txHash: tx.hash }
    } catch (error: any) {
        console.error('[BASE] Registration error:', error)
        return {
            success: false,
            error: error.message || 'Unknown error'
        }
    }
}

/**
 * Recover wallet from Base using nullifier
 */
export async function recoverWalletFromBase(nullifier: string): Promise<{
    success: boolean
    stellarAddress?: string
    username?: string
    error?: string
}> {
    try {
        console.log('[BASE] Recovering wallet from Base...')

        const wallet = await getWalletByNullifier(nullifier)

        if (!wallet) {
            return { success: false, error: 'Wallet not found for this Aadhaar identity' }
        }

        console.log('[BASE] ✅ Wallet found:', wallet.stellarAddress)
        return {
            success: true,
            stellarAddress: wallet.stellarAddress,
            username: wallet.username
        }
    } catch (error: any) {
        console.error('[BASE] Recovery error:', error)
        return { success: false, error: error.message }
    }
}

// Alias for backward compatibility with AadhaarVerification import
export { registerWalletOnBase as registerIdentityOnBase }

/**
 * Recover identity from Base (alias for AadhaarRecovery component)
 */
export async function recoverIdentityFromBase(nullifier: string): Promise<{
    found: boolean
    stellarAddress?: string
    username?: string
}> {
    const result = await recoverWalletFromBase(nullifier)
    return {
        found: result.success,
        stellarAddress: result.stellarAddress,
        username: result.username
    }
}

/**
 * Get all registered identities (placeholder - would need indexing in production)
 */
export async function getAllRegisteredIdentities(): Promise<Array<{
    nullifierHash: string
    stellarAddress: string
    username: string
}>> {
    // In production, you'd query events or use The Graph
    // For demo, return empty array (recovery works via nullifier lookup)
    console.log('[BASE] getAllRegisteredIdentities called - would need indexer in production')
    return []
}


