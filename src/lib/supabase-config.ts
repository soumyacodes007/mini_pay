'use client'

// Supabase client configuration for encrypted vault storage
import { createClient } from '@supabase/supabase-js'

// Environment configuration for Supabase
// URL extracted from postgresql connection string
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://flsdleksxbkgevvfvvqy.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsc2RsZWtzeGJrZ2V2dmZ2dnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODg5MTQsImV4cCI6MjA4NDA2NDkxNH0.c-UjuTy2OkLyBszMRAqyaWXJEKO0Jp6ygnxxd8FkAc8'

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Table name for encrypted vaults
export const VAULTS_TABLE = 'encrypted_vaults'

// Type definitions for vault storage
export interface EncryptedVault {
    aadhaar_hash: string         // SHA-256 of nullifier (primary key)
    encrypted_vault: string      // AES-256-GCM encrypted: IV.ciphertext
    stellar_address: string      // Stellar G... public key
    username?: string            // Optional display name
    minipay_id?: string          // MiniPay ID (e.g., "rahul")
    created_at?: string
    updated_at?: string
}

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
    return (
        SUPABASE_URL.includes('supabase.co') &&
        SUPABASE_ANON_KEY.length > 50 &&
        !SUPABASE_ANON_KEY.includes('placeholder')
    )
}
