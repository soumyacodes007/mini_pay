#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol};

/// Wallet Factory Contract
/// Stores nullifier → wallet address mappings for Aadhaar-based recovery
/// Each Aadhaar identity (nullifier) can only have ONE wallet address

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    // Maps nullifier hash to wallet address
    Nullifier(BytesN<32>),
    // Admin address for contract management
    Admin,
    // ZK Verifier contract address
    Verifier,
    // Total registered wallets count
    WalletCount,
}

#[contract]
pub struct WalletFactory;

#[contractimpl]
impl WalletFactory {
    /// Initialize the contract with admin and verifier addresses
    pub fn initialize(env: Env, admin: Address, verifier: Address) {
        // Can only initialize once
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        
        admin.require_auth();
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().instance().set(&DataKey::WalletCount, &0u32);
    }

    /// Register a wallet with a verified Aadhaar nullifier
    /// Called after ZK proof verification succeeds
    pub fn register_wallet(
        env: Env,
        nullifier: BytesN<32>,
        wallet_address: Address,
    ) -> bool {
        // Caller must authenticate
        wallet_address.require_auth();

        // Check if nullifier is already registered
        let key = DataKey::Nullifier(nullifier.clone());
        if env.storage().persistent().has(&key) {
            // Nullifier already used - reject duplicate registration
            return false;
        }

        // Store the mapping
        env.storage().persistent().set(&key, &wallet_address);
        
        // TTL: Keep for ~1 year (assuming ~5 second ledgers)
        env.storage().persistent().extend_ttl(&key, 6_000_000, 6_000_000);

        // Increment wallet count
        let count: u32 = env.storage().instance().get(&DataKey::WalletCount).unwrap_or(0);
        env.storage().instance().set(&DataKey::WalletCount, &(count + 1));

        // Emit event for indexing
        env.events().publish(
            (Symbol::new(&env, "register"),),
            (nullifier.clone(), wallet_address.clone()),
        );

        true
    }

    /// Get wallet address by nullifier (for recovery)
    pub fn get_wallet(env: Env, nullifier: BytesN<32>) -> Option<Address> {
        let key = DataKey::Nullifier(nullifier);
        env.storage().persistent().get(&key)
    }

    /// Check if a nullifier is already registered
    pub fn is_registered(env: Env, nullifier: BytesN<32>) -> bool {
        let key = DataKey::Nullifier(nullifier);
        env.storage().persistent().has(&key)
    }

    /// Get total number of registered wallets
    pub fn wallet_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::WalletCount).unwrap_or(0)
    }

    /// Update wallet address (requires auth from OLD wallet)
    /// Used for wallet migration/upgrade
    pub fn update_wallet(
        env: Env,
        nullifier: BytesN<32>,
        old_wallet: Address,
        new_wallet: Address,
    ) -> bool {
        // Old wallet must authenticate
        old_wallet.require_auth();

        let key = DataKey::Nullifier(nullifier.clone());
        
        // Verify old wallet matches stored address
        let stored: Option<Address> = env.storage().persistent().get(&key);
        match stored {
            Some(addr) if addr == old_wallet => {
                // Update to new wallet
                env.storage().persistent().set(&key, &new_wallet);
                
                // Emit event
                env.events().publish(
                    (Symbol::new(&env, "update"),),
                    (nullifier, old_wallet, new_wallet),
                );
                
                true
            }
            _ => false,
        }
    }
}

mod test;
