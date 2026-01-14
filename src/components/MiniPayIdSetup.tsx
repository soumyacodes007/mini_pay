'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface MiniPayIdSetupProps {
    walletAddress: string
    onComplete: (username: string) => void
}

export function MiniPayIdSetup({ walletAddress, onComplete }: MiniPayIdSetupProps) {
    const [username, setUsername] = useState('')
    const [isChecking, setIsChecking] = useState(false)
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

    const validateUsername = (value: string) => {
        const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, '')
        return cleaned.slice(0, 15)
    }

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cleaned = validateUsername(e.target.value)
        setUsername(cleaned)
        setIsAvailable(null)

        if (cleaned.length >= 3) {
            setIsChecking(true)
            setTimeout(() => {
                setIsAvailable(true)
                setIsChecking(false)
            }, 500)
        }
    }

    const handleSubmit = () => {
        if (username.length >= 3 && isAvailable) {
            onComplete(username)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Header with Icon */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', bounce: 0.4 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl mb-6 shadow-lg shadow-indigo-200"
                    >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                    </motion.div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Choose your payment handle
                    </h2>
                    <p className="text-slate-500 mt-2">
                        This is how friends will pay you
                    </p>
                </div>

                {/* Large Input - No Container Box */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            placeholder="yourname"
                            autoFocus
                            className="w-full px-6 py-5 bg-white rounded-2xl text-slate-900 text-2xl font-semibold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all placeholder:text-slate-300"
                        />
                        {/* Status Icon */}
                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                            {isChecking && (
                                <svg className="animate-spin h-6 w-6 text-indigo-600" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            {!isChecking && isAvailable === true && (
                                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Suffix */}
                    <p className="text-slate-400 text-lg mt-3 text-center font-medium">
                        @minipay
                    </p>

                    {/* Status */}
                    <div className="mt-4 min-h-[24px] text-center">
                        {username.length > 0 && username.length < 3 && (
                            <p className="text-sm text-slate-500">Minimum 3 characters</p>
                        )}
                        {isAvailable === true && (
                            <p className="text-sm text-green-600 font-medium">✓ Available</p>
                        )}
                    </div>
                </div>

                {/* Preview */}
                {username.length >= 3 && isAvailable && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 text-center"
                    >
                        <p className="text-sm text-slate-500 mb-1">Your handle</p>
                        <p className="text-xl font-bold text-indigo-600">
                            {username}@minipay
                        </p>
                    </motion.div>
                )}

                {/* Continue Button */}
                <motion.button
                    onClick={handleSubmit}
                    disabled={username.length < 3 || !isAvailable}
                    whileHover={{ scale: username.length >= 3 && isAvailable ? 1.02 : 1 }}
                    whileTap={{ scale: username.length >= 3 && isAvailable ? 0.98 : 1 }}
                    className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${username.length >= 3 && isAvailable
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    Continue
                </motion.button>

                {/* Wallet Address */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400">
                        Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
