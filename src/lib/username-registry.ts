'use client'

// Simple localStorage-based username registry for demo
// In production, this would use Stellar Federation Protocol (SEP-0002)

import { isValidStellarAddress, shortenAddress } from './stellar-config'

const REGISTRY_KEY = 'invisiblerail_username_registry'

interface UsernameEntry {
    username: string
    address: string  // Stellar G... address
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
export function registerUsername(username: string, address: string): boolean {
    const cleanUsername = username.toLowerCase().trim()

    // Validation
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 20) {
        return false
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
        return false
    }

    // Validate Stellar address
    if (!isValidStellarAddress(address)) {
        console.error('[USERNAME] Invalid Stellar address:', address)
        return false
    }

    const registry = getRegistry()

    // Check if username is taken
    if (registry[cleanUsername]) {
        if (registry[cleanUsername].address === address) {
            return true // Already registered to this address
        }
        return false // Username taken by another address
    }

    // Check if address already has a username
    const existingEntry = Object.values(registry).find(
        entry => entry.address === address
    )
    if (existingEntry) {
        return false // Address already has a username
    }

    // Register
    registry[cleanUsername] = {
        username: cleanUsername,
        address: address,
        registeredAt: new Date().toISOString()
    }

    saveRegistry(registry)
    console.log(`[USERNAME] Registered: ${cleanUsername}@rail → ${shortenAddress(address)}`)

    return true
}

// Resolve username to address
export function resolveUsername(username: string): string | null {
    const cleanUsername = username.toLowerCase().trim().replace('@rail', '')
    const registry = getRegistry()

    const entry = registry[cleanUsername]
    if (entry) {
        console.log(`[USERNAME] Resolved: ${cleanUsername}@rail → ${shortenAddress(entry.address)}`)
        return entry.address
    }

    return null
}

// Get username for an address
export function getUsername(address: string): string | null {
    const registry = getRegistry()

    const entry = Object.values(registry).find(
        e => e.address === address
    )

    return entry ? entry.username : null
}

// Check if input is a username (not a Stellar address)
export function isUsername(input: string): boolean {
    // If it starts with G and is 56 chars, it's a Stellar address
    if (isValidStellarAddress(input)) {
        return false
    }
    // Otherwise treat as username
    return true
}

// Format display: show username if available, otherwise short address
export function formatRecipient(addressOrUsername: string): string {
    if (isUsername(addressOrUsername)) {
        return `${addressOrUsername.replace('@rail', '')}@rail`
    }

    // Check if address has a username
    const username = getUsername(addressOrUsername)
    if (username) {
        return `${username}@rail`
    }

    // Return short address
    return shortenAddress(addressOrUsername)
}
