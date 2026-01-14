'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Horizon } from '@stellar/stellar-sdk'
import { getUsername } from '@/lib/username-registry'

interface Transaction {
    id: string
    type: 'sent' | 'received'
    amount: string
    counterparty: string
    timestamp: string
    status: 'success' | 'pending' | 'failed'
}

interface TransactionHistoryProps {
    walletAddress: string
    onBack: () => void
}

export function TransactionHistory({ walletAddress, onBack }: TransactionHistoryProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

    useEffect(() => {
        fetchTransactions()
    }, [walletAddress])

    const fetchTransactions = async () => {
        try {
            setLoading(true)
            setError(null)

            const server = new Horizon.Server('https://horizon-testnet.stellar.org')

            const payments = await server.payments()
                .forAccount(walletAddress)
                .limit(20)
                .order('desc')
                .call()

            const parsedTransactions: Transaction[] = []

            for (const payment of payments.records) {
                if (payment.type === 'payment' || payment.type === 'create_account') {
                    const isSent = payment.from === walletAddress

                    const isUSDC = payment.asset_type === 'credit_alphanum4' &&
                        payment.asset_code === 'USDC'
                    const isXLM = payment.asset_type === 'native'

                    if (isUSDC || (isXLM && payment.type === 'create_account')) {
                        parsedTransactions.push({
                            id: payment.id,
                            type: isSent ? 'sent' : 'received',
                            amount: payment.amount || '0',
                            counterparty: isSent ? payment.to : payment.from,
                            timestamp: payment.created_at,
                            status: 'success'
                        })
                    }
                }
            }

            setTransactions(parsedTransactions)
        } catch (err) {
            console.error('Failed to fetch transactions:', err)
            setError('Unable to load transaction history')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
        } else {
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            })
        }
    }

    const getDisplayName = (address: string) => {
        // Try to get username first
        const username = getUsername(address)
        if (username) {
            return `@${username}`
        }

        // Fallback to last 4 digits
        const last4 = address.slice(-4)
        return `User ${last4}`
    }

    const calculateTDS = (amount: number) => {
        // 1% TDS on transactions above ₹50,000
        const inrAmount = amount * 90.27
        if (inrAmount > 50000) {
            return (inrAmount * 0.01).toFixed(2)
        }
        return '0.00'
    }

    const calculateSavings = (amount: number) => {
        // Credit card fee is typically 2-3%, we charge 0%
        const inrAmount = amount * 90.27
        return (inrAmount * 0.025).toFixed(2)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="flex items-center gap-4 p-4">
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Transaction History</h1>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-slate-500">Loading transactions...</p>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-slate-700 font-medium mb-2">{error}</p>
                        <button
                            onClick={fetchTransactions}
                            className="text-indigo-600 font-medium text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && transactions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-slate-700 font-medium mb-1">No transactions yet</p>
                        <p className="text-slate-500 text-sm">Your payment history will appear here</p>
                    </div>
                )}

                {!loading && !error && transactions.length > 0 && (
                    <div className="space-y-3">
                        {transactions.map((tx, index) => (
                            <motion.button
                                key={tx.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedTx(tx)}
                                className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.type === 'sent'
                                        ? 'bg-red-100'
                                        : 'bg-green-100'
                                        }`}>
                                        {tx.type === 'sent' ? (
                                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l5 5m0 0l5-5m-5 5V6" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="font-semibold text-slate-900">
                                            {getDisplayName(tx.counterparty)}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {formatDate(tx.timestamp)}
                                        </p>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right">
                                        <p className={`font-bold text-lg ${tx.type === 'sent' ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                            {tx.type === 'sent' ? '-' : '+'}${parseFloat(tx.amount).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            ≈ ₹{(parseFloat(tx.amount) * 90.27).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>

            {/* Transaction Receipt Modal */}
            <AnimatePresence>
                {selectedTx && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 p-4"
                        onClick={() => setSelectedTx(null)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-white rounded-t-3xl overflow-visible relative"
                        >
                            {/* Ticket Cutout Circles */}
                            <div className="absolute left-0 top-[200px] w-6 h-6 bg-slate-50 rounded-full -translate-x-1/2 z-10" />
                            <div className="absolute right-0 top-[200px] w-6 h-6 bg-slate-50 rounded-full translate-x-1/2 z-10" />

                            {/* Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">Payment Receipt</h3>
                                    <button
                                        onClick={() => setSelectedTx(null)}
                                        className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedTx.type === 'sent' ? 'bg-red-500' : 'bg-green-500'
                                        }`}>
                                        {selectedTx.type === 'sent' ? (
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l5 5m0 0l5-5m-5 5V6" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm">
                                            {selectedTx.type === 'sent' ? 'Paid to' : 'Received from'}
                                        </p>
                                        <p className="text-xl font-bold">{getDisplayName(selectedTx.counterparty)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Receipt Details */}
                            <div className="p-6 space-y-4">
                                {/* Amount */}
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-sm text-slate-500 mb-1">Amount</p>
                                    <p className="text-3xl font-bold text-slate-900">
                                        ${parseFloat(selectedTx.amount).toFixed(2)}
                                    </p>
                                    <p className="text-slate-500 mt-1">
                                        ≈ ₹{(parseFloat(selectedTx.amount) * 90.27).toFixed(2)}
                                    </p>
                                </div>

                                {/* Premium Savings Badge */}
                                <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                    {/* Glow effects */}
                                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
                                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-300/20 rounded-full blur-xl" />

                                    <div className="relative flex items-center gap-4">
                                        {/* Glassmorphism icon */}
                                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-bold text-lg">You saved ₹{calculateSavings(parseFloat(selectedTx.amount))}</p>
                                            <p className="text-white/90 text-sm">vs Credit Card Fees</p>
                                        </div>
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Tax & Compliance */}
                                <div className="border border-slate-200 rounded-2xl p-4">
                                    <h4 className="font-semibold text-slate-900 mb-3">Tax & Compliance</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">1% TDS</span>
                                            <span className="font-medium">₹{calculateTDS(parseFloat(selectedTx.amount))}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600">Compliance Status</span>
                                            <span className="flex items-center gap-1 text-green-600 font-medium">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Reported
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Transaction Details */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Date & Time</span>
                                        <span className="text-slate-900">{formatDate(selectedTx.timestamp)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Status</span>
                                        <span className="text-green-600 font-medium">Completed</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Transaction ID</span>
                                        <span className="text-slate-900 font-mono text-xs">{selectedTx.id.slice(0, 8)}...</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
