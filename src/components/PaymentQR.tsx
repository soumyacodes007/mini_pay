'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'

interface PaymentQRProps {
    amount?: string
}

export function PaymentQR({ amount = '0' }: PaymentQRProps) {
    const { address } = useAccount()
    const [showQR, setShowQR] = useState(false)

    // Payment request format: address:amount
    const paymentData = `${address}:${amount}`

    return (
        <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Receive Payment</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Show this QR code to receive USDC
                </p>
            </div>

            <div className="space-y-4">
                <button
                    onClick={() => setShowQR(!showQR)}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                >
                    {showQR ? 'Hide QR Code' : '📱 Generate Payment QR'}
                </button>

                <AnimatePresence>
                    {showQR && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200"
                        >
                            <div className="bg-white p-4 rounded-lg">
                                <QRCodeSVG
                                    value={paymentData}
                                    size={256}
                                    level="H"
                                    className="w-full h-auto"
                                />
                            </div>
                            <p className="text-center text-sm text-gray-600 mt-4">
                                Scan to pay <span className="font-bold">{amount || '0'} USDC</span>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
