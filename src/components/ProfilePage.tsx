'use client'

import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { TokenList } from './TokenList'
import { BridgeModal } from './BridgeModal'
import { TokenBalances } from '@/providers/StellarProvider'

interface ProfilePageProps {
    address: string
    username: string | null
    usdcBalance: string
    xlmBalance: string
    tokenBalances?: TokenBalances
    onBack: () => void
}

export function ProfilePage({ address, username, usdcBalance, xlmBalance, tokenBalances, onBack }: ProfilePageProps) {
    const displayName = username || 'User'
    const balanceNum = parseFloat(usdcBalance)
    const inrBalance = (balanceNum * 90.27).toFixed(2)
    const [showBridgeModal, setShowBridgeModal] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(address)
            alert('Wallet address copied!')
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const shortenAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    return (
        <div className="h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center gap-4 p-4">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Profile</h1>
                </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-lg w-full max-w-md mx-auto"
                >
                    {/* Avatar & Name */}
                    <div className="flex flex-col items-center mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                            <span className="text-3xl font-bold text-white">
                                {displayName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">{displayName}</h2>

                        {/* MiniPay ID */}
                        {username && (
                            <div className="bg-indigo-50 px-3 py-1 rounded-full mb-2">
                                <p className="text-indigo-600 font-semibold text-sm">@{username}</p>
                            </div>
                        )}

                        {/* Wallet Address */}
                        <button
                            onClick={copyAddress}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <span className="font-mono">{shortenAddress(address)}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>

                    {/* Balance Display */}
                    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-3 mb-4">
                        <p className="text-xs text-slate-600 mb-1">Total Balance</p>
                        <p className="text-2xl font-bold text-slate-900">
                            ${balanceNum.toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-600">≈ ₹{inrBalance}</p>
                    </div>

                    {/* QR Code Section */}
                    <div className="text-center mb-4">
                        <p className="text-xs text-slate-600 mb-3">Scan to Pay Me</p>
                        <div className="inline-block p-4 bg-white rounded-2xl shadow-md border-2 border-slate-100">
                            <QRCodeSVG
                                value={address}
                                size={120}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                            onClick={copyAddress}
                            className="bg-indigo-600 text-white py-2 px-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                        </button>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="bg-slate-800 text-white py-2 px-3 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Advanced
                        </button>
                    </div>

                    {/* Advanced Section - Token Details */}
                    {showAdvanced && tokenBalances && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="border-t border-slate-200 pt-4"
                        >
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">🔧 Advanced - Token Details</h3>

                            {/* Token List */}
                            <TokenList
                                balances={tokenBalances}
                                selectedToken="USDC"
                            />

                            {/* Bridge Button */}
                            <button
                                onClick={() => setShowBridgeModal(true)}
                                className="w-full mt-4 flex items-center justify-between p-3 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl text-white"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🌉</span>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold">Bridge to Other Chains</p>
                                        <p className="text-xs text-white/70">Ethereum, Base, Arbitrum</p>
                                    </div>
                                </div>
                                <span className="text-xs bg-amber-400 text-slate-900 px-2 py-1 rounded-full font-medium">
                                    Soon
                                </span>
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Bridge Modal */}
            {showBridgeModal && (
                <BridgeModal
                    onClose={() => setShowBridgeModal(false)}
                    usdcBalance={usdcBalance}
                />
            )}
        </div>
    )
}

