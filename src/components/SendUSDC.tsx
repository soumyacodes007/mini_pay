'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useStellar } from '@/providers/StellarProvider'
import { registerUsername, resolveUsername, getUsername } from '@/lib/username-registry'
import { isValidStellarAddress, shortenAddress, STELLAR_CONFIG, USDC_ASSET } from '@/lib/stellar-config'
import { Horizon, TransactionBuilder, Operation, Asset, BASE_FEE, Memo, Networks } from '@stellar/stellar-sdk'
import confetti from 'canvas-confetti'

interface SendUSDCProps {
    initialRecipient?: string
    initialAmount?: string
}

export function SendUSDC({ initialRecipient = '', initialAmount = '' }: SendUSDCProps) {
    const { address } = useAccount()
    const { wallet, signTransaction, refreshBalance } = useStellar()

    const [recipient, setRecipient] = useState(initialRecipient)
    const [amount, setAmount] = useState(initialAmount)
    const [isLoading, setIsLoading] = useState(false)
    const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'submitting' | 'success' | 'error'>('idle')
    const [txHash, setTxHash] = useState('')
    const [error, setError] = useState('')

    // Username registration state
    const [newUsername, setNewUsername] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)

    const currentUsername = address ? getUsername(address) : null

    // Resolve recipient (could be username or address)
    const resolveRecipientAddress = (input: string): string | null => {
        // Check if it's a username (ends with @rail)
        if (input.endsWith('@rail')) {
            const username = input.replace('@rail', '')
            return resolveUsername(username)
        }

        // Check if it's a valid Stellar address
        if (isValidStellarAddress(input)) {
            return input
        }

        // Try to resolve as plain username
        const resolved = resolveUsername(input)
        if (resolved) return resolved

        return null
    }

    const handleSend = async () => {
        if (!wallet || !address) {
            setError('Please connect your wallet first')
            return
        }

        const resolvedRecipient = resolveRecipientAddress(recipient)
        if (!resolvedRecipient) {
            setError('Invalid recipient address or username')
            return
        }

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount')
            return
        }

        setIsLoading(true)
        setError('')
        setTxStatus('signing')

        try {
            const horizon = new Horizon.Server(STELLAR_CONFIG.horizonUrl)

            // Load source account
            const sourceAccount = await horizon.loadAccount(address)

            // Build transaction
            const transaction = new TransactionBuilder(sourceAccount, {
                fee: BASE_FEE,
                networkPassphrase: Networks.TESTNET
            })
                .addOperation(Operation.payment({
                    destination: resolvedRecipient,
                    asset: USDC_ASSET,
                    amount: amount
                }))
                .setTimeout(30)
                .build()

            // Sign transaction
            const signedXdr = await signTransaction(transaction.toXDR())
            const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET)

            setTxStatus('submitting')

            // Submit to network
            const result = await horizon.submitTransaction(signedTx)

            setTxHash(result.hash)
            setTxStatus('success')

            // Celebration!
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 }
            })

            // Refresh balance
            setTimeout(() => refreshBalance(), 2000)

        } catch (err: any) {
            console.error('[PAYMENT] Error:', err)
            setTxStatus('error')

            // Parse error message
            if (err?.response?.data?.extras?.result_codes) {
                const codes = err.response.data.extras.result_codes
                if (codes.operations?.includes('op_underfunded')) {
                    setError('Insufficient USDC balance')
                } else if (codes.operations?.includes('op_no_destination')) {
                    setError('Recipient account does not exist or cannot receive USDC')
                } else if (codes.operations?.includes('op_no_trust')) {
                    setError('Recipient has not set up USDC trustline')
                } else {
                    setError(`Transaction failed: ${JSON.stringify(codes)}`)
                }
            } else {
                setError(err.message || 'Transaction failed')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegisterUsername = async () => {
        if (!newUsername.trim() || !address) return

        setIsRegistering(true)
        try {
            const success = registerUsername(newUsername.trim(), address)
            if (success) {
                setNewUsername('')
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
            } else {
                setError('Username already taken')
            }
        } finally {
            setIsRegistering(false)
        }
    }

    // Success state
    if (txStatus === 'success') {
        return (
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl mx-auto text-center"
            >
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Payment Sent!</h3>
                <p className="text-gray-600 mb-4">
                    {amount} USDC sent to {recipient.endsWith('@rail') ? recipient : shortenAddress(recipient)}
                </p>

                <a
                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 underline"
                >
                    View on Explorer →
                </a>

                <button
                    onClick={() => {
                        setTxStatus('idle')
                        setRecipient('')
                        setAmount('')
                        setTxHash('')
                    }}
                    className="mt-6 w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600"
                >
                    Send Another
                </button>
            </motion.div>
        )
    }

    return (
        <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Send Payment</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Send USDC to any Stellar address or @rail username
                </p>
            </div>

            {/* Username Registration */}
            {!currentUsername && (
                <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-800 font-medium mb-2">💡 Create your @rail ID</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                            placeholder="username"
                            className="flex-1 px-3 py-2 rounded-lg border border-amber-200 text-sm"
                            maxLength={20}
                        />
                        <button
                            onClick={handleRegisterUsername}
                            disabled={!newUsername.trim() || isRegistering}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            {isRegistering ? '...' : 'Claim'}
                        </button>
                    </div>
                </div>
            )}

            {currentUsername && (
                <div className="mb-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <p className="text-sm text-teal-700">
                        <span className="font-medium">Your ID:</span> {currentUsername}@rail
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {/* Recipient Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipient
                    </label>
                    <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="G... or username@rail"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none transition-colors text-gray-800"
                    />
                </div>

                {/* Amount Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (USDC)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none transition-colors text-2xl text-center font-bold text-gray-800"
                    />
                    {wallet && (
                        <p className="text-xs text-gray-400 mt-1 text-right">
                            Balance: {parseFloat(wallet.usdcBalance).toFixed(2)} USDC
                        </p>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Send Button */}
                <motion.button
                    onClick={handleSend}
                    disabled={isLoading || !recipient || !amount}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            {txStatus === 'signing' ? 'Signing...' : 'Sending...'}
                        </span>
                    ) : (
                        '💸 Send Payment'
                    )}
                </motion.button>

                <p className="text-xs text-gray-400 text-center">
                    ⚡ Zero gas fees • Instant confirmation
                </p>
            </div>
        </div>
    )
}
