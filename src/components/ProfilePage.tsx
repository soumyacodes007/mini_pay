'use client'

import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

interface ProfilePageProps {
    address: string
    username: string | null
    usdcBalance: string
    xlmBalance: string
    onBack: () => void
}

export function ProfilePage({ address, username, usdcBalance, xlmBalance, onBack }: ProfilePageProps) {
    const displayName = username || 'User'
    const balanceNum = parseFloat(usdcBalance)
    const inrBalance = (balanceNum * 90.27).toFixed(2)

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

            {/* Content - Single scrollable card */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-lg w-full max-w-md"
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
                                size={160}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            {username ? `@${username}` : shortenAddress(address)}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
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
                            onClick={() => {
                                const canvas = document.querySelector('canvas')
                                if (canvas) {
                                    const url = canvas.toDataURL()
                                    const link = document.createElement('a')
                                    link.download = `${username || 'wallet'}-qr.png`
                                    link.href = url
                                    link.click()
                                }
                            }}
                            className="bg-white border-2 border-slate-200 text-slate-700 py-2 px-3 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
