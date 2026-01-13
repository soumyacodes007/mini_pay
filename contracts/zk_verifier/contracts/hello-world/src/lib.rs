#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol, Vec};

/// ZK Verifier Contract for Invisible Rail
/// 
/// This contract stores and validates Aadhaar ZK proofs on-chain.
/// 
/// Current implementation: Stores proofs and validates structure
/// Future: Will use X-Ray BN254 host functions for full Groth16 verification
/// when SDK wrappers are available.

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    // Verification Key components
    VkAlpha,
    VkBeta,
    VkGamma,
    VkDelta,
    VkIc,
    // Stats
    ProofCount,
    // Verified nullifiers (nullifier -> proof hash)
    VerifiedNullifier(BytesN<32>),
}

/// Groth16 proof structure
#[derive(Clone)]
#[contracttype]
pub struct Groth16Proof {
    pub a: BytesN<64>,    // G1 point
    pub b: BytesN<128>,   // G2 point  
    pub c: BytesN<64>,    // G1 point
}

#[contract]
pub struct ZkVerifier;

#[contractimpl]
impl ZkVerifier {
    /// Initialize contract with admin
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ProofCount, &0u64);
    }

    /// Set the Groth16 verification key (admin only)
    pub fn set_verification_key(
        env: Env,
        vk_alpha: BytesN<64>,
        vk_beta: BytesN<128>,
        vk_gamma: BytesN<128>,
        vk_delta: BytesN<128>,
        vk_ic: Vec<BytesN<64>>,
    ) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.storage().instance().set(&DataKey::VkAlpha, &vk_alpha);
        env.storage().instance().set(&DataKey::VkBeta, &vk_beta);
        env.storage().instance().set(&DataKey::VkGamma, &vk_gamma);
        env.storage().instance().set(&DataKey::VkDelta, &vk_delta);
        env.storage().instance().set(&DataKey::VkIc, &vk_ic);

        env.events().publish((Symbol::new(&env, "vk_set"),), vk_ic.len());
    }

    /// Verify and store a proof
    /// 
    /// This version performs structural validation and stores the proof.
    /// The nullifier from public_inputs[0] is recorded as verified.
    /// 
    /// Full BN254 pairing verification will be added when Protocol 25
    /// SDK wrappers are available.
    pub fn verify_and_store(
        env: Env,
        proof: Groth16Proof,
        public_inputs: Vec<BytesN<32>>,
        caller: Address,
    ) -> bool {
        caller.require_auth();

        // Validate VK is set
        if !env.storage().instance().has(&DataKey::VkAlpha) {
            return false;
        }

        // Validate inputs match VK
        let vk_ic: Vec<BytesN<64>> = env.storage().instance().get(&DataKey::VkIc).unwrap();
        if public_inputs.len() + 1 != vk_ic.len() {
            return false;
        }

        // Structural validation - proof points must not be zero
        if Self::is_zero_point(&proof.a) || Self::is_zero_point(&proof.c) {
            return false;
        }

        // Extract nullifier from first public input
        let nullifier: BytesN<32> = public_inputs.get(0).unwrap();

        // Check nullifier not already verified (prevents replay)
        let nullifier_key = DataKey::VerifiedNullifier(nullifier.clone());
        if env.storage().persistent().has(&nullifier_key) {
            return false; // Already verified
        }

        // Compute proof hash for storage
        let proof_hash = env.crypto().sha256(&Self::proof_to_bytes(&env, &proof));

        // Store verified nullifier with proof hash
        env.storage().persistent().set(&nullifier_key, &proof_hash);
        env.storage().persistent().extend_ttl(&nullifier_key, 6_000_000, 6_000_000);

        // Increment proof count
        let count: u64 = env.storage().instance().get(&DataKey::ProofCount).unwrap_or(0);
        env.storage().instance().set(&DataKey::ProofCount, &(count + 1));

        // Emit verification event
        env.events().publish(
            (Symbol::new(&env, "verified"),),
            (nullifier.clone(), caller.clone(), count + 1),
        );

        true
    }

    /// Check if a nullifier has been verified
    pub fn is_nullifier_verified(env: Env, nullifier: BytesN<32>) -> bool {
        let key = DataKey::VerifiedNullifier(nullifier);
        env.storage().persistent().has(&key)
    }

    /// Get proof count
    pub fn proof_count(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::ProofCount).unwrap_or(0)
    }

    /// Check if VK is set
    pub fn is_initialized(env: Env) -> bool {
        env.storage().instance().has(&DataKey::VkAlpha)
    }

    // Helper: Check if a G1 point is all zeros
    fn is_zero_point(point: &BytesN<64>) -> bool {
        point.to_array().iter().all(|&b| b == 0)
    }

    // Helper: Convert proof to bytes for hashing
    fn proof_to_bytes(env: &Env, proof: &Groth16Proof) -> soroban_sdk::Bytes {
        let mut bytes = soroban_sdk::Bytes::new(env);
        for b in proof.a.to_array() {
            bytes.push_back(b);
        }
        for b in proof.b.to_array() {
            bytes.push_back(b);
        }
        for b in proof.c.to_array() {
            bytes.push_back(b);
        }
        bytes
    }
}

mod test;
