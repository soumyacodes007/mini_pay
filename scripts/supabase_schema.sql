-- Supabase Table Schema for MiniPay Encrypted Vaults
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS encrypted_vaults (
    aadhaar_hash VARCHAR(64) PRIMARY KEY,
    encrypted_vault TEXT NOT NULL,
    stellar_address VARCHAR(56) NOT NULL,
    username VARCHAR(50),
    minipay_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_encrypted_vaults_stellar_address ON encrypted_vaults(stellar_address);
CREATE INDEX IF NOT EXISTS idx_encrypted_vaults_minipay_id ON encrypted_vaults(minipay_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE encrypted_vaults ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts and selects (for demo)
-- In production, you'd want more restrictive policies
CREATE POLICY "Allow anonymous access" ON encrypted_vaults
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
