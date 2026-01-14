'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { TransactionHistory } from './TransactionHistory'

interface MainWalletProps {
    address: string
    username: string | null
    usdcBalance: string
    xlmBalance: string
    isAadhaarVerified: boolean
    onDisconnect: () => void
    onVerifyAadhaar: () => void
    onCreateTrustline: () => Promise<void>
    onSend: (recipient: string, amount: string) => void
    onScan: () => void
}

export function MainWallet({
    address,
    username,
    usdcBalance,
    xlmBalance,
    isAadhaarVerified,
    onDisconnect,
    onVerifyAadhaar,
    onCreateTrustline,
    onSend,
    onScan
}: MainWalletProps) {
    const [showSettings, setShowSettings] = useState(false)
    const [showSendModal, setShowSendModal] = useState(false)
    const [showReceiveModal, setShowReceiveModal] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [sendRecipient, setSendRecipient] = useState('')
    const [sendAmount, setSendAmount] = useState('')
    const [receiveAmount, setReceiveAmount] = useState('')

    const displayName = username ? `${username}@minipay` : address.slice(0, 8) + '...' + address.slice(-4)
    const balanceNum = parseFloat(usdcBalance)

    // Show transaction history
    if (showHistory) {
        return <TransactionHistory walletAddress={address} onBack={() => setShowHistory(false)} />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 relative">
            {/* Backdrop blur when settings open */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSettings(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between p-4 relative z-50">
                {/* Profile - Left */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg"
                >
                    <span className="text-white font-bold text-sm">
                        {username ? username[0].toUpperCase() : 'U'}
                    </span>
                </motion.button>

                {/* Settings - Right */}
                <div className="relative">
                    <motion.button
                        onClick={() => setShowSettings(!showSettings)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </motion.button>

                    {/* Settings Dropdown */}
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl overflow-hidden z-50"
                            >
                                {/* XLM Balance */}
                                <div className="p-4 border-b border-slate-100">
                                    <p className="text-xs text-slate-500">Network Balance</p>
                                    <p className="text-lg font-semibold text-slate-900">
                                        {parseFloat(xlmBalance).toFixed(2)} <span className="text-sm text-slate-500">XLM</span>
                                    </p>
                                </div>

                                {/* Verify Aadhaar */}
                                {!isAadhaarVerified && (
                                    <button
                                        onClick={() => { setShowSettings(false); onVerifyAadhaar(); }}
                                        className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-slate-900">Verify Aadhaar</p>
                                            <p className="text-xs text-slate-500">Enable wallet recovery</p>
                                        </div>
                                    </button>
                                )}

                                {/* Get Test USDC */}
                                <button
                                    onClick={async () => {
                                        setShowSettings(false)
                                        await onCreateTrustline()
                                        await navigator.clipboard.writeText(address)
                                        window.open('https://faucet.circle.com/', '_blank')
                                        alert('1. Select "Stellar" network\n2. Paste address (copied!)\n3. Click "Get tokens"')
                                    }}
                                    className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-t border-slate-100"
                                >
                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-slate-900">Get Test USDC</p>
                                        <p className="text-xs text-slate-500">For demo purposes</p>
                                    </div>
                                </button>

                                {/* Disconnect */}
                                <button
                                    onClick={() => { setShowSettings(false); onDisconnect(); }}
                                    className="w-full p-4 flex items-center gap-3 hover:bg-red-50 transition-colors border-t border-slate-100"
                                >
                                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-red-600">Disconnect</p>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 pb-32">
                {/* Balance Card - Glassmorphism */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 shadow-xl"
                >
                    {/* Glass overlay */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

                    {/* Card content */}
                    <div className="relative z-10">
                        {/* MiniPay ID */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                            <p className="text-white/80 text-sm font-medium">{displayName}</p>
                        </div>

                        {/* Balance */}
                        <div className="mb-2">
                            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Available Balance</p>
                            <p className="text-4xl font-bold text-white">
                                ${balanceNum.toFixed(2)}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-white/60 text-xs">USDC</p>
                                <p className="text-white/80 text-sm font-medium">≈ ₹{(balanceNum * 90.27).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/5 rounded-full" />
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-3 gap-3 mt-6"
                >
                    {/* Send */}
                    <button
                        onClick={() => setShowSendModal(true)}
                        className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-slate-900">Send</span>
                    </button>

                    {/* Get QR */}
                    <button
                        onClick={() => setShowReceiveModal(true)}
                        className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-slate-900">Get QR</span>
                    </button>

                    {/* History */}
                    <button
                        onClick={() => setShowHistory(true)}
                        className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-slate-900">History</span>
                    </button>
                </motion.div>

                {/* Quick Pay Section */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="mt-6"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-700">QUICK PAY</h3>
                        <button className="text-xs text-indigo-600 font-medium">View All</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                        {/* Mom */}
                        <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                            <div className="w-14 h-14 rounded-full border-2 border-indigo-500 p-0.5">
                                <img alt="Mom" className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNtuRBTg5g6c-8zOCaC_bN4_1QtlNfJwoko84EsmmTVQFFwX6DiVScbUV_njMisNtx1Bf_IeeaonnKfnI4MTyEk445vpvr2ap38aGzDeOETQrloylgpgbRft6r5NmSKHaOpwe59bHMp59K7dUtH7bew02bIazfxZnjb7uxz3uVvyuvaZyyJ-0S1tGgItNZUjOAHxkaY05MYBm9o9QDHLvIRCFec8yjxTYKomsWjs8sUKW9g9NdjDqMeZUSk1dUKj7-1LUjAq-NVqA" />
                            </div>
                            <span className="text-xs font-medium text-slate-600">Mom</span>
                        </div>
                        {/* Rahul */}
                        <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                            <div className="w-14 h-14 rounded-full border-2 border-transparent p-0.5">
                                <img alt="Rahul" className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCx0xVxSEl_uiZSXrJVe7_-uftznJ4yi9aMJGc6K2OAvgfmBa6FMMzwOLDJtusBjLu-d15WjocAI1HGpC8tdfcS5bCgaGlFCqgCiwuycM6Vp6OdxxHj0N_YKMMnhC4eT0C_15l5lItbUK_FzYo8hwzTUc8EupXyQkRsBik9HxLlProTEcHkqf5UlRgjKtYzILbB243P7PRc_Uo6Sba38ObebEYOOdxYwEK7xR_pzSJt-m9_MHRk6YxVYk0uRf2bxWiCQhZBYE5wYLk" />
                            </div>
                            <span className="text-xs font-medium text-slate-600">Rahul</span>
                        </div>
                        {/* Kirana Store */}
                        <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                            <div className="w-14 h-14 rounded-full border-2 border-transparent p-0.5">
                                <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">KS</div>
                            </div>
                            <span className="text-xs font-medium text-slate-600">Kirana</span>
                        </div>
                        {/* Anjali */}
                        <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                            <div className="w-14 h-14 rounded-full border-2 border-transparent p-0.5">
                                <img alt="Anjali" className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMqSYwiC_w5zX4VUB_xCtjZlJXexT70_zghErcSGuSPjUcTUhn7UEoHZHJnAClqsWk90wIDN8sBqUI1d6jmFekB_u_EbQ6kM-HN3Lg9pXgklGVIMyfZ8V-dETLtp0TDOHcVCW5oEMxy7JwoXY8o4VI7zGI4xQ-m_5RUoaJL47k8bMHE6tgitSk4Bn4-DdJt7BTq20PIqjns7d5Eqz0qiq_glTZqtQZAJclCw51OZSR0gGIX_QQi1ja_lc4K1RwoM6mSHdc76hE2Jk" />
                            </div>
                            <span className="text-xs font-medium text-slate-600">Anjali</span>
                        </div>
                        {/* Add New */}
                        <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                            <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 p-0.5 flex items-center justify-center">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <span className="text-xs font-medium text-slate-400">Add</span>
                        </div>
                    </div>
                </motion.div>

                {/* Cashback Banner - Premium */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 relative overflow-hidden rounded-2xl p-4 flex items-center gap-4"
                    style={{ background: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)' }}
                >
                    {/* Glow effect */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl" />

                    {/* Glassmorphism icon container */}
                    <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <div className="flex-1 relative z-10">
                        <p className="text-white font-bold text-lg">Win ₹50 Cashback</p>
                        <p className="text-white/80 text-sm">On your first scan of the day</p>
                    </div>

                    <div className="relative z-10 bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </motion.div>
            </div>

            {/* Floating Scan Button with Pulse Animation */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
                {/* Pulse rings */}
                <motion.div
                    animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute inset-0 bg-indigo-500 rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1.3], opacity: [0.3, 0, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                    className="absolute inset-0 bg-indigo-500 rounded-full"
                />
                <motion.button
                    onClick={onScan}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40"
                >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                </motion.button>
            </div>
            <p className="fixed bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-500 z-30">Scan to Pay</p>

            {/* Send Modal */}
            <AnimatePresence>
                {showSendModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50"
                        onClick={() => setShowSendModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-white rounded-t-3xl p-6"
                        >
                            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Send USDC</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-500 mb-1 block">Recipient</label>
                                    <input
                                        type="text"
                                        value={sendRecipient}
                                        onChange={(e) => setSendRecipient(e.target.value)}
                                        placeholder="name@minipay or wallet address"
                                        className="w-full px-4 py-3 bg-slate-100 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-500 mb-1 block">Amount</label>
                                    <input
                                        type="number"
                                        value={sendAmount}
                                        onChange={(e) => setSendAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 bg-slate-100 rounded-xl text-slate-900 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    onSend(sendRecipient, sendAmount)
                                    setShowSendModal(false)
                                    setSendRecipient('')
                                    setSendAmount('')
                                }}
                                disabled={!sendRecipient || !sendAmount}
                                className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Receive Modal */}
            <AnimatePresence>
                {showReceiveModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowReceiveModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm bg-white rounded-3xl p-6"
                        >
                            <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Receive Payment</h3>
                            <p className="text-sm text-slate-500 text-center mb-6">Enter amount to generate QR</p>

                            <div className="mb-6">
                                <input
                                    type="number"
                                    value={receiveAmount}
                                    onChange={(e) => setReceiveAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-4 py-4 bg-slate-100 rounded-xl text-slate-900 text-3xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="text-center text-slate-500 mt-2">USDC</p>
                            </div>

                            {receiveAmount && parseFloat(receiveAmount) > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center mb-6"
                                >
                                    <div className="p-4 bg-white rounded-2xl shadow-lg">
                                        <QRCodeSVG
                                            value={`stellar:${address}?amount=${receiveAmount}`}
                                            size={180}
                                            level="H"
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-4">{displayName}</p>
                                </motion.div>
                            )}

                            <button
                                onClick={() => setShowReceiveModal(false)}
                                className="w-full py-3 text-slate-500 font-medium"
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
