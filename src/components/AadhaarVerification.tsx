'use client'

import { LogInWithAnonAadhaar, useAnonAadhaar } from '@anon-aadhaar/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAccount } from '@/providers/StellarProvider'
import { storeIdentity, getStoredIdentity } from '@/lib/identity-storage'
import { getUsername } from '@/lib/username-registry'
import { shortenAddress } from '@/lib/stellar-config'
import confetti from 'canvas-confetti'

export function AadhaarVerification() {
    const [anonAadhaar] = useAnonAadhaar()
    const { address } = useAccount()
    const [identityStored, setIdentityStored] = useState(false)
    const [alreadyVerified, setAlreadyVerified] = useState(false)

    // Check if already verified on mount
    useEffect(() => {
        if (address) {
            const existing = getStoredIdentity()
            if (existing && existing.walletAddress === address) {
                setAlreadyVerified(true)
                setIdentityStored(true)
            }
        }
    }, [address])

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

            // Store identity for recovery (only once)
            if (!identityStored && address) {
                console.log('[AADHAAR] 📦 Extracting proof data...')

                // Get proofs - handle both singular and plural
                const proofs = (anonAadhaar as any).anonAadhaarProofs || (anonAadhaar as any).anonAadhaarProof
                console.log('[AADHAAR] 🔍 Raw proofs object:', proofs)

                // Get first proof from {0: {...}} structure
                let proofWrapper: any = null
                if (Array.isArray(proofs)) {
                    proofWrapper = proofs[0]
                    console.log('[AADHAAR] 📋 Proofs is array, using first element')
                } else if (proofs && typeof proofs === 'object') {
                    proofWrapper = Object.values(proofs)[0]
                    console.log('[AADHAAR] 📋 Proofs is object, using first value')
                }

                console.log('[AADHAAR] 📄 Proof wrapper:', proofWrapper)

                // Parse PCD JSON to get nullifier
                let nullifier = ''
                try {
                    if (proofWrapper?.pcd) {
                        console.log('[AADHAAR] 🔓 Parsing PCD JSON...')
                        const pcdData = JSON.parse(proofWrapper.pcd)
                        console.log('[AADHAAR] 📊 PCD Data structure:', pcdData)

                        nullifier = pcdData?.proof?.nullifier?.toString() || ''
                        console.log('[AADHAAR] 🔑 Extracted nullifier:', nullifier)

                        // Log proof components for testing
                        if (pcdData?.proof) {
                            console.log('[AADHAAR] 🧩 Proof components:')
                            console.log('  - Nullifier:', pcdData.proof.nullifier)
                            console.log('  - Proof A:', pcdData.proof.groth16Proof?.pi_a)
                            console.log('  - Proof B:', pcdData.proof.groth16Proof?.pi_b)
                            console.log('  - Proof C:', pcdData.proof.groth16Proof?.pi_c)
                            console.log('  - Public signals:', pcdData.proof.pubSignals)
                        }
                    }
                } catch (e) {
                    console.error('[AADHAAR] ❌ Failed to parse PCD:', e)
                }

                if (nullifier) {
                    // Get username if registered
                    const username = getUsername(address)

                    // Store identity with username
                    storeIdentity(nullifier, address, username || undefined)
                    setIdentityStored(true)
                    setAlreadyVerified(true)
                    console.log('[AADHAAR] 💾 Identity stored for future recovery!')
                    console.log('[AADHAAR] 🔐 Nullifier (first 20 chars):', nullifier.slice(0, 20) + '...')
                    console.log('[AADHAAR] 🏦 Wallet address:', address)

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

    // Show verified state
    if (anonAadhaar.status === 'logged-in' || alreadyVerified) {
        const username = address ? getUsername(address) : null

        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md p-6 bg-green-50 border-2 border-green-500 rounded-2xl mx-auto"
            >
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">✅</span>
                    <div>
                        <h3 className="font-bold text-green-800">Aadhaar Verified!</h3>
                        <p className="text-sm text-green-600">Unique identity confirmed via ZK proof</p>
                    </div>
                </div>

                <div className="p-4 bg-green-100 rounded-lg text-sm text-green-700 space-y-2">
                    <p className="font-semibold">🔐 Recovery Enabled</p>
                    <p className="text-xs">
                        Your wallet is now linked to your Aadhaar identity.
                        If you ever lose access, you can recover it by verifying your Aadhaar again.
                    </p>
                    {username && (
                        <p className="text-xs mt-2">
                            <span className="font-medium">Linked Rail ID:</span> {username}@rail
                        </p>
                    )}
                    {address && (
                        <p className="text-xs mt-1 opacity-70">
                            <span className="font-medium">Wallet:</span> {shortenAddress(address)}
                        </p>
                    )}
                </div>

                <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600 text-center">
                        💡 <span className="font-medium">How recovery works:</span> Your Aadhaar generates a unique
                        cryptographic identifier (nullifier) that's linked to this wallet.
                        Same Aadhaar = Same identifier = Wallet recovered!
                    </p>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Verify Identity</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Link your Aadhaar to enable wallet recovery
                </p>
            </div>

            {/* Why verify section */}
            <div className="mb-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-800 font-medium">🛡️ Why verify?</p>
                <ul className="text-xs text-teal-700 mt-1 space-y-1">
                    <li>• Recover wallet if you lose your phone</li>
                    <li>• No seed phrase to remember</li>
                    <li>• Your Aadhaar data stays private (ZK proof)</li>
                </ul>
            </div>

            {anonAadhaar.status === 'logging-in' && (
                <div className="p-6 bg-teal-50 border-2 border-teal-200 rounded-xl text-center">
                    <div className="flex flex-col items-center gap-3">
                        <svg className="animate-spin h-8 w-8 text-teal-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-teal-800 font-semibold">Generating ZK Proof...</p>
                        <p className="text-sm text-teal-600">This may take 30-60 seconds</p>
                    </div>
                </div>
            )}

            {anonAadhaar.status !== 'logging-in' && (
                <div className="space-y-4">
                    <LogInWithAnonAadhaar
                        nullifierSeed={12345}
                        signal={address ? BigInt('0x' + Buffer.from(address).toString('hex').slice(0, 16)).toString() : "1"}
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
