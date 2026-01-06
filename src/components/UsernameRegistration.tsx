'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { registerUsername, getUsername } from '@/lib/username-registry'
import confetti from 'canvas-confetti'

export function UsernameRegistration() {
    const { address } = useAccount()
    const [username, setUsername] = useState('')
    const [existingUsername, setExistingUsername] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)

    // Check if user already has a username
    useEffect(() => {
        if (address) {
            const existing = getUsername(address)
            setExistingUsername(existing)
        }
    }, [address])

    const handleRegister = () => {
        if (!address || !username) return
        
        setIsRegistering(true)
        setError('')
        
        // Small delay for UX
        setTimeout(() => {
            const result = registerUsername(username, address)
            
            if (result.success) {
                setExistingUsername(username.toLowerCase())
                setUsername('')
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                })
            } else {
                setError(result.error || 'Registration failed')
            }
            
            setIsRegistering(false)
        }, 500)
    }

    // Already has username
    if (existingUsername) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                        <p className="text-sm text-gray-600">Your MiniPay ID</p>
                        <p className="text-xl font-bold text-green-700">{existingUsername}@minipay</p>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Share this ID to receive payments - no wallet address needed!
                </p>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl"
        >
            <div className="mb-3">
                <p className="font-semibold text-gray-800">Create Your MiniPay ID</p>
                <p className="text-xs text-gray-500">Like UPI ID - easy to share, easy to remember</p>
            </div>
            
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                            setError('')
                        }}
                        placeholder="yourname"
                        maxLength={20}
                        className="w-full px-3 py-2 pr-20 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-800"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        @minipay
                    </span>
                </div>
                <button
                    onClick={handleRegister}
                    disabled={!username || username.length < 3 || isRegistering}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                >
                    {isRegistering ? '...' : 'Claim'}
                </button>
            </div>
            
            {error && (
                <p className="text-red-500 text-xs mt-2">{error}</p>
            )}
            
            {username && username.length >= 3 && !error && (
                <p className="text-green-600 text-xs mt-2">
                    ✓ {username}@minipay is available!
                </p>
            )}
        </motion.div>
    )
}
