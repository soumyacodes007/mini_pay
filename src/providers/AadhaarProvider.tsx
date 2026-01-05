'use client'

import { AnonAadhaarProvider } from '@anon-aadhaar/react'
import { type ReactNode } from 'react'

export function AadhaarProvider({ children }: { children: ReactNode }) {
    return (
        <AnonAadhaarProvider
            _useTestAadhaar={true} // Enable test mode for demo
            _artifactslinks={{
                zkey_url: "https://anon-aadhaar-artifacts.s3.eu-central-1.amazonaws.com/v2.0.0/circuit_final.zkey",
                vkey_url: "https://anon-aadhaar-artifacts.s3.eu-central-1.amazonaws.com/v2.0.0/vkey.json",
                wasm_url: "https://anon-aadhaar-artifacts.s3.eu-central-1.amazonaws.com/v2.0.0/aadhaar-verifier.wasm"
            }}
        >
            {children}
        </AnonAadhaarProvider>
    )
}
