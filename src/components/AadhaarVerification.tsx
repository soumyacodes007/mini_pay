'use client'

import { LogInWithAnonAadhaar, useAnonAadhaar } from '@anon-aadhaar/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { storeIdentity } from '@/lib/identity-storage'
import confetti from 'canvas-confetti'

export function AadhaarVerification() {
    const [anonAadhaar] = useAnonAadhaar()
    const { address } = useAccount()
    const [showSuccess, setShowSuccess] = useState(false)
    const [identityStored, setIdentityStored] = useState(false)

    useEffect(() => {
        // Debug logging for ZK proof status
        console.log('========================================')
        console.log('[AADHAAR] Status changed:', anonAadhaar.status)
        console.log('[AADHAAR] Timestamp:', new Date().toISOString())
        console.log('========================================')

        if (anonAadhaar.status === 'logged-out') {
            console.log('[AADHAAR] 📤 User is logged out, ready to verify')
        } else if (anonAadhaar.status === 'logging-in') {
            console.log('[AADHAAR] ⚙️ ZK PROOF GENERATION STARTED!')
            console.log('[AADHAAR] ⏳ This may take 30-60 seconds...')
        } else if (anonAadhaar.status === 'logged-in') {
            console.log('[AADHAAR] ✅ ZK PROOF GENERATION COMPLETE!')
            console.log('[AADHAAR] 🎉 User is now verified!')
            setShowSuccess(true)

            // Store identity for recovery (only once)
            if (!identityStored && address) {
                // Get proofs - handle both singular and plural
                const proofs = (anonAadhaar as any).anonAadhaarProofs || (anonAadhaar as any).anonAadhaarProof

                // Get first proof from {0: {...}} structure
                let proofWrapper: any = null
                if (Array.isArray(proofs)) {
                    proofWrapper = proofs[0]
                } else if (proofs && typeof proofs === 'object') {
                    proofWrapper = Object.values(proofs)[0]
                }

                // Parse PCD JSON to get nullifier
                let nullifier = ''
                try {
                    if (proofWrapper?.pcd) {
                        const pcdData = JSON.parse(proofWrapper.pcd)
                        nullifier = pcdData?.proof?.nullifier?.toString() || ''
                    }
                } catch (e) {
                    console.error('[AADHAAR] Failed to parse PCD:', e)
                }

                if (nullifier) {
                    storeIdentity(nullifier, address)
                    setIdentityStored(true)
                    console.log('[AADHAAR] 💾 Identity stored for future recovery! Nullifier:', nullifier.slice(0, 20) + '...')

                    // Celebrate!
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    })
                } else {
                    console.log('[AADHAAR] ⚠️ No nullifier found, recovery not enabled')
                }
            }
        }
    }, [anonAadhaar.status, anonAadhaar, address, identityStored])

    if (anonAadhaar.status === 'logged-in') {
        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-6 bg-green-50 border-2 border-green-500 rounded-2xl"
            >
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">✅</span>
                    <div>
                        <h3 className="font-bold text-green-800">Aadhaar Verified!</h3>
                        <p className="text-sm text-green-600">Unique identity confirmed via ZK proof</p>
                    </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg text-sm text-green-700">
                    <p className="font-semibold">🔐 Recovery Enabled</p>
                    <p className="text-xs mt-1">You can now recover this wallet anytime using your Aadhaar - no seed phrase needed!</p>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Verify Identity</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Prove you're a unique user without revealing personal info
                </p>
            </div>

            {anonAadhaar.status === 'logging-in' && (
                <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
                    <div className="flex flex-col items-center gap-3">
                        <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-blue-800 font-semibold">Generating ZK Proof...</p>
                        <p className="text-sm text-blue-600">This may take 30-60 seconds</p>
                    </div>
                </div>
            )}

            {anonAadhaar.status !== 'logging-in' && (
                <div className="space-y-4">
                    <LogInWithAnonAadhaar
                        nullifierSeed={12345}
                        signal="123456789"
                    />

                    <div className="text-xs text-gray-400 text-center">
                        <p>🔒 Your Aadhaar data never leaves your device</p>
                        <p>🛡️ Only a cryptographic proof is generated</p>
                    </div>
                </div>
            )}
        </div>
    )
}
