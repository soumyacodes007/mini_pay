'use client'

// Vault encryption utilities using AES-256-GCM
// Industry-standard encryption for non-custodial wallet backup
// Uses native Web Crypto API (no external dependencies)

// Salt for key derivation - unique to MiniPay
const VAULT_SALT = 'minipay_vault_v1'
const PBKDF2_ITERATIONS = 100000  // Slow = secure

/**
 * Hash a string using SHA-256
 */
async function sha256(data: string): Promise<Uint8Array> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    return new Uint8Array(hashBuffer)
}

/**
 * Derive a 256-bit encryption key from Aadhaar nullifier using PBKDF2
 */
export async function deriveEncryptionKey(aadhaarNullifier: string): Promise<Uint8Array> {
    const encoder = new TextEncoder()
    const nullifierBytes = encoder.encode(aadhaarNullifier)
    const saltBytes = encoder.encode(VAULT_SALT)

    // Import the nullifier as a key for PBKDF2
    const baseKey = await crypto.subtle.importKey(
        'raw',
        nullifierBytes,
        'PBKDF2',
        false,
        ['deriveBits']
    )

    // Derive 256 bits using PBKDF2 with SHA-256
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBytes,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        baseKey,
        256 // 32 bytes
    )

    return new Uint8Array(derivedBits)
}

/**
 * Hash the Aadhaar nullifier for use as database key
 * This prevents storing the raw nullifier in the database
 */
export async function hashNullifier(aadhaarNullifier: string): Promise<string> {
    const hash = await sha256(aadhaarNullifier)
    return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Encrypt Stellar private key using AES-256-GCM
 * Returns: base64(IV) + '.' + base64(ciphertext)
 */
export async function encryptStellarKey(
    stellarPrivateKey: string,
    encryptionKey: Uint8Array
): Promise<string> {
    // Generate random 12-byte IV (nonce) for GCM
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Import the key for AES-GCM
    const keyObject = await crypto.subtle.importKey(
        'raw',
        encryptionKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    )

    // Encrypt the private key
    const plaintext = new TextEncoder().encode(stellarPrivateKey)
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyObject,
        plaintext
    )

    // Return IV.ciphertext format (both base64 encoded)
    const ivB64 = btoa(String.fromCharCode(...iv))
    const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)))

    return `${ivB64}.${ciphertextB64}`
}

/**
 * Decrypt Stellar private key using AES-256-GCM
 * Input format: base64(IV) + '.' + base64(ciphertext)
 */
export async function decryptStellarKey(
    vault: string,
    encryptionKey: Uint8Array
): Promise<string> {
    // Parse IV and ciphertext
    const [ivB64, ciphertextB64] = vault.split('.')
    if (!ivB64 || !ciphertextB64) {
        throw new Error('Invalid vault format')
    }

    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0))
    const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0))

    // Import the key for AES-GCM
    const keyObject = await crypto.subtle.importKey(
        'raw',
        encryptionKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    )

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        keyObject,
        ciphertext
    )

    return new TextDecoder().decode(plaintext)
}

/**
 * Verify that a decrypted key matches the expected public address
 * This provides an integrity check after decryption
 */
export async function verifyDecryptedKey(
    privateKey: string,
    expectedPublicKey: string
): Promise<boolean> {
    try {
        // Dynamically import Stellar SDK to avoid SSR issues
        const { Keypair } = await import('@stellar/stellar-sdk')
        const keypair = Keypair.fromSecret(privateKey)
        return keypair.publicKey() === expectedPublicKey
    } catch {
        return false
    }
}
