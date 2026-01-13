'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from '@/providers/StellarProvider'
import { getUsername } from '@/lib/username-registry'
import { createPaymentUri, shortenAddress } from '@/lib/stellar-config'

export function PaymentQR() {
    const { address } = useAccount()
    const [amount, setAmount] = useState('')
    const [showQR, setShowQR] = useState(false)
    const [copied, setCopied] = useState(false)

    // Get username if registered
    const username = address ? getUsername(address) : null

    // Generate SEP-0007 payment URI
    const paymentUri = address
        ? createPaymentUri(address, amount || '0', username || undefined)
        : ''

    // Display format
    const displayId = username ? `${username}@rail` : (address ? shortenAddress(address) : '')

    const copyId = async () => {
        const textToCopy = username ? `${username}@rail` : address || ''
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleGenerateQR = () => {
        if (!amount || parseFloat(amount) <= 0) {
            return
        }
        setShowQR(true)
    }

    return (
        <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Receive Payment</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Enter amount and show QR to receive USDC
                </p>
            </div>

            {/* Rail ID Display with Copy */}
            <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-teal-200">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500">Your Rail ID</p>
                        <p className={`font-semibold ${username ? 'text-teal-700 text-lg' : 'font-mono text-sm text-gray-700'}`}>
                            {displayId}
                        </p>
                    </div>
                    <button
                        onClick={copyId}
                        className="px-4 py-2 bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-sm font-medium hover:bg-teal-200 transition-colors flex-shrink-0"
                    >
                        {copied ? '✅ Copied!' : '📋 Copy'}
                    </button>
                </div>
                {!username && (
                    <p className="text-xs text-orange-600 mt-2">
                        💡 Go to Pay tab to create your @rail username
                    </p>
                )}
            </div>

            <div className="space-y-4">
                {/* Amount Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to Request (USDC)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                            setAmount(e.target.value)
                            setShowQR(false)
                        }}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none transition-colors text-2xl text-center font-bold text-gray-800 placeholder-gray-300"
                        style={{ color: '#1f2937' }}
                    />
                </div>

                {/* Generate QR Button */}
                {!showQR ? (
                    <button
                        onClick={handleGenerateQR}
                        disabled={!amount || parseFloat(amount) <= 0}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed text-lg"
                    >
                        📱 Generate Payment QR
                    </button>
                ) : (
                    <button
                        onClick={() => setShowQR(false)}
                        className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors border border-gray-200"
                    >
                        ✏️ Change Amount
                    </button>
                )}

                {/* QR Code Display */}
                <AnimatePresence>
                    {showQR && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-teal-200"
                        >
                            <div className="bg-white p-4 rounded-lg flex justify-center">
                                <QRCodeSVG
                                    value={paymentUri}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            {/* Amount Display */}
                            <div className="text-center mt-4">
                                <p className="text-sm text-gray-500">Request Amount</p>
                                <p className="text-3xl font-bold text-teal-600">{amount} USDC</p>
                                {username && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Pay to: <span className="font-semibold">{username}@rail</span>
                                    </p>
                                )}
                            </div>

                            {/* Instructions */}
                            <p className="text-center text-xs text-gray-400 mt-3">
                                Ask sender to scan this QR code
                            </p>

                            {/* SEP-0007 Badge */}
                            <div className="mt-3 flex justify-center">
                                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                                    SEP-0007 Compatible
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
