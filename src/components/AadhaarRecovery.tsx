'use client'

import { LogInWithAnonAadhaar, useAnonAadhaar } from '@anon-aadhaar/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { matchIdentity, hasAnyStoredIdentity, getAllIdentities } from '@/lib/identity-storage'
import { recoverIdentityFromBase, getAllRegisteredIdentities } from '@/lib/base-identity'
import { shortenAddress } from '@/lib/stellar-config'
import confetti from 'canvas-confetti'

interface RecoveryProps {
    onRecoverySuccess: (walletAddress: string, username?: string) => void
    onCancel: () => void
}

export function AadhaarRecovery({ onRecoverySuccess, onCancel }: RecoveryProps) {
    const [anonAadhaar] = useAnonAadhaar()
    const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'verifying' | 'matched' | 'not-found'>('idle')
    const [recoveredAddress, setRecoveredAddress] = useState<string | null>(null)
    const [recoveredUsername, setRecoveredUsername] = useState<string | null>(null)
    const [hasIdentities, setHasIdentities] = useState(false)

    // Check if any identities exist on mount
    useEffect(() => {
        setHasIdentities(hasAnyStoredIdentity())

        // Debug: Log all stored identities
        const identities = getAllIdentities()
        console.log('[RECOVERY] Stored identities:', identities.length)
        identities.forEach((id, i) => {
            console.log(`[RECOVERY] Identity ${i}:`, {
                nullifier: id.nullifier.slice(0, 20) + '...',
                wallet: shortenAddress(id.walletAddress),
                username: id.username
            })
        })
    }, [])

    useEffect(() => {
        const handleRecovery = async () => {
            console.log('[RECOVERY] Aadhaar status:', anonAadhaar.status)

            if (anonAadhaar.status === 'logging-in') {
                setRecoveryStatus('verifying')
                console.log('[RECOVERY] 🔄 Verifying Aadhaar for recovery...')
            }

            if (anonAadhaar.status === 'logged-in') {
                console.log('[RECOVERY] ✅ Aadhaar verified, checking identity match...')

                // Extract nullifier from proof
                const proofs = (anonAadhaar as any).anonAadhaarProofs || (anonAadhaar as any).anonAadhaarProof

                let proofWrapper: any = null
                if (Array.isArray(proofs)) {
                    proofWrapper = proofs[0]
                } else if (proofs && typeof proofs === 'object') {
                    const values = Object.values(proofs)
                    proofWrapper = values[0]
                }

                let nullifier = ''
                try {
                    if (proofWrapper?.pcd) {
                        const pcdData = JSON.parse(proofWrapper.pcd)
                        nullifier = pcdData?.proof?.nullifier?.toString() || ''
                    } else {
                        nullifier = proofWrapper?.proof?.nullifier?.toString() || ''
                    }
                } catch (e) {
                    console.error('[RECOVERY] Failed to parse PCD:', e)
                }

                console.log('[RECOVERY] Nullifier:', nullifier ? nullifier.slice(0, 30) + '...' : 'EMPTY')

                if (!nullifier) {
                    console.log('[RECOVERY] ❌ No nullifier found in proof')
                    setRecoveryStatus('not-found')
                    return
                }

                // Try to recover from Base first, then fallback to local storage
                console.log('[RECOVERY] 🔍 Checking Base registry...')

                const baseResult = await recoverIdentityFromBase(nullifier)

                if (baseResult.found && baseResult.stellarAddress) {
                    console.log('[RECOVERY] 🎉 Found on Base!', {
                        wallet: shortenAddress(baseResult.stellarAddress),
                        username: baseResult.username
                    })
                    setRecoveredAddress(baseResult.stellarAddress)
                    setRecoveredUsername(baseResult.username || null)
                    setRecoveryStatus('matched')

                    // Celebrate!
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.5 }
                    })
                    return
                }

                // Fallback to local storage
                const result = matchIdentity(nullifier)

                if (result.matched && result.walletAddress) {
                    console.log('[RECOVERY] 🎉 Identity matched (local)!', {
                        wallet: shortenAddress(result.walletAddress),
                        username: result.username
                    })
                    setRecoveredAddress(result.walletAddress)
                    setRecoveredUsername(result.username || null)
                    setRecoveryStatus('matched')

                    // Celebrate!
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.5 }
                    })
                } else {
                    console.log('[RECOVERY] ❌ No matching identity found')
                    setRecoveryStatus('not-found')
                }
            }
        }

        handleRecovery()
    }, [anonAadhaar])

    // Success state
    if (recoveryStatus === 'matched' && recoveredAddress) {
        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="text-8xl"
                >
                    🎉
                </motion.div>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-green-600">Wallet Found!</h2>
                    <p className="text-gray-600 mt-2">
                        Your identity was verified via Aadhaar ZK proof
                    </p>
                </div>

                <div className="p-4 bg-green-50 border-2 border-green-500 rounded-xl w-full">
                    {recoveredUsername ? (
                        <>
                            <p className="text-sm text-gray-500">Your Rail ID</p>
                            <p className="text-2xl font-bold text-green-700">
                                {recoveredUsername}@rail
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500">Recovered Wallet</p>
                            <p className="font-mono text-sm text-green-700 break-all">
                                {recoveredAddress}
                            </p>
                        </>
                    )}
                </div>

                <div className="text-sm text-gray-500 text-center space-y-1">
                    <p>✅ No seed phrase needed</p>
                    <p>✅ Your Aadhaar data stayed private</p>
                    <p>✅ Same wallet, same balance</p>
                </div>

                <div className="w-full space-y-3">
                    <motion.button
                        onClick={() => onRecoverySuccess(recoveredAddress, recoveredUsername || undefined)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl"
                    >
                        🔐 Access Wallet
                    </motion.button>

                    <p className="text-xs text-center text-gray-400">
                        Your wallet is ready to use on this device
                    </p>
                </div>
            </motion.div>
        )
    }

    // Not found state
    if (recoveryStatus === 'not-found') {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto"
            >
                <div className="text-6xl">🔍</div>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-orange-600">No Wallet Found</h2>
                    <p className="text-gray-600 mt-2">
                        This Aadhaar isn't linked to any wallet yet.
                    </p>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-300 rounded-xl text-sm text-orange-700 w-full">
                    <p className="font-semibold">This could mean:</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                        <li>You haven't verified Aadhaar with any wallet</li>
                        <li>You used a different Aadhaar card</li>
                        <li>The wallet was created on a different device</li>
                    </ul>
                </div>

                <div className="w-full space-y-3">
                    <button
                        onClick={onCancel}
                        className="w-full py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
                    >
                        Create New Wallet
                    </button>
                    <button
                        onClick={() => setRecoveryStatus('idle')}
                        className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </motion.div>
        )
    }

    // Initial/verifying state
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6 p-8 max-w-md mx-auto"
        >
            <div className="text-6xl">🔐</div>

            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Recover Wallet</h2>
                <p className="text-gray-600 mt-2">
                    Verify your Aadhaar to find your linked wallet
                </p>
            </div>

            {!hasIdentities && (
                <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-xl text-sm text-yellow-700 w-full">
                    <p className="font-semibold">⚠️ No wallets linked yet</p>
                    <p className="mt-1">
                        To use recovery, first create a wallet and verify your Aadhaar in the "Verify" tab.
                    </p>
                </div>
            )}

            {hasIdentities && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700 w-full">
                    <p className="font-semibold">✅ Linked wallets found</p>
                    <p className="mt-1">
                        Verify your Aadhaar to recover your wallet. Use the same Aadhaar you used during verification.
                    </p>
                </div>
            )}

            {recoveryStatus === 'verifying' ? (
                <div className="flex flex-col items-center gap-4 p-6 w-full">
                    <svg className="animate-spin h-12 w-12 text-teal-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-teal-600 font-semibold">Generating ZK proof...</p>
                    <p className="text-sm text-gray-500">Searching for your wallet...</p>
                </div>
            ) : (
                <div className="w-full">
                    <LogInWithAnonAadhaar
                        nullifierSeed={12345}
                        signal="1"
                    />
                </div>
            )}

            <div className="text-xs text-gray-400 text-center space-y-1">
                <p>🔒 Your Aadhaar number stays private</p>
                <p>🛡️ Only a cryptographic proof is generated</p>
            </div>

            <button
                onClick={onCancel}
                className="text-gray-500 text-sm underline hover:text-gray-700"
            >
                ← Back to login
            </button>
        </motion.div>
    )
}
