'use client'

// Identity storage for Aadhaar-based wallet recovery
// Uses both localStorage (for current device) and a simulated "backend" (for cross-device)
// In production, this would be on-chain via Soroban contracts

import { isValidStellarAddress } from './stellar-config'

const IDENTITY_KEY = 'invisiblerail_aadhaar_identity'
const GLOBAL_REGISTRY_KEY = 'invisiblerail_global_identity_registry'

interface StoredIdentity {
    nullifier: string
    walletAddress: string  // Stellar G... address
    verifiedAt: string
    username?: string
}

// Simulated "backend" storage - persists in localStorage but separate from device-specific data
// In production, this would query Soroban contracts or Mercury indexer
function getGlobalRegistry(): Record<string, StoredIdentity> {
    try {
        const stored = localStorage.getItem(GLOBAL_REGISTRY_KEY)
        if (!stored) return {}
        return JSON.parse(stored)
    } catch {
        return {}
    }
}

function saveGlobalRegistry(registry: Record<string, StoredIdentity>): void {
    localStorage.setItem(GLOBAL_REGISTRY_KEY, JSON.stringify(registry))
}

// Store identity - saves to both local and "global" registry
export function storeIdentity(nullifier: string, walletAddress: string, username?: string): void {
    // Validate Stellar address format
    if (!isValidStellarAddress(walletAddress)) {
        console.error('[IDENTITY] Invalid Stellar address format:', walletAddress)
        return
    }

    const identity: StoredIdentity = {
        nullifier,
        walletAddress,
        verifiedAt: new Date().toISOString(),
        username,
    }

    // Save to local storage (current device)
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))

    // Save to "global" registry (simulates backend/on-chain)
    const registry = getGlobalRegistry()
    registry[nullifier] = identity
    saveGlobalRegistry(registry)

    console.log('[IDENTITY] ✅ Stored identity for recovery:', {
        nullifier: nullifier.slice(0, 20) + '...',
        walletAddress: walletAddress.slice(0, 8) + '...' + walletAddress.slice(-4),
        username
    })
}

// Get identity from local storage (current device)
export function getStoredIdentity(): StoredIdentity | null {
    try {
        const stored = localStorage.getItem(IDENTITY_KEY)
        if (!stored) return null
        return JSON.parse(stored) as StoredIdentity
    } catch {
        return null
    }
}

// Match identity from "global" registry (simulates cross-device recovery)
// This is the key function for recovery - it looks up by nullifier
export function matchIdentity(nullifier: string): { matched: boolean; walletAddress?: string; username?: string } {
    // First check global registry (simulates backend lookup)
    const registry = getGlobalRegistry()
    const globalMatch = registry[nullifier]

    if (globalMatch) {
        console.log('[IDENTITY] ✅ Found in global registry:', {
            walletAddress: globalMatch.walletAddress.slice(0, 8) + '...' + globalMatch.walletAddress.slice(-4),
            username: globalMatch.username
        })
        return {
            matched: true,
            walletAddress: globalMatch.walletAddress,
            username: globalMatch.username,
        }
    }

    // Fallback to local storage
    const local = getStoredIdentity()
    if (local && local.nullifier === nullifier) {
        console.log('[IDENTITY] ✅ Found in local storage')
        return {
            matched: true,
            walletAddress: local.walletAddress,
            username: local.username,
        }
    }

    console.log('[IDENTITY] ❌ No matching identity found for nullifier')
    return { matched: false }
}

// Check if any identity exists (for showing recovery option)
export function hasAnyStoredIdentity(): boolean {
    const registry = getGlobalRegistry()
    return Object.keys(registry).length > 0
}

// Get all stored identities (for debugging)
export function getAllIdentities(): StoredIdentity[] {
    const registry = getGlobalRegistry()
    return Object.values(registry)
}

// Clear identity (for testing)
export function clearIdentity(): void {
    localStorage.removeItem(IDENTITY_KEY)
    console.log('[IDENTITY] Cleared local identity')
}

// Clear all identities (for testing)
export function clearAllIdentities(): void {
    localStorage.removeItem(IDENTITY_KEY)
    localStorage.removeItem(GLOBAL_REGISTRY_KEY)
    console.log('[IDENTITY] Cleared all identities')
}
