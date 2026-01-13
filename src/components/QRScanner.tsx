'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import QrScanner from 'qr-scanner'
import { getUsername } from '@/lib/username-registry'
import { parsePaymentUri, isValidStellarAddress, shortenAddress } from '@/lib/stellar-config'

interface QRScannerProps {
    onScan: (address: string, amount: string, username?: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState('')
    const [scannedData, setScannedData] = useState<{ address: string; amount: string; username?: string } | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const scannerRef = useRef<QrScanner | null>(null)

    useEffect(() => {
        if (!isScanning || !videoRef.current) return

        const initScanner = async () => {
            try {
                const scanner = new QrScanner(
                    videoRef.current!,
                    (result) => {
                        const data = result.data

                        // Try SEP-0007 format first (web+stellar:pay?...)
                        const sep0007 = parsePaymentUri(data)
                        if (sep0007) {
                            const username = sep0007.memo || getUsername(sep0007.destination)
                            setScannedData({
                                address: sep0007.destination,
                                amount: sep0007.amount,
                                username: username || undefined
                            })
                            stopScanning()
                            return
                        }

                        // Try legacy format (address:amount:username)
                        const parts = data.split(':')
                        if (parts.length >= 2 && isValidStellarAddress(parts[0])) {
                            const address = parts[0]
                            const amount = parts[1]
                            const username = parts[2] || getUsername(address)
                            setScannedData({ address, amount, username: username || undefined })
                            stopScanning()
                            return
                        }

                        // Check if it's just a Stellar address
                        if (isValidStellarAddress(data)) {
                            setScannedData({ address: data, amount: '0', username: getUsername(data) || undefined })
                            stopScanning()
                            return
                        }

                        setError('Invalid QR code format. Expected Stellar payment URI.')
                    },
                    {
                        returnDetailedScanResult: true,
                        highlightScanRegion: true,
                        preferredCamera: 'environment',
                    }
                )

                scannerRef.current = scanner
                await scanner.start()
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Unknown error'
                if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
                    setError('Camera permission denied.')
                } else if (msg.includes('NotFoundError')) {
                    setError('No camera found.')
                } else {
                    setError(`Camera error: ${msg}`)
                }
                setIsScanning(false)
            }
        }

        initScanner()

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop()
                scannerRef.current.destroy()
                scannerRef.current = null
            }
        }
    }, [isScanning])

    const startScanning = () => {
        setError('')
        setScannedData(null)
        setIsScanning(true)
    }

    const stopScanning = () => {
        setIsScanning(false)
    }

    const confirmPayment = () => {
        if (scannedData) {
            onScan(scannedData.address, scannedData.amount, scannedData.username)
            setScannedData(null)
        }
    }

    if (scannedData) {
        return (
            <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl mx-auto">
                <div className="mb-6 text-center">
                    <div className="text-5xl mb-3">💸</div>
                    <h2 className="text-2xl font-bold text-gray-800">Confirm Payment</h2>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-teal-200">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Pay to</p>
                            {scannedData.username ? (
                                <p className="text-xl font-bold text-teal-700">{scannedData.username}@rail</p>
                            ) : (
                                <p className="font-mono text-sm text-gray-700">
                                    {shortenAddress(scannedData.address)}
                                </p>
                            )}
                        </div>
                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="text-4xl font-bold text-emerald-600">{scannedData.amount} USDC</p>
                        </div>
                    </div>

                    <motion.button
                        onClick={confirmPayment}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg text-lg"
                    >
                        ✅ Confirm & Pay
                    </motion.button>

                    <button
                        onClick={() => setScannedData(null)}
                        className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Scan to Pay</h2>
                <p className="text-sm text-gray-500 mt-1">Scan a Stellar payment QR code</p>
            </div>

            <div className="space-y-4">
                {!isScanning ? (
                    <button
                        onClick={startScanning}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:scale-105 transition-transform text-lg"
                    >
                        📷 Open Camera
                    </button>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                        <video ref={videoRef} className="w-full rounded-xl bg-black min-h-[300px]" playsInline muted />
                        <button
                            onClick={stopScanning}
                            className="absolute top-2 right-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold"
                        >
                            Cancel
                        </button>
                        <div className="absolute bottom-2 left-2 right-2 text-center">
                            <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                                Scanning for SEP-0007 QR code...
                            </span>
                        </div>
                    </motion.div>
                )}

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                )}
            </div>
        </div>
    )
}
