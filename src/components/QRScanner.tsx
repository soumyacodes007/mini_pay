'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import QrScanner from 'qr-scanner'

interface QRScannerProps {
    onScan: (address: string, amount: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState('')
    const videoRef = useRef<HTMLVideoElement>(null)
    const scannerRef = useRef<QrScanner | null>(null)

    // Initialize scanner when isScanning becomes true
    useEffect(() => {
        if (!isScanning || !videoRef.current) return

        const initScanner = async () => {
            try {
                console.log('Initializing QR Scanner...')

                const scanner = new QrScanner(
                    videoRef.current!,
                    (result) => {
                        const [address, amount] = result.data.split(':')
                        if (address && amount) {
                            onScan(address, amount)
                            stopScanning()
                        } else {
                            setError('Invalid QR code format')
                        }
                    },
                    {
                        returnDetailedScanResult: true,
                        highlightScanRegion: true,
                        preferredCamera: 'environment',
                    }
                )

                scannerRef.current = scanner
                await scanner.start()
                console.log('QR Scanner started!')
            } catch (err: unknown) {
                console.error('Camera error:', err)
                const msg = err instanceof Error ? err.message : 'Unknown error'
                if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
                    setError('Camera permission denied. Please allow camera access in your browser settings.')
                } else if (msg.includes('NotFoundError')) {
                    setError('No camera found on this device.')
                } else {
                    setError(`Camera error: ${msg}`)
                }
                setIsScanning(false)
            }
        }

        initScanner()

        // Cleanup on unmount or when scanning stops
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop()
                scannerRef.current.destroy()
                scannerRef.current = null
            }
        }
    }, [isScanning, onScan])

    const startScanning = () => {
        setError('')
        setIsScanning(true)
    }

    const stopScanning = () => {
        setIsScanning(false)
    }

    return (
        <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Scan to Pay</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Scan a payment QR code
                </p>
            </div>

            <div className="space-y-4">
                {!isScanning ? (
                    <button
                        onClick={startScanning}
                        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                    >
                        📷 Open Camera
                    </button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative"
                    >
                        <video
                            ref={videoRef}
                            className="w-full rounded-xl bg-black min-h-[300px]"
                            playsInline
                            muted
                        />
                        <button
                            onClick={stopScanning}
                            className="absolute top-2 right-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold"
                        >
                            Cancel
                        </button>
                    </motion.div>
                )}

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    )
}
