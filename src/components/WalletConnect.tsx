'use client'

import { useAccount, useConnect, useDisconnect, useStellar } from '@/providers/StellarProvider'
import { SendUSDC } from './SendUSDC'
import { AadhaarVerification } from './AadhaarVerification'
import { PaymentQR } from './PaymentQR'
import { QRScanner } from './QRScanner'
import { AadhaarRecovery } from './AadhaarRecovery'
import { OnboardingFlow } from './OnboardingFlow'
import { MiniPayIdSetup } from './MiniPayIdSetup'
import { MainWallet } from './MainWallet'
import { getUsername, registerUsername, resolveUsername } from '@/lib/username-registry'
import { shortenAddress } from '@/lib/stellar-config'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'

export function WalletConnect() {
    const { address, isConnected, isConnecting: isReconnecting } = useAccount()
    const { connect, isPending, error: connectError } = useConnect()
    const { disconnect } = useDisconnect()
    const { wallet, refreshBalance, createUSDCTrustline, sendUSDC } = useStellar()

    const [view, setView] = useState<'main' | 'send' | 'receive' | 'scan' | 'verify'>('main')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [scannedRecipient, setScannedRecipient] = useState('')
    const [scannedAmount, setScannedAmount] = useState('')
    const [showRecovery, setShowRecovery] = useState(false)
    const [hasExistingWallet, setHasExistingWallet] = useState(false)
    const [showMiniPayIdSetup, setShowMiniPayIdSetup] = useState(false)
    const [isNewUser, setIsNewUser] = useState(false)

    // Get username for connected wallet
    const username = address ? getUsername(address) : null

    // Check if user has connected before
    useEffect(() => {
        const savedWallet = localStorage.getItem('invisiblerail_wallet')
        if (savedWallet) {
            setHasExistingWallet(true)
        }
    }, [])

    // Show connect errors
    useEffect(() => {
        if (connectError) {
            console.error('Connect Error:', connectError)
            setErrorMsg(connectError.message)
        }
    }, [connectError])

    // Auto-show MiniPay ID setup after wallet creation (for new users)
    useEffect(() => {
        if (isNewUser && isConnected && address && !username) {
            setShowMiniPayIdSetup(true)
        }
    }, [isConnected, address, username, isNewUser])

    const handleScanResult = async (scannedAddress: string, amount: string, username?: string) => {
        try {
            console.log('[SCAN] Payment scanned:', scannedAddress, amount)

            // Send payment first
            const success = await sendUSDC(scannedAddress, amount)

            if (success) {
                // Show confetti AFTER success
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                })

                // Play success sound
                const audio = new Audio('/success.mp3')
                audio.play().catch(e => console.log('Could not play sound:', e))

                // Show success alert
                alert(`✅ Successfully sent ${amount} USDC to ${username || shortenAddress(scannedAddress)}!`)
                setView('main')
            }
        } catch (err: any) {
            console.error('[SCAN] Payment failed:', err)
            alert(`❌ Payment failed: ${err.message}`)
            setView('main')
        }
    }

    const handleRecoverySuccess = (walletAddress: string, username?: string) => {
        console.log('[RECOVERY] Wallet recovered:', walletAddress, 'Username:', username)
        setShowRecovery(false)

        // Save recovered wallet to localStorage (same format as connect)
        const walletData = {
            publicKey: walletAddress,
            credentialId: null // Recovery doesn't restore passkey, but wallet address works
        }
        localStorage.setItem('invisiblerail_wallet', JSON.stringify(walletData))
        localStorage.setItem('invisiblerail_last_wallet', walletAddress)

        if (username) {
            localStorage.setItem('invisiblerail_recovered_username', username)
        }

        // Celebrate!
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        })

        // Reload page to pick up the restored wallet
        window.location.reload()
    }

    // Show recovery flow
    if (showRecovery) {
        return (
            <AadhaarRecovery
                onRecoverySuccess={handleRecoverySuccess}
                onCancel={() => setShowRecovery(false)}
            />
        )
    }

    // Show MiniPay ID setup for new users
    if (showMiniPayIdSetup && address && !username) {
        return (
            <MiniPayIdSetup
                walletAddress={address}
                onComplete={(newUsername) => {
                    registerUsername(address, newUsername)
                    setShowMiniPayIdSetup(false)
                    setIsNewUser(false)
                    // Celebrate!
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    })
                }}
            />
        )
    }


    // Connected - Show MainWallet or specific views
    if (isConnected && address) {
        // Check if Aadhaar is verified (check localStorage)
        const isAadhaarVerified = !!localStorage.getItem('invisiblerail_identities')

        // Show Aadhaar verification view
        if (view === 'verify') {
            return (
                <div className="min-h-screen bg-slate-50 p-4">
                    <button
                        onClick={() => setView('main')}
                        className="flex items-center text-slate-500 hover:text-slate-700 mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <AadhaarVerification />
                </div>
            )
        }

        // Show QR Scanner view
        if (view === 'scan') {
            return (
                <div className="min-h-screen bg-slate-50 p-4">
                    <button
                        onClick={() => setView('main')}
                        className="flex items-center text-slate-500 hover:text-slate-700 mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <QRScanner onScan={(addr, amt) => {
                        handleScanResult(addr, amt)
                        setView('main')
                    }} />
                </div>
            )
        }

        // Main wallet view
        return (
            <MainWallet
                address={address}
                username={username}
                usdcBalance={wallet?.usdcBalance || '0'}
                xlmBalance={wallet?.balance || '0'}
                isAadhaarVerified={isAadhaarVerified}
                onDisconnect={disconnect}
                onVerifyAadhaar={() => setView('verify')}
                onCreateTrustline={createUSDCTrustline}
                onSend={async (recipient, amount) => {
                    try {
                        console.log('[SEND] Starting payment:', recipient, amount)

                        // Resolve username to address if needed
                        let recipientAddress = recipient
                        if (recipient.startsWith('@') || !recipient.startsWith('G')) {
                            const resolved = resolveUsername(recipient)
                            if (resolved) {
                                recipientAddress = resolved
                                console.log('[SEND] Resolved username:', recipient, '→', recipientAddress)
                            } else {
                                alert(`Username ${recipient} not found`)
                                return
                            }
                        }

                        // Send payment
                        const success = await sendUSDC(recipientAddress, amount)
                        if (success) {
                            // Play success sound
                            const audio = new Audio('/success.mp3')
                            audio.play().catch(e => console.log('Could not play sound:', e))

                            // Show success alert
                            alert(`✅ Successfully sent ${amount} USDC!`)
                            setView('main')
                        }
                    } catch (err: any) {
                        console.error('[SEND] Failed:', err)
                        alert(`❌ Payment failed: ${err.message}`)
                    }
                }}
                onScan={() => setView('scan')}
            />
        )
    }

    // Not connected - Show new premium onboarding
    return (
        <OnboardingFlow
            onCreateAccount={() => {
                setErrorMsg(null)
                setIsNewUser(true)
                connect()
            }}
            onRecoverAccount={() => {
                setShowRecovery(true)
            }}
            onSkipAadhaar={() => {
                console.log('[ONBOARDING] User skipped Aadhaar verification')
            }}
            onAadhaarComplete={() => {
                console.log('[ONBOARDING] Aadhaar verified during account creation')
            }}
        />
    )
}



