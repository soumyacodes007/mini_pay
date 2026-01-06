'use client'

// Simple localStorage-based username registry for demo
// In production, this would be on-chain or in a backend

const REGISTRY_KEY = 'minipay_username_registry'

interface UsernameEntry {
    username: string
    address: string
    registeredAt: string
}

// Get all registered usernames
function getRegistry(): Record<string, UsernameEntry> {
    try {
        const stored = localStorage.getItem(REGISTRY_KEY)
        if (!stored) return {}
        return JSON.parse(stored)
    } catch {
        return {}
    }
}

// Save registry
function saveRegistry(registry: Record<string, UsernameEntry>): void {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
}

// Register a username for an address
export function registerUsername(username: string, address: string): { success: boolean; error?: string } {
    const cleanUsername = username.toLowerCase().trim()
    
    // Validation
    if (!cleanUsername) {
        return { success: false, error: 'Username cannot be empty' }
    }
    
    if (cleanUsername.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' }
    }
    
    if (cleanUsername.length > 20) {
        return { success: false, error: 'Username must be less than 20 characters' }
    }
    
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
        return { success: false, error: 'Username can only contain letters, numbers, and underscore' }
    }
    
    const registry = getRegistry()
    
    // Check if username is taken
    if (registry[cleanUsername]) {
        if (registry[cleanUsername].address.toLowerCase() === address.toLowerCase()) {
            return { success: true } // Already registered to this address
        }
        return { success: false, error: 'Username already taken' }
    }
    
    // Check if address already has a username
    const existingEntry = Object.values(registry).find(
        entry => entry.address.toLowerCase() === address.toLowerCase()
    )
    if (existingEntry) {
        return { success: false, error: `You already have username: ${existingEntry.username}` }
    }
    
    // Register
    registry[cleanUsername] = {
        username: cleanUsername,
        address: address,
        registeredAt: new Date().toISOString()
    }
    
    saveRegistry(registry)
    console.log(`[USERNAME] Registered: ${cleanUsername}@minipay → ${address}`)
    
    return { success: true }
}

// Resolve username to address
export function resolveUsername(username: string): string | null {
    const cleanUsername = username.toLowerCase().trim().replace('@minipay', '')
    const registry = getRegistry()
    
    const entry = registry[cleanUsername]
    if (entry) {
        console.log(`[USERNAME] Resolved: ${cleanUsername}@minipay → ${entry.address}`)
        return entry.address
    }
    
    return null
}

// Get username for an address
export function getUsername(address: string): string | null {
    const registry = getRegistry()
    
    const entry = Object.values(registry).find(
        e => e.address.toLowerCase() === address.toLowerCase()
    )
    
    return entry ? entry.username : null
}

// Check if input is a username (not an address)
export function isUsername(input: string): boolean {
    // If it starts with 0x and is 42 chars, it's an address
    if (input.startsWith('0x') && input.length === 42) {
        return false
    }
    // Otherwise treat as username
    return true
}

// Format display: show username if available, otherwise short address
export function formatRecipient(addressOrUsername: string): string {
    if (isUsername(addressOrUsername)) {
        return `${addressOrUsername.replace('@minipay', '')}@minipay`
    }
    
    // Check if address has a username
    const username = getUsername(addressOrUsername)
    if (username) {
        return `${username}@minipay`
    }
    
    // Return short address
    return `${addressOrUsername.slice(0, 6)}...${addressOrUsername.slice(-4)}`
}
