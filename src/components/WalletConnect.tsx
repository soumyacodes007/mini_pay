'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { SendUSDC } from './SendUSDC'
import { AadhaarVerification } from './AadhaarVerification'
import { PaymentQR } from './PaymentQR'
import { QRScanner } from './QRScanner'
import { AadhaarRecovery } from './AadhaarRecovery'
import { getUsername } from '@/lib/username-registry'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'

export function WalletConnect() {
    const { address, isConnected, isReconnecting } = useAccount()
    const { connect, connectors, isPending, error: connectError } = useConnect()
    const { disconnect } = useDisconnect()
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
        const savedWallet = localStorage.getItem('minipay_last_wallet')
        if (savedWallet) {
            setHasExistingWallet(true)
        }
    }, [])

    // Save wallet address when connected
    useEffect(() => {
        if (isConnected && address) {
            localStorage.setItem('minipay_last_wallet', address)
        }
    }, [isConnected, address])

    // Show connect errors
    useEffect(() => {
        if (connectError) {
            console.error('Connect Error:', connectError)
            setErrorMsg(connectError.message)
        }
    }, [connectError])

    // Coinbase Smart Wallet will be the first connector
    const coinbaseConnector = connectors[0]

    const handleScanResult = (scannedAddress: string, amount: string, username?: string) => {
        // Store scanned values
        setScannedRecipient(scannedAddress)
        setScannedAmount(amount)

        // Trigger confetti on successful scan
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        })

        // Navigate to send tab
        setView('send')
    }

    const handleRecoverySuccess = (walletAddress: string, username?: string) => {
        console.log('[RECOVERY] Wallet recovered:', walletAddress, 'Username:', username)
        setShowRecovery(false)
        
        // Store the recovered wallet info for reference
        localStorage.setItem('minipay_last_wallet', walletAddress)
        if (username) {
            localStorage.setItem('minipay_recovered_username', username)
        }
        
        // Prompt user to connect with passkey
        // The wallet address is now known, user needs to authenticate
        alert(`Wallet found: ${username ? username + '@minipay' : walletAddress.slice(0, 10) + '...'}\n\nClick "Connect with Passkey" to access your wallet.`)
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
                    className="w-full flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl"
                >
                    <div className="text-white text-center">
                        {username ? (
                            <>
                                <p className="text-2xl font-bold">{username}@minipay</p>
                                <p className="font-mono text-xs mt-1 opacity-70">{address.slice(0, 6)}...{address.slice(-4)}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm opacity-80">Smart Wallet</p>
                                <p className="font-mono text-xs mt-1">{address.slice(0, 6)}...{address.slice(-4)}</p>
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => disconnect()}
                        className="px-6 py-2 bg-white text-purple-600 rounded-full font-semibold hover:scale-105 transition-transform"
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
                        { id: 'send', label: '💸 Send', icon: '💸' },
                        { id: 'receive', label: '📱 Receive', icon: '📱' },
                        { id: 'scan', label: '📷 Scan', icon: '📷' },
                        { id: 'verify', label: '🆔 Verify', icon: '🆔' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setView(tab.id as typeof view)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${view === tab.id
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
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
                    className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                    MiniPay India
                </motion.h1>
                <motion.p
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-600 mt-3 text-lg"
                >
                    Pay with crypto as easy as UPI
                </motion.p>
            </div>

            {/* Show reconnecting state */}
            {isReconnecting && (
                <div className="flex items-center gap-2 text-blue-600">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Reconnecting to wallet...</span>
                </div>
            )}

            <motion.button
                onClick={() => { setErrorMsg(null); connect({ connector: coinbaseConnector }) }}
                disabled={isPending || isReconnecting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
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
                    hasExistingWallet ? '🔐 Connect with Passkey' : '🔐 Create Wallet with Passkey'
                )}
            </motion.button>

            {/* Show hint for existing users */}
            {hasExistingWallet && (
                <p className="text-xs text-gray-400">
                    Use the same passkey to access your existing wallet
                </p>
            )}

            {/* Recovery Link */}
            <motion.button
                onClick={() => setShowRecovery(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-blue-600 underline text-sm hover:text-blue-800"
            >
                🔄 Recover wallet with Aadhaar
            </motion.button>

            {errorMsg && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl max-w-sm text-sm">
                    <p className="font-bold">❌ Connection Failed</p>
                    <p className="mt-1">{errorMsg}</p>
                    <p className="mt-2 text-xs text-red-500">Tip: Mobile requires HTTPS. Try using ngrok.</p>
                </div>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-gray-500 text-center max-w-sm space-y-2"
            >
                <p>✨ No seed phrases to remember</p>
                <p>✨ No gas fees to worry about</p>
                <p>✨ Recover anytime with Aadhaar</p>
            </motion.div>
        </motion.div>
    )
}
