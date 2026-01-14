'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { LogInWithAnonAadhaar, useAnonAadhaar } from '@anon-aadhaar/react'

interface OnboardingProps {
    onCreateAccount: () => void
    onRecoverAccount: () => void
    onSkipAadhaar: () => void
    onAadhaarComplete: () => void
}

type Step = 'welcome' | 'create-choice' | 'aadhaar-verify' | 'recovery'

export function OnboardingFlow({
    onCreateAccount,
    onRecoverAccount,
    onSkipAadhaar,
    onAadhaarComplete
}: OnboardingProps) {
    const [step, setStep] = useState<Step>('welcome')
    const [anonAadhaar] = useAnonAadhaar()

    // Welcome Screen - Two Options Only
    if (step === 'welcome') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Logo & Brand */}
                    <div className="text-center mb-12">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.4 }}
                            className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-2xl mb-6 shadow-lg shadow-indigo-200"
                        >
                            <span className="text-4xl">💸</span>
                        </motion.div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            MiniPay
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Payments made simple
                        </p>
                    </div>

                    {/* Main Actions */}
                    <div className="space-y-4">
                        <motion.button
                            onClick={() => setStep('create-choice')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 px-6 bg-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
                        >
                            Create Account
                        </motion.button>

                        <motion.button
                            onClick={() => setStep('recovery')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 px-6 bg-white text-slate-700 rounded-2xl font-semibold text-lg border-2 border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-colors"
                        >
                            Get Existing Account
                        </motion.button>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-slate-400 text-sm mt-8">
                        Secure payments powered by blockchain
                    </p>
                </motion.div>
            </div>
        )
    }

    // Create Account - Choose Aadhaar Verification
    if (step === 'create-choice') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Back Button */}
                    <button
                        onClick={() => setStep('welcome')}
                        className="flex items-center text-slate-500 hover:text-slate-700 mb-8 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Secure Your Account
                        </h2>
                        <p className="text-slate-500">
                            Link your Aadhaar for easy recovery if you lose your device
                        </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                        {/* Recommended Option */}
                        <motion.button
                            onClick={() => setStep('aadhaar-verify')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-5 bg-white rounded-2xl border-2 border-indigo-200 hover:border-indigo-400 transition-colors text-left relative overflow-hidden"
                        >
                            <div className="absolute top-3 right-3 px-2 py-1 bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-full">
                                Recommended
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🪪</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-1">
                                        Verify with Aadhaar
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Recover your wallet on any device using your Aadhaar card
                                    </p>
                                </div>
                            </div>
                        </motion.button>

                        {/* Skip Option */}
                        <motion.button
                            onClick={() => {
                                onSkipAadhaar()
                                onCreateAccount()
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-colors text-left"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">⏭️</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-1">
                                        Skip for now
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        You can verify later from settings
                                    </p>
                                </div>
                            </div>
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        )
    }

    // Aadhaar Verification Screen
    if (step === 'aadhaar-verify') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Back Button */}
                    <button
                        onClick={() => setStep('create-choice')}
                        className="flex items-center text-slate-500 hover:text-slate-700 mb-8 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
                            <span className="text-3xl">🪪</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Verify Your Identity
                        </h2>
                        <p className="text-slate-500">
                            Scan your Aadhaar QR code to enable recovery
                        </p>
                    </div>

                    {/* Aadhaar Login Button */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6">
                        <div className="flex justify-center mb-4">
                            <LogInWithAnonAadhaar
                                nullifierSeed={1234567890}
                                fieldsToReveal={[]}
                            />
                        </div>

                        {anonAadhaar.status === 'logging-in' && (
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-indigo-600">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span className="font-medium">Verifying...</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-2">
                                    This may take a few minutes
                                </p>
                            </div>
                        )}

                        {anonAadhaar.status === 'logged-in' && (
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="font-semibold">Verified!</span>
                                </div>
                                <motion.button
                                    onClick={() => {
                                        onAadhaarComplete()
                                        onCreateAccount()
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold"
                                >
                                    Continue
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {/* Privacy Note */}
                    <div className="flex items-start gap-3 p-4 bg-slate-100 rounded-xl">
                        <span className="text-lg">🔒</span>
                        <p className="text-sm text-slate-600">
                            Your Aadhaar data stays private. We only store a cryptographic proof, not your personal information.
                        </p>
                    </div>
                </motion.div>
            </div>
        )
    }

    // Recovery Screen
    if (step === 'recovery') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Back Button */}
                    <button
                        onClick={() => setStep('welcome')}
                        className="flex items-center text-slate-500 hover:text-slate-700 mb-8 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
                            <span className="text-3xl">🔄</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-slate-500">
                            Scan your Aadhaar to recover your account
                        </p>
                    </div>

                    {/* Aadhaar Login for Recovery */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6">
                        <div className="flex justify-center mb-4">
                            <LogInWithAnonAadhaar
                                nullifierSeed={1234567890}
                                fieldsToReveal={[]}
                            />
                        </div>

                        {anonAadhaar.status === 'logging-in' && (
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-indigo-600">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span className="font-medium">Verifying...</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-2">
                                    Looking for your account...
                                </p>
                            </div>
                        )}

                        {anonAadhaar.status === 'logged-in' && (
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="font-semibold">Account Found!</span>
                                </div>
                                <motion.button
                                    onClick={onRecoverAccount}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold"
                                >
                                    Access Account
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {/* Help Text */}
                    <p className="text-center text-sm text-slate-500">
                        Make sure to scan the same Aadhaar you used during account creation
                    </p>
                </motion.div>
            </div>
        )
    }

    return null
}
