'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface BridgeModalProps {
    onClose: () => void
    usdcBalance: string
}

const CHAINS = [
    { name: 'Stellar', icon: '⭐', active: true, chain: 'stellar' },
    { name: 'Ethereum', icon: '⟠', active: false, chain: 'ethereum', comingSoon: true },
    { name: 'Base', icon: '🔵', active: false, chain: 'base', comingSoon: true },
    { name: 'Arbitrum', icon: '🔷', active: false, chain: 'arbitrum', comingSoon: true },
    { name: 'Polygon', icon: '💜', active: false, chain: 'polygon', comingSoon: true }
]

export function BridgeModal({ onClose, usdcBalance }: BridgeModalProps) {
    const [selectedChain, setSelectedChain] = useState('stellar')
    const [amount, setAmount] = useState('')

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Bridge USDC</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Current Balance */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 mb-6 text-white">
                        <p className="text-sm text-white/70">Available on Stellar</p>
                        <p className="text-2xl font-bold">{parseFloat(usdcBalance).toFixed(2)} USDC</p>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Amount to Bridge
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-slate-100 rounded-xl p-4 pr-20 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={() => setAmount(usdcBalance)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-indigo-600 font-semibold"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    {/* Chain Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-600 mb-3">
                            Bridge To
                        </label>
                        <div className="space-y-2">
                            {CHAINS.map(chain => (
                                <button
                                    key={chain.name}
                                    onClick={() => !chain.comingSoon && setSelectedChain(chain.chain)}
                                    disabled={chain.comingSoon}
                                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${selectedChain === chain.chain
                                            ? 'bg-indigo-100 border-2 border-indigo-500'
                                            : chain.comingSoon
                                                ? 'bg-slate-50 opacity-60 cursor-not-allowed'
                                                : 'bg-slate-100 hover:bg-slate-200'
                                        }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="text-2xl">{chain.icon}</span>
                                        <span className="font-semibold text-slate-700">{chain.name}</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        {chain.active && (
                                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                                Active
                                            </span>
                                        )}
                                        {chain.comingSoon && (
                                            <span className="text-xs text-slate-500">
                                                Coming Soon
                                            </span>
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <span className="text-amber-500 text-xl">⏳</span>
                            <div>
                                <p className="text-sm font-medium text-amber-800">
                                    Cross-Chain Bridging Coming Soon
                                </p>
                                <p className="text-xs text-amber-600 mt-1">
                                    Circle CCTP integration in progress. You'll be able to bridge USDC to Ethereum, Base, and more.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bridge Button */}
                    <button
                        disabled={selectedChain !== 'stellar'}
                        className="w-full bg-slate-200 text-slate-500 py-4 rounded-xl font-semibold cursor-not-allowed"
                    >
                        {selectedChain === 'stellar'
                            ? 'Already on Stellar'
                            : 'Bridge Coming Soon'}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
