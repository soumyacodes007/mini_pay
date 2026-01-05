'use client'

// Simple localStorage-based identity storage for demo
// In production, this would be on-chain or in a secure backend

const IDENTITY_KEY = 'minipay_aadhaar_identity'

interface StoredIdentity {
    nullifier: string
    walletAddress: string
    verifiedAt: string
}

export function storeIdentity(nullifier: string, walletAddress: string): void {
    const identity: StoredIdentity = {
        nullifier,
        walletAddress,
        verifiedAt: new Date().toISOString(),
    }
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
    console.log('[IDENTITY] Stored identity for recovery:', { nullifier: nullifier.slice(0, 10) + '...', walletAddress })
}

export function getStoredIdentity(): StoredIdentity | null {
    try {
        const stored = localStorage.getItem(IDENTITY_KEY)
        if (!stored) return null
        return JSON.parse(stored) as StoredIdentity
    } catch {
        return null
    }
}

export function matchIdentity(nullifier: string): { matched: boolean; walletAddress?: string } {
    const stored = getStoredIdentity()
    if (!stored) {
        console.log('[IDENTITY] No stored identity found')
        return { matched: false }
    }

    const matched = stored.nullifier === nullifier
    console.log('[IDENTITY] Identity match:', matched)

    return {
        matched,
        walletAddress: matched ? stored.walletAddress : undefined,
    }
}

export function clearIdentity(): void {
    localStorage.removeItem(IDENTITY_KEY)
    console.log('[IDENTITY] Cleared stored identity')
}
