'use client'

import { useAccount, useConnect, useDisconnect, useStellar } from '@/providers/StellarProvider'
import { SendUSDC } from './SendUSDC'
import { AadhaarVerification } from './AadhaarVerification'
import { PaymentQR } from './PaymentQR'
import { QRScanner } from './QRScanner'
import { AadhaarRecovery } from './AadhaarRecovery'
import { getUsername } from '@/lib/username-registry'
import { shortenAddress } from '@/lib/stellar-config'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'

export function WalletConnect() {
    const { address, isConnected, isConnecting: isReconnecting } = useAccount()
    const { connect, isPending, error: connectError } = useConnect()
    const { disconnect } = useDisconnect()
    const { wallet, refreshBalance, createUSDCTrustline } = useStellar()

    const [view, setView] = useState<'send' | 'receive' | 'scan' | 'verify'>('send')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [scannedRecipient, setScannedRecipient] = useState('')
    const [scannedAmount, setScannedAmount] = useState('')
    const [showRecovery, setShowRecovery] = useState(false)
    const [hasExistingWallet, setHasExistingWallet] = useState(false)

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

    const handleScanResult = (scannedAddress: string, amount: string, username?: string) => {
        setScannedRecipient(scannedAddress)
        setScannedAmount(amount)

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        })

        setView('send')
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

    if (isConnected && address) {
        return (
            <div className="flex flex-col items-center gap-6 w-full max-w-2xl p-4">
                {/* Header Card */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl"
                >
                    <div className="text-white text-center">
                        {username ? (
                            <>
                                <p className="text-2xl font-bold">{username}@rail</p>
                                <button
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(address)
                                        alert('Address copied!')
                                    }}
                                    className="font-mono text-xs mt-1 opacity-70 hover:opacity-100 flex items-center gap-1 mx-auto"
                                >
                                    {shortenAddress(address)} 📋
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm opacity-80">Stellar Wallet</p>
                                <button
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(address)
                                        alert('Address copied!')
                                    }}
                                    className="font-mono text-xs mt-1 hover:opacity-80 flex items-center gap-1 mx-auto"
                                >
                                    {shortenAddress(address)} 📋
                                </button>
                            </>
                        )}
                        {/* Balance Display */}
                        {wallet && (
                            <div className="mt-3 flex flex-col items-center gap-2">
                                <div className="flex gap-3">
                                    <div className="bg-white/20 px-3 py-1 rounded-lg">
                                        <span className="text-xs opacity-80">USDC</span>
                                        <span className="ml-2 font-bold">{parseFloat(wallet.usdcBalance).toFixed(2)}</span>
                                    </div>
                                    <div className="bg-white/20 px-3 py-1 rounded-lg">
                                        <span className="text-xs opacity-80">XLM</span>
                                        <span className="ml-2 font-bold">{parseFloat(wallet.balance).toFixed(0)}</span>
                                    </div>
                                    <button
                                        onClick={() => refreshBalance()}
                                        className="text-xs opacity-70 hover:opacity-100"
                                    >
                                        🔄
                                    </button>
                                </div>
                                {parseFloat(wallet.usdcBalance) === 0 && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                // Create trustline automatically
                                                const success = await createUSDCTrustline()

                                                if (success) {
                                                    // Try to copy address (may fail after biometric)
                                                    try {
                                                        await navigator.clipboard.writeText(address)
                                                    } catch {
                                                        // Clipboard failed, address shown in alert
                                                    }

                                                    // Open Circle faucet
                                                    window.open('https://faucet.circle.com/', '_blank')
                                                    alert('✅ Trustline created!\n\n1. Select "Stellar" network\n2. Paste this address:\n' + address + '\n3. Click "Get tokens"\n\nThen come back and tap 🔄!')
                                                } else {
                                                    alert('Failed to create trustline. Please try again.')
                                                }
                                            } catch (err) {
                                                console.error(err)
                                                alert('Error creating trustline')
                                            }
                                        }}
                                        className="text-xs bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-semibold hover:bg-yellow-300"
                                    >
                                        💰 Get Test USDC
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => disconnect()}
                        className="px-6 py-2 bg-white text-teal-600 rounded-full font-semibold hover:scale-105 transition-transform"
                    >
                        Disconnect
                    </button>
                </motion.div>

                {/* Navigation Tabs */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-2 flex-wrap justify-center"
                >
                    {[
                        { id: 'send', label: '💸 Pay', icon: '💸' },
                        { id: 'receive', label: '📱 Receive', icon: '📱' },
                        { id: 'scan', label: '📷 Scan', icon: '📷' },
                        { id: 'verify', label: '🆔 Verify', icon: '🆔' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setView(tab.id as typeof view)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${view === tab.id
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-105'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* Content Area */}
                <motion.div
                    key={view}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                >
                    {view === 'send' && <SendUSDC initialRecipient={scannedRecipient} initialAmount={scannedAmount} />}
                    {view === 'receive' && <PaymentQR />}
                    {view === 'scan' && <QRScanner onScan={handleScanResult} />}
                    {view === 'verify' && <AadhaarVerification />}
                </motion.div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6 p-8"
        >
            <div className="text-center">
                <motion.h1
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
                >
                    Invisible Rail
                </motion.h1>
                <motion.p
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-600 mt-3 text-lg"
                >
                    Pay with crypto as easy as UPI
                </motion.p>
                <motion.p
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-sm text-gray-400 mt-1"
                >
                    Powered by Stellar
                </motion.p>
            </div>

            {/* Show reconnecting state */}
            {isReconnecting && (
                <div className="flex items-center gap-2 text-teal-600">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Reconnecting to wallet...</span>
                </div>
            )}

            <motion.button
                onClick={() => { setErrorMsg(null); connect() }}
                disabled={isPending || isReconnecting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {hasExistingWallet ? 'Connecting...' : 'Creating Wallet...'}
                    </span>
                ) : (
                    hasExistingWallet ? '🔐 Connect Wallet' : '🚀 Create Wallet'
                )}
            </motion.button>

            {/* Show hint for existing users */}
            {hasExistingWallet && (
                <p className="text-xs text-gray-400">
                    Reconnect to your existing Stellar wallet
                </p>
            )}

            {/* Recovery Link */}
            <motion.button
                onClick={() => setShowRecovery(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-teal-600 underline text-sm hover:text-teal-800"
            >
                🔄 Recover wallet with Aadhaar
            </motion.button>

            {errorMsg && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl max-w-sm text-sm">
                    <p className="font-bold">❌ Connection Failed</p>
                    <p className="mt-1">{errorMsg}</p>
                </div>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-gray-500 text-center max-w-sm space-y-2"
            >
                <p>✨ No seed phrases to remember</p>
                <p>✨ Zero gas fees (sponsored)</p>
                <p>✨ Recover anytime with Aadhaar</p>
            </motion.div>
        </motion.div>
    )
}
