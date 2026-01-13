#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register(WalletFactory, ());
    let client = WalletFactoryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);

    // Mock auth
    env.mock_all_auths();

    client.initialize(&admin, &verifier);

    assert_eq!(client.wallet_count(), 0);
}

#[test]
fn test_register_wallet() {
    let env = Env::default();
    let contract_id = env.register(WalletFactory, ());
    let client = WalletFactoryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let wallet = Address::generate(&env);

    // Create a mock nullifier (32 bytes)
    let nullifier = BytesN::from_array(&env, &[1u8; 32]);

    env.mock_all_auths();

    client.initialize(&admin, &verifier);

    // Register wallet
    let result = client.register_wallet(&nullifier, &wallet);
    assert!(result);

    // Verify wallet count increased
    assert_eq!(client.wallet_count(), 1);

    // Verify we can get the wallet back
    let stored = client.get_wallet(&nullifier);
    assert_eq!(stored, Some(wallet));

    // Verify is_registered returns true
    assert!(client.is_registered(&nullifier));
}

#[test]
fn test_duplicate_nullifier_rejected() {
    let env = Env::default();
    let contract_id = env.register(WalletFactory, ());
    let client = WalletFactoryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let wallet1 = Address::generate(&env);
    let wallet2 = Address::generate(&env);

    let nullifier = BytesN::from_array(&env, &[2u8; 32]);

    env.mock_all_auths();

    client.initialize(&admin, &verifier);

    // First registration succeeds
    assert!(client.register_wallet(&nullifier, &wallet1));

    // Second registration with same nullifier fails
    assert!(!client.register_wallet(&nullifier, &wallet2));

    // Original wallet is preserved
    assert_eq!(client.get_wallet(&nullifier), Some(wallet1));
}

#[test]
fn test_update_wallet() {
    let env = Env::default();
    let contract_id = env.register(WalletFactory, ());
    let client = WalletFactoryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);
    let old_wallet = Address::generate(&env);
    let new_wallet = Address::generate(&env);

    let nullifier = BytesN::from_array(&env, &[3u8; 32]);

    env.mock_all_auths();

    client.initialize(&admin, &verifier);
    client.register_wallet(&nullifier, &old_wallet);

    // Update to new wallet
    let result = client.update_wallet(&nullifier, &old_wallet, &new_wallet);
    assert!(result);

    // Verify new wallet is stored
    assert_eq!(client.get_wallet(&nullifier), Some(new_wallet));
}

#[test]
fn test_nonexistent_nullifier() {
    let env = Env::default();
    let contract_id = env.register(WalletFactory, ());
    let client = WalletFactoryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);

    let nullifier = BytesN::from_array(&env, &[99u8; 32]);

    env.mock_all_auths();

    client.initialize(&admin, &verifier);

    // Query nonexistent nullifier
    assert_eq!(client.get_wallet(&nullifier), None);
    assert!(!client.is_registered(&nullifier));
}
