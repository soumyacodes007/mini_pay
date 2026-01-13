'use client'

import { AnonAadhaarProvider } from '@anon-aadhaar/react'
import { StellarProvider } from './StellarProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <StellarProvider>
                <AnonAadhaarProvider
                    _useTestAadhaar={true}
                >
                    {children}
                </AnonAadhaarProvider>
            </StellarProvider>
        </QueryClientProvider>
    )
}
