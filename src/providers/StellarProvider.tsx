'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Horizon, Keypair, Networks, TransactionBuilder, BASE_FEE, Operation } from '@stellar/stellar-sdk'
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
    sendUSDC: (recipient: string, amount: string) => Promise<boolean>
}

const StellarContext = createContext<StellarContextType | null>(null)

const WALLET_STORAGE_KEY = 'invisiblerail_wallet'
const CREDENTIAL_STORAGE_KEY = 'invisiblerail_credential'

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
                } else if (balance.asset_type === 'credit_alphanum4' && balance.asset_code === 'USDC' && balance.asset_issuer === USDC_ASSET.getIssuer()) {
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

    const tryDiscoverExistingPasskey = async (): Promise<PublicKeyCredential | null> => {
        try {
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: crypto.getRandomValues(new Uint8Array(32)),
                    userVerification: 'required',
                    timeout: 60000,
                },
                mediation: 'optional',
            }) as PublicKeyCredential
            return credential || null
        } catch {
            return null
        }
    }

    const createNewPasskey = async (): Promise<PublicKeyCredential> => {
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                rp: { name: 'Invisible Rail' },
                user: {
                    id: crypto.getRandomValues(new Uint8Array(16)),
                    name: `wallet-${Date.now()}`,
                    displayName: 'Invisible Rail Wallet',
                },
                pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
                authenticatorSelection: { userVerification: 'required', residentKey: 'required' },
                timeout: 120000,
                attestation: 'none',
            },
        }) as PublicKeyCredential
        if (!credential) throw new Error('Passkey creation cancelled')
        return credential
    }

    const connect = async () => {
        setIsConnecting(true)
        setError(null)
        try {
            const savedWallet = localStorage.getItem(WALLET_STORAGE_KEY)
            const savedCredential = localStorage.getItem(CREDENTIAL_STORAGE_KEY)

            if (savedWallet && savedCredential) {
                const credData = JSON.parse(savedCredential)
                const assertion = await tryDiscoverExistingPasskey()
                if (assertion) {
                    const walletData = JSON.parse(savedWallet)
                    const kp = deriveKeypairFromCredential(credData.id)
                    setKeypair(kp)
                    setWallet({ publicKey: walletData.publicKey, isConnected: true, balance: '0', usdcBalance: '0', credentialId: credData.id })
                    setTimeout(() => refreshBalance(), 1000)
                    return
                }
            }

            const existingCredential = await tryDiscoverExistingPasskey()
            if (existingCredential) {
                const credentialId = existingCredential.id
                const kp = deriveKeypairFromCredential(credentialId)
                const publicKey = kp.publicKey()
                localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify({ id: credentialId, createdAt: new Date().toISOString() }))
                localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify({ publicKey, credentialId, createdAt: new Date().toISOString() }))
                setKeypair(kp)
                setWallet({ publicKey, isConnected: true, balance: '0', usdcBalance: '0', credentialId })
                setTimeout(() => refreshBalance(), 1000)
                return
            }

            const newCredential = await createNewPasskey()
            const credentialId = newCredential.id
            const kp = deriveKeypairFromCredential(credentialId)
            const publicKey = kp.publicKey()
            localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify({ id: credentialId, createdAt: new Date().toISOString() }))
            localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify({ publicKey, credentialId, createdAt: new Date().toISOString() }))
            setKeypair(kp)
            setWallet({ publicKey, isConnected: true, balance: '0', usdcBalance: '0', credentialId })

            try {
                await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`)
            } catch { }
            setTimeout(() => refreshBalance(), 2000)
        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                setError('Authentication cancelled. Please complete the fingerprint/face scan.')
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
        const assertion = await tryDiscoverExistingPasskey()
        if (!assertion) throw new Error('Biometric verification required to sign')
        const { TransactionBuilder } = await import('@stellar/stellar-sdk')
        const transaction = TransactionBuilder.fromXDR(xdr, STELLAR_CONFIG.networkPassphrase)
        transaction.sign(keypair)
        return transaction.toXDR()
    }

    const createUSDCTrustline = async (): Promise<boolean> => {
        try {
            const assertion = await tryDiscoverExistingPasskey()
            if (!assertion) throw new Error('Biometric verification required')
            const credentialId = assertion.id
            const kp = deriveKeypairFromCredential(credentialId)
            const publicKey = kp.publicKey()
            const account = await horizon.loadAccount(publicKey)
            const hasTrustline = account.balances.some((b: any) => b.asset_type === 'credit_alphanum4' && b.asset_code === 'USDC' && b.asset_issuer === USDC_ASSET.getIssuer())
            if (hasTrustline) return true
            const transaction = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: STELLAR_CONFIG.networkPassphrase })
                .addOperation(Operation.changeTrust({ asset: USDC_ASSET, limit: '1000000' }))
                .setTimeout(30)
                .build()
            transaction.sign(kp)
            await horizon.submitTransaction(transaction)
            return true
        } catch (err: any) {
            console.error('[TRUSTLINE] Error:', err.message)
            return false
        }
    }

    const sendUSDC = async (recipient: string, amount: string): Promise<boolean> => {
        try {
            console.log('[SEND] Initiating payment:', recipient, amount)
            const assertion = await tryDiscoverExistingPasskey()
            if (!assertion) throw new Error('Biometric verification required')
            const credentialId = assertion.id
            const kp = deriveKeypairFromCredential(credentialId)
            const publicKey = kp.publicKey()

            // Validate recipient address
            if (!isValidStellarAddress(recipient)) {
                throw new Error('Invalid recipient address')
            }

            // Load account
            const account = await horizon.loadAccount(publicKey)

            // Build payment transaction
            const transaction = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: STELLAR_CONFIG.networkPassphrase
            })
                .addOperation(Operation.payment({
                    destination: recipient,
                    asset: USDC_ASSET,
                    amount: amount
                }))
                .setTimeout(30)
                .build()

            // Sign and submit
            transaction.sign(kp)
            const result = await horizon.submitTransaction(transaction)
            console.log('[SEND] Transaction successful:', result.hash)

            // Refresh balance
            await refreshBalance()

            return true
        } catch (err: any) {
            console.error('[SEND] Error:', err.message)
            throw new Error(err.message || 'Failed to send payment')
        }
    }

    return (
        <StellarContext.Provider value={{ wallet, isConnecting, error, connect, disconnect, refreshBalance, signTransaction, createUSDCTrustline, sendUSDC }}>
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
    return { address: wallet?.publicKey, isConnected: wallet?.isConnected ?? false, isConnecting, isReconnecting: false }
}

export function useConnect() {
    const { connect, isConnecting, error } = useStellar()
    return { connect: () => connect(), connectors: [{ id: 'stellar', name: 'Stellar Wallet' }], isPending: isConnecting, error: error ? new Error(error) : null }
}

export function useDisconnect() {
    const { disconnect } = useStellar()
    return { disconnect }
}
