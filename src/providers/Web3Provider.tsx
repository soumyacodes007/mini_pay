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
                    _artifactslinks={{
                        zkey_url: "https://d3dxq5smiosdl4.cloudfront.net/aadhaar-verifier.zkey",
                        wasm_url: "https://d3dxq5smiosdl4.cloudfront.net/aadhaar-verifier.wasm",
                        vkey_url: "https://d3dxq5smiosdl4.cloudfront.net/vkey.json"
                    }}
                >
                    {children}
                </AnonAadhaarProvider>
            </StellarProvider>
        </QueryClientProvider>
    )
}
