'use client'

import { motion } from 'framer-motion'
import { SUPPORTED_TOKENS, TokenInfo } from '@/lib/stellar-config'
import { TokenBalances } from '@/providers/StellarProvider'

interface TokenListProps {
    balances: TokenBalances
    selectedToken?: string
    onSelectToken?: (symbol: string) => void
}

export function TokenList({ balances, selectedToken = 'USDC', onSelectToken }: TokenListProps) {
    const tokens = Object.entries(SUPPORTED_TOKENS).map(([symbol, info]) => ({
        ...info,
        balance: balances[symbol] || '0'
    }))

    // Sort to put selected token first, then by balance
    tokens.sort((a, b) => {
        if (a.symbol === selectedToken) return -1
        if (b.symbol === selectedToken) return 1
        return parseFloat(b.balance) - parseFloat(a.balance)
    })

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <span className="text-slate-500 text-sm font-medium">Your Assets</span>
                <span className="text-xs text-slate-400">{tokens.length} tokens</span>
            </div>

            {tokens.map((token, index) => {
                const balance = parseFloat(token.balance)
                const isSelected = token.symbol === selectedToken

                return (
                    <motion.button
                        key={token.symbol}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onSelectToken?.(token.symbol)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${isSelected
                                ? `bg-gradient-to-r ${token.color} text-white shadow-lg`
                                : 'bg-white/60 hover:bg-white/80 text-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`text-2xl ${isSelected ? '' : 'grayscale-[50%]'}`}>
                                {token.icon}
                            </span>
                            <div className="text-left">
                                <p className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                    {token.symbol}
                                </p>
                                <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                    {token.name}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className={`font-bold tabular-nums ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                {balance.toFixed(2)}
                            </p>
                            {balance > 0 && token.symbol !== 'XLM' && (
                                <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                    ${balance.toFixed(2)}
                                </p>
                            )}
                        </div>
                    </motion.button>
                )
            })}
        </div>
    )
}
