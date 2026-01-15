'use client'

// Username registry with Supabase sync + localStorage fallback
// Usernames are stored in both localStorage (fast) and Supabase (persistent)

import { isValidStellarAddress, shortenAddress } from './stellar-config'
import { supabase, isSupabaseConfigured } from './supabase-config'

const REGISTRY_KEY = 'invisiblerail_username_registry'

interface UsernameEntry {
    username: string
    address: string  // Stellar G... address
    registeredAt: string
}

// ===========================================
// LOCAL STORAGE (Fast, Offline Access)
// ===========================================

function getRegistry(): Record<string, UsernameEntry> {
    try {
        const stored = localStorage.getItem(REGISTRY_KEY)
        if (!stored) return {}
        return JSON.parse(stored)
    } catch {
        return {}
    }
}

function saveRegistry(registry: Record<string, UsernameEntry>): void {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
}

// ===========================================
// SUPABASE SYNC (Persistent, Cross-Device)
// Uses encrypted_vaults table with minipay_id column
// ===========================================

// Sync username to Supabase (update or create in encrypted_vaults)
async function syncToSupabase(username: string, address: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
        console.log('[USERNAME] Supabase not configured, skipping sync')
        return false
    }

    try {
        console.log('[USERNAME] Syncing to Supabase:', username, '→', address.slice(0, 8) + '...')

        // Check if this minipay_id already exists in any vault
        const { data: existing } = await supabase
            .from('encrypted_vaults')
            .select('minipay_id, stellar_address')
            .eq('minipay_id', username)
            .single()

        if (existing) {
            if (existing.stellar_address === address) {
                console.log('[USERNAME] ✅ Username already registered to this address')
                return true
            }
            console.log('[USERNAME] ❌ Username taken by another address')
            return false
        }

        // Check if this stellar address has a vault, update its minipay_id
        const { data: existingVault } = await supabase
            .from('encrypted_vaults')
            .select('stellar_address, minipay_id, aadhaar_hash')
            .eq('stellar_address', address)
            .single()

        if (existingVault) {
            // Update the existing vault with the minipay_id
            const { error } = await supabase
                .from('encrypted_vaults')
                .update({
                    minipay_id: username,
                    updated_at: new Date().toISOString()
                })
                .eq('stellar_address', address)

            if (error) {
                console.error('[USERNAME] Supabase update error:', error.message)
                return false
            }
            console.log('[USERNAME] ✅ Updated existing vault with minipay_id')
            return true
        }

        // No vault exists yet - CREATE a new row with stellar_address as placeholder
        // This allows immediate username registration before Aadhaar verification
        console.log('[USERNAME] Creating new vault entry for username...')

        // Generate a placeholder aadhaar_hash based on stellar_address
        // This will be updated when user verifies Aadhaar
        const placeholderHash = 'pending_' + address.slice(0, 20)

        const { error } = await supabase
            .from('encrypted_vaults')
            .insert({
                aadhaar_hash: placeholderHash,
                stellar_address: address,
                encrypted_vault: '', // Empty until Aadhaar verified
                minipay_id: username,
                username: username,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })

        if (error) {
            console.error('[USERNAME] Supabase insert error:', error.message)
            // If insert fails (e.g., duplicate), try update instead
            if (error.message.includes('duplicate') || error.message.includes('unique')) {
                console.log('[USERNAME] Row exists, attempting update...')
                const { error: updateError } = await supabase
                    .from('encrypted_vaults')
                    .update({
                        minipay_id: username,
                        updated_at: new Date().toISOString()
                    })
                    .eq('stellar_address', address)

                if (!updateError) {
                    console.log('[USERNAME] ✅ Updated via fallback')
                    return true
                }
            }
            return false
        }

        console.log('[USERNAME] ✅ Created new vault with minipay_id')
        return true
    } catch (err: any) {
        console.error('[USERNAME] Supabase sync failed:', err.message)
        return false
    }
}

// Resolve username from Supabase (look up minipay_id in encrypted_vaults)
async function resolveFromSupabase(username: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null

    try {
        const { data, error } = await supabase
            .from('encrypted_vaults')
            .select('stellar_address')
            .eq('minipay_id', username.toLowerCase())
            .single()

        if (error || !data) return null
        return data.stellar_address
    } catch {
        return null
    }
}

// ===========================================
// PUBLIC API
// ===========================================

// Register a username for an address
export function registerUsername(username: string, address: string): boolean {
    const cleanUsername = username.toLowerCase().trim()

    // Validation
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 20) {
        console.error('[USERNAME] Invalid username length')
        return false
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
        console.error('[USERNAME] Invalid username characters')
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
        console.error('[USERNAME] Username already taken')
        return false // Username taken by another address
    }

    // Register locally
    registry[cleanUsername] = {
        username: cleanUsername,
        address: address,
        registeredAt: new Date().toISOString()
    }

    saveRegistry(registry)
    console.log(`[USERNAME] ✅ Registered locally: ${cleanUsername}@minipay → ${shortenAddress(address)}`)

    // Sync to Supabase in background (non-blocking)
    syncToSupabase(cleanUsername, address)
        .then(success => {
            if (success) {
                console.log(`[USERNAME] ✅ Synced to cloud: ${cleanUsername}`)
            }
        })
        .catch(err => console.error('[USERNAME] Background sync failed:', err))

    return true
}

// Resolve username to address (checks local first, then Supabase)
export function resolveUsername(username: string): string | null {
    const cleanUsername = username.toLowerCase().trim().replace('@rail', '').replace('@minipay', '')
    const registry = getRegistry()

    // Check local first (fast)
    const entry = registry[cleanUsername]
    if (entry) {
        console.log(`[USERNAME] Resolved locally: ${cleanUsername} → ${shortenAddress(entry.address)}`)
        return entry.address
    }

    // Not found locally - try Supabase async (will be null on first call)
    // For now return null, the caller can handle async resolution
    console.log(`[USERNAME] Not found locally: ${cleanUsername}`)
    return null
}

// Async version that checks Supabase
export async function resolveUsernameAsync(username: string): Promise<string | null> {
    const cleanUsername = username.toLowerCase().trim().replace('@rail', '').replace('@minipay', '')

    // Check local first
    const local = resolveUsername(cleanUsername)
    if (local) return local

    // Try Supabase
    const supabaseResult = await resolveFromSupabase(cleanUsername)
    if (supabaseResult) {
        // Cache locally for next time
        const registry = getRegistry()
        registry[cleanUsername] = {
            username: cleanUsername,
            address: supabaseResult,
            registeredAt: new Date().toISOString()
        }
        saveRegistry(registry)
        console.log(`[USERNAME] Resolved from Supabase: ${cleanUsername} → ${shortenAddress(supabaseResult)}`)
        return supabaseResult
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
    if (isValidStellarAddress(input)) {
        return false
    }
    return true
}

// Format display: show username if available, otherwise short address
export function formatRecipient(addressOrUsername: string): string {
    if (isUsername(addressOrUsername)) {
        return `${addressOrUsername.replace('@rail', '').replace('@minipay', '')}@minipay`
    }

    const username = getUsername(addressOrUsername)
    if (username) {
        return `${username}@minipay`
    }

    return shortenAddress(addressOrUsername)
}

