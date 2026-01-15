'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface OnrampModalProps {
    mode: 'buy' | 'sell'
    walletAddress: string
    onClose: () => void
    onSuccess?: () => void
}

export function OnrampModal({ mode, walletAddress, onClose, onSuccess }: OnrampModalProps) {
    const isBuy = mode === 'buy'
    const [isLoading, setIsLoading] = useState(false)
    const [sdkError, setSdkError] = useState<string | null>(null)
    const onrampRef = useRef<any>(null)

    const openOnrampWidget = async () => {
        setIsLoading(true)
        setSdkError(null)

        try {
            // Dynamic import of the SDK (avoids SSR issues)
            const { OnrampWebSDK } = await import('@onramp.money/onramp-web-sdk')

            // Create SDK instance
            const onrampSDK = new OnrampWebSDK({
                // App ID - For demo, use 1 (sandbox) or apply for real one
                appId: 1, // TODO: Replace with actual appId from Onramp dashboard

                // Wallet config
                walletAddress: walletAddress,

                // Transaction config
                coinCode: 'USDC',
                network: 'stellar',
                fiatAmount: 100, // Default amount

                // Flow type: 1 = Buy (on-ramp), 2 = Sell (off-ramp)
                flowType: isBuy ? 1 : 2,

                // Customization
                theme: {
                    lightMode: {
                        baseColor: isBuy ? '#10b981' : '#6366f1',
                        inputRadius: '12px',
                        buttonRadius: '12px'
                    },
                    default: 'lightMode'
                },

                // Language
                lang: 'en',

                // Sandbox mode for testing
                sandbox: true,
            })

            // Store reference for cleanup
            onrampRef.current = onrampSDK

            // Register event handlers
            onrampSDK.on('TX_EVENTS', (event: any) => {
                console.log('[ONRAMP] TX Event:', event)
                if (event.type === 'ONRAMP_WIDGET_TX_SUCCESSFUL') {
                    console.log('[ONRAMP] Transaction successful!')
                    onSuccess?.()
                    onrampSDK.close()
                    onClose()
                }
            })

            onrampSDK.on('WIDGET_EVENTS', (event: any) => {
                console.log('[ONRAMP] Widget Event:', event)
                if (event.type === 'ONRAMP_WIDGET_CLOSE_REQUEST_CONFIRMED') {
                    console.log('[ONRAMP] Widget closed by user')
                }
            })

            // Show the widget
            onrampSDK.show()
            console.log('[ONRAMP] Widget opened for', isBuy ? 'Buy' : 'Sell')
            setIsLoading(false)

        } catch (error: any) {
            console.error('[ONRAMP] Error:', error)
            setSdkError(error.message || 'Failed to load Onramp widget')
            setIsLoading(false)
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (onrampRef.current) {
                try {
                    onrampRef.current.close()
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    }, [])

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900">
                            {isBuy ? '💵 Add Money' : '🏦 Cash Out'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                        >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Error Display */}
                    {sdkError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-600">{sdkError}</p>
                        </div>
                    )}

                    {/* Flow Illustration */}
                    <div className={`rounded-2xl p-4 mb-6 ${isBuy ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-center">
                                <div className={`w-12 h-12 rounded-full ${isBuy ? 'bg-emerald-100' : 'bg-indigo-100'} flex items-center justify-center mb-2 mx-auto`}>
                                    <span className="text-xl">{isBuy ? '🏦' : '💰'}</span>
                                </div>
                                <p className="text-xs font-medium text-slate-600">{isBuy ? 'UPI' : 'Wallet'}</p>
                            </div>

                            <svg className={`w-8 h-8 ${isBuy ? 'text-emerald-500' : 'text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>

                            <div className="text-center">
                                <div className={`w-12 h-12 rounded-full ${isBuy ? 'bg-emerald-100' : 'bg-indigo-100'} flex items-center justify-center mb-2 mx-auto`}>
                                    <span className="text-xl">{isBuy ? '💰' : '🏦'}</span>
                                </div>
                                <p className="text-xs font-medium text-slate-600">{isBuy ? 'Wallet' : 'Bank'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <span className="text-lg">⚡</span>
                            <div>
                                <p className="text-sm font-medium text-slate-900">Instant Transfer</p>
                                <p className="text-xs text-slate-500">{isBuy ? 'USDC arrives in seconds' : 'Money in bank within 24hrs'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <span className="text-lg">🔒</span>
                            <div>
                                <p className="text-sm font-medium text-slate-900">Secure & Compliant</p>
                                <p className="text-xs text-slate-500">FIU-IND registered partner</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <span className="text-lg">💳</span>
                            <div>
                                <p className="text-sm font-medium text-slate-900">{isBuy ? 'UPI, Bank Transfer' : 'IMPS, NEFT'}</p>
                                <p className="text-xs text-slate-500">Multiple payment options</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={openOnrampWidget}
                        disabled={isLoading}
                        className={`w-full py-4 rounded-2xl font-bold text-white text-lg ${isBuy
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                            } ${isLoading ? 'opacity-50 cursor-wait' : ''} transition-all`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Opening...
                            </span>
                        ) : isBuy ? (
                            'Add Money via UPI'
                        ) : (
                            'Withdraw to Bank'
                        )}
                    </button>

                    {/* Footer */}
                    <p className="text-center text-xs text-slate-400 mt-4">
                        Powered by <span className="font-semibold">Onramp.money</span>
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
