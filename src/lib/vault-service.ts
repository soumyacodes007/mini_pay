'use client'

// Vault service for encrypted wallet backup to Supabase
// Enables cross-device wallet recovery using Aadhaar

import { supabase, VAULTS_TABLE, EncryptedVault, isSupabaseConfigured } from './supabase-config'
import {
    deriveEncryptionKey,
    hashNullifier,
    encryptStellarKey,
    decryptStellarKey,
    verifyDecryptedKey
} from './vault-crypto'

/**
 * Upload an encrypted vault to Supabase
 */
export async function uploadVault(
    aadhaarNullifier: string,
    stellarPrivateKey: string,
    stellarAddress: string,
    username?: string,
    miniPayId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('[VAULT] Uploading encrypted vault...')

        // For demo mode when Supabase isn't configured, use localStorage fallback
        if (!isSupabaseConfigured()) {
            console.log('[VAULT] Supabase not configured, using localStorage fallback')
            return uploadVaultLocal(aadhaarNullifier, stellarPrivateKey, stellarAddress, username, miniPayId)
        }

        // Derive encryption key from Aadhaar nullifier
        const encryptionKey = await deriveEncryptionKey(aadhaarNullifier)

        // Encrypt the Stellar private key
        const encryptedVault = await encryptStellarKey(stellarPrivateKey, encryptionKey)

        // Hash the nullifier for database storage
        const aadhaarHash = await hashNullifier(aadhaarNullifier)

        // Upsert to Supabase
        const { error } = await supabase
            .from(VAULTS_TABLE)
            .upsert({
                aadhaar_hash: aadhaarHash,
                encrypted_vault: encryptedVault,
                stellar_address: stellarAddress,
                username,
                minipay_id: miniPayId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'aadhaar_hash'
            })

        if (error) {
            console.error('[VAULT] Upload error:', error)
            return { success: false, error: error.message }
        }

        console.log('[VAULT] ✅ Vault uploaded successfully')
        return { success: true }
    } catch (error: any) {
        console.error('[VAULT] Upload failed:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Download and decrypt a vault from Supabase
 */
export async function downloadVault(
    aadhaarNullifier: string
): Promise<{
    success: boolean;
    privateKey?: string;
    stellarAddress?: string;
    username?: string;
    miniPayId?: string;
    error?: string
}> {
    try {
        console.log('[VAULT] Downloading encrypted vault...')

        // For demo mode when Supabase isn't configured, use localStorage fallback
        if (!isSupabaseConfigured()) {
            console.log('[VAULT] Supabase not configured, using localStorage fallback')
            return downloadVaultLocal(aadhaarNullifier)
        }

        // Hash the nullifier to look up in database
        const aadhaarHash = await hashNullifier(aadhaarNullifier)

        // Query Supabase
        const { data, error } = await supabase
            .from(VAULTS_TABLE)
            .select('*')
            .eq('aadhaar_hash', aadhaarHash)
            .single()

        if (error || !data) {
            console.log('[VAULT] No vault found for this Aadhaar')
            return { success: false, error: 'No wallet found for this Aadhaar identity' }
        }

        const vault = data as EncryptedVault

        // Derive decryption key from Aadhaar nullifier
        const decryptionKey = await deriveEncryptionKey(aadhaarNullifier)

        // Decrypt the private key
        const privateKey = await decryptStellarKey(vault.encrypted_vault, decryptionKey)

        // Verify the decrypted key matches the stored public address
        const isValid = await verifyDecryptedKey(privateKey, vault.stellar_address)
        if (!isValid) {
            console.error('[VAULT] Decryption verification failed!')
            return { success: false, error: 'Vault decryption verification failed' }
        }

        console.log('[VAULT] ✅ Vault decrypted successfully')
        return {
            success: true,
            privateKey,
            stellarAddress: vault.stellar_address,
            username: vault.username,
            miniPayId: vault.minipay_id
        }
    } catch (error: any) {
        console.error('[VAULT] Download failed:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Check if a vault exists for the given Aadhaar
 */
export async function checkVaultExists(
    aadhaarNullifier: string
): Promise<{ exists: boolean; stellarAddress?: string; miniPayId?: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return checkVaultExistsLocal(aadhaarNullifier)
        }

        const aadhaarHash = await hashNullifier(aadhaarNullifier)

        const { data, error } = await supabase
            .from(VAULTS_TABLE)
            .select('stellar_address, minipay_id')
            .eq('aadhaar_hash', aadhaarHash)
            .single()

        if (error || !data) {
            return { exists: false }
        }

        return {
            exists: true,
            stellarAddress: data.stellar_address,
            miniPayId: data.minipay_id
        }
    } catch {
        return { exists: false }
    }
}

/**
 * Update MiniPay ID in an existing vault
 */
export async function updateVaultMiniPayId(
    aadhaarNullifier: string,
    miniPayId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!isSupabaseConfigured()) {
            return updateVaultMiniPayIdLocal(aadhaarNullifier, miniPayId)
        }

        const aadhaarHash = await hashNullifier(aadhaarNullifier)

        const { error } = await supabase
            .from(VAULTS_TABLE)
            .update({
                minipay_id: miniPayId,
                updated_at: new Date().toISOString()
            })
            .eq('aadhaar_hash', aadhaarHash)

        if (error) {
            return { success: false, error: error.message }
        }

        console.log('[VAULT] ✅ MiniPay ID updated')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ==========================================
// LocalStorage Fallback (Demo Mode)
// ==========================================

const LOCAL_VAULT_KEY = 'minipay_encrypted_vaults'

interface LocalVaultStore {
    [aadhaarHash: string]: EncryptedVault
}

function getLocalVaults(): LocalVaultStore {
    try {
        const stored = localStorage.getItem(LOCAL_VAULT_KEY)
        return stored ? JSON.parse(stored) : {}
    } catch {
        return {}
    }
}

function saveLocalVaults(vaults: LocalVaultStore): void {
    localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(vaults))
}

async function uploadVaultLocal(
    aadhaarNullifier: string,
    stellarPrivateKey: string,
    stellarAddress: string,
    username?: string,
    miniPayId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const encryptionKey = await deriveEncryptionKey(aadhaarNullifier)
        const encryptedVault = await encryptStellarKey(stellarPrivateKey, encryptionKey)
        const aadhaarHash = await hashNullifier(aadhaarNullifier)

        const vaults = getLocalVaults()
        vaults[aadhaarHash] = {
            aadhaar_hash: aadhaarHash,
            encrypted_vault: encryptedVault,
            stellar_address: stellarAddress,
            username,
            minipay_id: miniPayId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
        saveLocalVaults(vaults)

        console.log('[VAULT-LOCAL] ✅ Vault saved to localStorage')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

async function downloadVaultLocal(
    aadhaarNullifier: string
): Promise<{
    success: boolean;
    privateKey?: string;
    stellarAddress?: string;
    username?: string;
    miniPayId?: string;
    error?: string
}> {
    try {
        const aadhaarHash = await hashNullifier(aadhaarNullifier)
        const vaults = getLocalVaults()
        const vault = vaults[aadhaarHash]

        if (!vault) {
            return { success: false, error: 'No wallet found for this Aadhaar identity' }
        }

        const decryptionKey = await deriveEncryptionKey(aadhaarNullifier)
        const privateKey = await decryptStellarKey(vault.encrypted_vault, decryptionKey)

        const isValid = await verifyDecryptedKey(privateKey, vault.stellar_address)
        if (!isValid) {
            return { success: false, error: 'Vault decryption verification failed' }
        }

        console.log('[VAULT-LOCAL] ✅ Vault decrypted from localStorage')
        return {
            success: true,
            privateKey,
            stellarAddress: vault.stellar_address,
            username: vault.username,
            miniPayId: vault.minipay_id
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

async function checkVaultExistsLocal(
    aadhaarNullifier: string
): Promise<{ exists: boolean; stellarAddress?: string; miniPayId?: string }> {
    const aadhaarHash = await hashNullifier(aadhaarNullifier)
    const vaults = getLocalVaults()
    const vault = vaults[aadhaarHash]

    if (!vault) {
        return { exists: false }
    }

    return {
        exists: true,
        stellarAddress: vault.stellar_address,
        miniPayId: vault.minipay_id
    }
}

async function updateVaultMiniPayIdLocal(
    aadhaarNullifier: string,
    miniPayId: string
): Promise<{ success: boolean; error?: string }> {
    const aadhaarHash = await hashNullifier(aadhaarNullifier)
    const vaults = getLocalVaults()

    if (!vaults[aadhaarHash]) {
        return { success: false, error: 'Vault not found' }
    }

    vaults[aadhaarHash].minipay_id = miniPayId
    vaults[aadhaarHash].updated_at = new Date().toISOString()
    saveLocalVaults(vaults)

    return { success: true }
}
