'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Horizon, Keypair, Networks } from '@stellar/stellar-sdk'
import { STELLAR_CONFIG, USDC_ASSET, isValidStellarAddress } from '@/lib/stellar-config'

interface StellarWallet {
    publicKey: string
    isConnected: boolean
    balance: string
    usdcBalance: string
    credentialId?: string
}

interface StellarContextType {
    wallet: StellarWallet | null
    isConnecting: boolean
    error: string | null
    connect: () => Promise<void>
    disconnect: () => void
    refreshBalance: () => Promise<void>
    signTransaction: (xdr: string) => Promise<string>
    createUSDCTrustline: () => Promise<boolean>
}

const StellarContext = createContext<StellarContextType | null>(null)

const WALLET_STORAGE_KEY = 'invisiblerail_wallet'
const CREDENTIAL_STORAGE_KEY = 'invisiblerail_credential'

// Derive keypair from credential ID (deterministic)
function deriveKeypairFromCredential(credentialId: string): Keypair {
    const encoder = new TextEncoder()
    const data = encoder.encode(credentialId + '_stellar_wallet_v1')

    const seed = new Uint8Array(32)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data[i]
        hash = hash & hash
        seed[i % 32] ^= (hash & 0xFF)
    }

    return Keypair.fromRawEd25519Seed(Buffer.from(seed))
}

export function StellarProvider({ children }: { children: ReactNode }) {
    const [wallet, setWallet] = useState<StellarWallet | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [keypair, setKeypair] = useState<Keypair | null>(null)

    const horizon = new Horizon.Server(STELLAR_CONFIG.horizonUrl)

    // Load saved wallet
    useEffect(() => {
        const savedWallet = localStorage.getItem(WALLET_STORAGE_KEY)
        if (savedWallet) {
            try {
                const parsed = JSON.parse(savedWallet)
                if (parsed.publicKey && isValidStellarAddress(parsed.publicKey)) {
                    setWallet({
                        publicKey: parsed.publicKey,
                        isConnected: true,
                        balance: '0',
                        usdcBalance: '0',
                        credentialId: parsed.credentialId
                    })
                    if (parsed.credentialId) {
                        setKeypair(deriveKeypairFromCredential(parsed.credentialId))
                    }
                }
            } catch {
                localStorage.removeItem(WALLET_STORAGE_KEY)
            }
        }
    }, [])

    const refreshBalance = useCallback(async () => {
        if (!wallet?.publicKey) return

        try {
            const account = await horizon.loadAccount(wallet.publicKey)

            let xlmBalance = '0'
            let usdcBalance = '0'

            for (const balance of account.balances) {
                if (balance.asset_type === 'native') {
                    xlmBalance = balance.balance
                } else if (
                    balance.asset_type === 'credit_alphanum4' &&
                    balance.asset_code === 'USDC' &&
                    balance.asset_issuer === USDC_ASSET.getIssuer()
                ) {
                    usdcBalance = balance.balance
                }
            }

            setWallet(prev => prev ? { ...prev, balance: xlmBalance, usdcBalance } : null)
        } catch {
            console.log('[STELLAR] Account not funded yet')
        }
    }, [wallet?.publicKey])

    useEffect(() => {
        if (wallet?.isConnected) refreshBalance()
    }, [wallet?.isConnected, refreshBalance])

    // TRY to find existing passkey first (discoverable credentials)
    const tryDiscoverExistingPasskey = async (): Promise<PublicKeyCredential | null> => {
        try {
            console.log('[PASSKEY] Looking for existing passkey...')

            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: crypto.getRandomValues(new Uint8Array(32)),
                    userVerification: 'required',
                    timeout: 60000,
                },
                mediation: 'optional', // Show credential picker if available
            }) as PublicKeyCredential

            if (credential) {
                console.log('[PASSKEY] ✅ Found existing passkey!')
                return credential
            }
            return null
        } catch (err: any) {
            // No existing passkey found - this is normal for first time users
            console.log('[PASSKEY] No existing passkey found:', err.name)
            return null
        }
    }

    // Create new passkey
    const createNewPasskey = async (): Promise<PublicKeyCredential> => {
        console.log('[PASSKEY] Creating new passkey...')

        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                rp: { name: 'Invisible Rail' },
                user: {
                    id: crypto.getRandomValues(new Uint8Array(16)),
                    name: `wallet-${Date.now()}`,
                    displayName: 'Invisible Rail Wallet',
                },
                pubKeyCredParams: [
                    { alg: -7, type: 'public-key' },
                    { alg: -257, type: 'public-key' },
                ],
                authenticatorSelection: {
                    userVerification: 'required',
                    residentKey: 'required', // Make it discoverable for later
                },
                timeout: 120000,
                attestation: 'none',
            },
        }) as PublicKeyCredential

        if (!credential) throw new Error('Passkey creation cancelled')

        console.log('[PASSKEY] ✅ New passkey created!')
        return credential
    }

    const connect = async () => {
        setIsConnecting(true)
        setError(null)

        try {
            // Step 1: Check localStorage for existing wallet
            const savedWallet = localStorage.getItem(WALLET_STORAGE_KEY)
            const savedCredential = localStorage.getItem(CREDENTIAL_STORAGE_KEY)

            if (savedWallet && savedCredential) {
                // Have local data - verify with biometrics
                console.log('[STELLAR] 🔐 Verifying existing wallet...')

                const credData = JSON.parse(savedCredential)
                const assertion = await tryDiscoverExistingPasskey()

                if (assertion) {
                    const walletData = JSON.parse(savedWallet)
                    const kp = deriveKeypairFromCredential(credData.id)
                    setKeypair(kp)
                    setWallet({
                        publicKey: walletData.publicKey,
                        isConnected: true,
                        balance: '0',
                        usdcBalance: '0',
                        credentialId: credData.id
                    })
                    console.log('[STELLAR] ✅ Wallet restored!')
                    setTimeout(() => refreshBalance(), 1000)
                    return
                }
            }

            // Step 2: Try to discover existing passkey (for returning users on new device)
            console.log('[STELLAR] Looking for existing passkey...')
            const existingCredential = await tryDiscoverExistingPasskey()

            if (existingCredential) {
                // Found existing passkey - derive wallet from it
                const credentialId = existingCredential.id
                const kp = deriveKeypairFromCredential(credentialId)
                const publicKey = kp.publicKey()

                // Save to localStorage
                localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify({
                    id: credentialId,
                    createdAt: new Date().toISOString()
                }))
                localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify({
                    publicKey,
                    credentialId,
                    createdAt: new Date().toISOString()
                }))

                setKeypair(kp)
                setWallet({
                    publicKey,
                    isConnected: true,
                    balance: '0',
                    usdcBalance: '0',
                    credentialId
                })

                console.log('[STELLAR] ✅ Wallet recovered from existing passkey!')
                setTimeout(() => refreshBalance(), 1000)
                return
            }

            // Step 3: No existing passkey - create new one
            console.log('[STELLAR] 🆕 Creating new wallet...')
            const newCredential = await createNewPasskey()

            const credentialId = newCredential.id
            const kp = deriveKeypairFromCredential(credentialId)
            const publicKey = kp.publicKey()

            // Save credential
            localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify({
                id: credentialId,
                createdAt: new Date().toISOString()
            }))

            // Save wallet
            localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify({
                publicKey,
                credentialId,
                createdAt: new Date().toISOString()
            }))

            setKeypair(kp)
            setWallet({
                publicKey,
                isConnected: true,
                balance: '0',
                usdcBalance: '0',
                credentialId
            })

            // Fund new wallet
            console.log('[STELLAR] 💰 Funding wallet...')
            try {
                await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`)
                console.log('[STELLAR] ✅ Funded!')
            } catch {
                console.log('[STELLAR] Funding failed - manual funding needed')
            }

            console.log('[STELLAR] ✅ Wallet ready:', publicKey.slice(0, 8) + '...')
            setTimeout(() => refreshBalance(), 2000)

        } catch (err: any) {
            console.error('[STELLAR] Error:', err)

            if (err.name === 'NotAllowedError') {
                setError('Authentication cancelled. Please complete the fingerprint/face scan.')
            } else if (err.name === 'InvalidStateError') {
                setError('Passkey already exists. Please use the existing one.')
            } else {
                setError(err.message || 'Failed to connect wallet')
            }
        } finally {
            setIsConnecting(false)
        }
    }

    const disconnect = () => {
        setWallet(null)
        setKeypair(null)
        localStorage.removeItem(WALLET_STORAGE_KEY)
        localStorage.removeItem(CREDENTIAL_STORAGE_KEY)
    }

    const signTransaction = async (xdr: string): Promise<string> => {
        if (!keypair) throw new Error('No wallet connected')

        // Verify biometrics before signing
        const assertion = await tryDiscoverExistingPasskey()
        if (!assertion) {
            throw new Error('Biometric verification required to sign')
        }

        const { TransactionBuilder } = await import('@stellar/stellar-sdk')
        const transaction = TransactionBuilder.fromXDR(xdr, STELLAR_CONFIG.networkPassphrase)
        transaction.sign(keypair)
        return transaction.toXDR()
    }

    // Create USDC trustline
    const createUSDCTrustline = async (): Promise<boolean> => {
        try {
            // First, authenticate with passkey to get/restore keypair
            const assertion = await tryDiscoverExistingPasskey()
            if (!assertion) {
                throw new Error('Biometric verification required')
            }

            // Derive keypair from the credential used
            const credentialId = assertion.id
            const kp = deriveKeypairFromCredential(credentialId)
            const publicKey = kp.publicKey()

            console.log('[TRUSTLINE] Using wallet:', publicKey.slice(0, 8) + '...')

            const { TransactionBuilder, Operation, BASE_FEE } = await import('@stellar/stellar-sdk')

            // Load account
            const account = await horizon.loadAccount(publicKey)

            // Check if trustline already exists
            const hasTrustline = account.balances.some(
                (b: any) => b.asset_type === 'credit_alphanum4' &&
                    b.asset_code === 'USDC' &&
                    b.asset_issuer === USDC_ASSET.getIssuer()
            )

            if (hasTrustline) {
                console.log('[TRUSTLINE] Already exists!')
                return true
            }

            // Build trustline transaction
            const transaction = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: STELLAR_CONFIG.networkPassphrase
            })
                .addOperation(Operation.changeTrust({
                    asset: USDC_ASSET,
                    limit: '1000000'
                }))
                .setTimeout(30)
                .build()

            // Sign with derived keypair
            transaction.sign(kp)

            // Submit
            const result = await horizon.submitTransaction(transaction)
            console.log('[TRUSTLINE] ✅ Created! Hash:', result.hash)

            return true
        } catch (err: any) {
            console.error('[TRUSTLINE] Error:', err.response?.data?.extras || err.message)
            return false
        }
    }

    return (
        <StellarContext.Provider value={{ wallet, isConnecting, error, connect, disconnect, refreshBalance, signTransaction, createUSDCTrustline }}>
            {children}
        </StellarContext.Provider>
    )
}

export function useStellar() {
    const context = useContext(StellarContext)
    if (!context) throw new Error('useStellar must be used within StellarProvider')
    return context
}

export function useAccount() {
    const { wallet, isConnecting } = useStellar()
    return {
        address: wallet?.publicKey,
        isConnected: wallet?.isConnected ?? false,
        isConnecting,
        isReconnecting: false
    }
}

export function useConnect() {
    const { connect, isConnecting, error } = useStellar()
    return {
        connect: () => connect(),
        connectors: [{ id: 'stellar', name: 'Stellar Wallet' }],
        isPending: isConnecting,
        error: error ? new Error(error) : null
    }
}

export function useDisconnect() {
    const { disconnect } = useStellar()
    return { disconnect }
}
