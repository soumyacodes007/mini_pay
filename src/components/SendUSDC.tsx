'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits, type Address } from 'viem'
import { USDC_CONTRACT_ADDRESS } from '@/lib/config'
import { ERC20_ABI } from '@/lib/abi'
import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'

interface SendUSDCProps {
    initialRecipient?: string
    initialAmount?: string
}

export function SendUSDC({ initialRecipient = '', initialAmount = '' }: SendUSDCProps) {
    const { address } = useAccount()
    const [recipient, setRecipient] = useState(initialRecipient)
    const [amount, setAmount] = useState(initialAmount)

    // Update when props change (from QR scan)
    useEffect(() => {
        if (initialRecipient) setRecipient(initialRecipient)
        if (initialAmount) setAmount(initialAmount)
    }, [initialRecipient, initialAmount])

    // Read USDC balance
    const { data: balance } = useReadContract({
        address: USDC_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    })

    // Write contract (send USDC)
    const { data: hash, writeContract, isPending } = useWriteContract()

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash
    })

    // Trigger confetti on success
    useEffect(() => {
        if (isSuccess) {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#8b5cf6', '#ec4899']
            })
        }
    }, [isSuccess])

    const handleSend = async () => {
        if (!recipient || !amount) return

        try {
            writeContract({
                address: USDC_CONTRACT_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [recipient as Address, parseUnits(amount, 6)], // USDC has 6 decimals
            }, {
                onSuccess: (txHash) => console.log('✅ Tx Sent:', txHash),
                onError: (err) => console.error('❌ WriteContract Error:', err)
            })
        } catch (error) {
            console.error('Transaction failed:', error)
        }
    }

    const formattedBalance = balance ? formatUnits(balance, 6) : '0'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-6 bg-white rounded-2xl shadow-xl"
        >
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Send USDC</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Balance: <span className="font-mono font-semibold text-lg text-blue-600">{formattedBalance} USDC</span>
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipient Address
                    </label>
                    <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors font-mono text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (USDC)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-lg"
                    />
                </div>

                <motion.button
                    onClick={handleSend}
                    disabled={isPending || isConfirming || !recipient || !amount}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {isPending || isConfirming ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            {isPending ? 'Confirm in wallet...' : 'Processing...'}
                        </span>
                    ) : (
                        '💸 Send Payment'
                    )}
                </motion.button>

                {isSuccess && hash && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-4 bg-green-50 border-2 border-green-200 rounded-xl"
                    >
                        <p className="text-green-800 font-semibold flex items-center gap-2">
                            <span>✅</span>
                            Payment Successful!
                        </p>
                        <a
                            href={`https://sepolia.basescan.org/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-1 block"
                        >
                            View on Explorer →
                        </a>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
