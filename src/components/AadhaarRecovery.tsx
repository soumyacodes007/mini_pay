'use client'

import { LogInWithAnonAadhaar, useAnonAadhaar } from '@anon-aadhaar/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { matchIdentity, getStoredIdentity } from '@/lib/identity-storage'
import confetti from 'canvas-confetti'

interface RecoveryProps {
    onRecoverySuccess: (walletAddress: string) => void
    onCancel: () => void
}

export function AadhaarRecovery({ onRecoverySuccess, onCancel }: RecoveryProps) {
    const [anonAadhaar] = useAnonAadhaar()
    const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'verifying' | 'matched' | 'not-found'>('idle')
    const [recoveredAddress, setRecoveredAddress] = useState<string | null>(null)

    useEffect(() => {
        console.log('[RECOVERY] Aadhaar status:', anonAadhaar.status)
        console.log('[RECOVERY] Full state keys:', Object.keys(anonAadhaar))

        if (anonAadhaar.status === 'logging-in') {
            setRecoveryStatus('verifying')
            console.log('[RECOVERY] 🔄 Verifying Aadhaar for recovery...')
        }

        if (anonAadhaar.status === 'logged-in') {
            console.log('[RECOVERY] ✅ Aadhaar verified, checking identity match...')

            // Extract nullifier from proof - check both singular and plural
            const proofs = (anonAadhaar as any).anonAadhaarProofs || (anonAadhaar as any).anonAadhaarProof

            // Get the first proof - handle {0: {...}} object structure
            let proofWrapper: any = null
            if (Array.isArray(proofs)) {
                proofWrapper = proofs[0]
            } else if (proofs && typeof proofs === 'object') {
                const values = Object.values(proofs)
                proofWrapper = values[0]
            }
            console.log('[RECOVERY] Proof wrapper:', proofWrapper)

            // The proof data is inside a JSON string in the 'pcd' field
            let nullifier = ''
            try {
                if (proofWrapper?.pcd) {
                    const pcdData = JSON.parse(proofWrapper.pcd)
                    console.log('[RECOVERY] Parsed PCD:', pcdData)
                    nullifier = pcdData?.proof?.nullifier?.toString() || ''
                } else {
                    // Try direct access
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

            // Try to match with stored identity
            const result = matchIdentity(nullifier)

            if (result.matched && result.walletAddress) {
                console.log('[RECOVERY] 🎉 Identity matched! Wallet:', result.walletAddress)
                setRecoveredAddress(result.walletAddress)
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
    }, [anonAadhaar])

    // Check if there's a stored identity at all
    const hasStoredIdentity = getStoredIdentity() !== null

    if (recoveryStatus === 'matched' && recoveredAddress) {
        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-6 p-8 max-w-md"
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
                    <h2 className="text-2xl font-bold text-green-600">Wallet Recovered!</h2>
                    <p className="text-gray-600 mt-2">
                        Your identity was verified via Aadhaar ZK proof
                    </p>
                </div>

                <div className="p-4 bg-green-50 border-2 border-green-500 rounded-xl w-full">
                    <p className="text-sm text-gray-500">Recovered Wallet</p>
                    <p className="font-mono text-lg text-green-700 break-all">
                        {recoveredAddress}
                    </p>
                </div>

                <div className="text-sm text-gray-500 text-center">
                    <p>✅ No seed phrase needed</p>
                    <p>✅ Your Aadhaar data stayed private</p>
                    <p>✅ Only you can recover this wallet</p>
                </div>

                <motion.button
                    onClick={() => onRecoverySuccess(recoveredAddress)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl"
                >
                    Continue to Wallet →
                </motion.button>
            </motion.div>
        )
    }

    if (recoveryStatus === 'not-found') {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-6 p-8 max-w-md"
            >
                <div className="text-6xl">🔍</div>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-orange-600">No Wallet Found</h2>
                    <p className="text-gray-600 mt-2">
                        This Aadhaar identity isn't linked to any wallet yet.
                    </p>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-300 rounded-xl text-sm text-orange-700">
                    <p className="font-semibold">What does this mean?</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                        <li>You haven't created a wallet with this Aadhaar</li>
                        <li>Or you used a different Aadhaar card</li>
                    </ul>
                </div>

                <button
                    onClick={onCancel}
                    className="text-blue-600 underline"
                >
                    Create a new wallet instead
                </button>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6 p-8 max-w-md"
        >
            <div className="text-6xl">🔐</div>

            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Recover Wallet</h2>
                <p className="text-gray-600 mt-2">
                    Verify your Aadhaar to recover your wallet without seed phrase
                </p>
            </div>

            {!hasStoredIdentity && (
                <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-xl text-sm text-yellow-700">
                    <p className="font-semibold">⚠️ Demo Mode</p>
                    <p className="mt-1">
                        No wallet is linked yet. First create a wallet and verify Aadhaar to enable recovery.
                    </p>
                </div>
            )}

            {recoveryStatus === 'verifying' ? (
                <div className="flex flex-col items-center gap-4 p-6">
                    <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-blue-600 font-semibold">Generating ZK proof...</p>
                    <p className="text-sm text-gray-500">Matching your identity...</p>
                </div>
            ) : (
                <div className="w-full">
                    <LogInWithAnonAadhaar
                        nullifierSeed={12345}
                        signal="123456789"
                    />
                </div>
            )}

            <div className="text-xs text-gray-400 text-center space-y-1">
                <p>🔒 Your Aadhaar number stays private</p>
                <p>🛡️ ZK proof verifies you without exposing data</p>
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
