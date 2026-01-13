#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, vec, Address, BytesN, Env};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register(ZkVerifier, ());
    let client = ZkVerifierClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);

    assert_eq!(client.proof_count(), 0);
    assert!(!client.is_initialized());
}

#[test]
fn test_set_verification_key() {
    let env = Env::default();
    let contract_id = env.register(ZkVerifier, ());
    let client = ZkVerifierClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);

    let vk_alpha = BytesN::from_array(&env, &[1u8; 64]);
    let vk_beta = BytesN::from_array(&env, &[2u8; 128]);
    let vk_gamma = BytesN::from_array(&env, &[3u8; 128]);
    let vk_delta = BytesN::from_array(&env, &[4u8; 128]);
    
    let ic0 = BytesN::from_array(&env, &[5u8; 64]);
    let ic1 = BytesN::from_array(&env, &[6u8; 64]);
    let vk_ic = vec![&env, ic0, ic1];

    client.set_verification_key(&vk_alpha, &vk_beta, &vk_gamma, &vk_delta, &vk_ic);

    assert!(client.is_initialized());
}

#[test]
fn test_verify_and_store() {
    let env = Env::default();
    let contract_id = env.register(ZkVerifier, ());
    let client = ZkVerifierClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let caller = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);

    // Set VK with 2 IC points (1 public input)
    let vk_alpha = BytesN::from_array(&env, &[1u8; 64]);
    let vk_beta = BytesN::from_array(&env, &[2u8; 128]);
    let vk_gamma = BytesN::from_array(&env, &[3u8; 128]);
    let vk_delta = BytesN::from_array(&env, &[4u8; 128]);
    
    let ic0 = BytesN::from_array(&env, &[5u8; 64]);
    let ic1 = BytesN::from_array(&env, &[6u8; 64]);
    let vk_ic = vec![&env, ic0, ic1];

    client.set_verification_key(&vk_alpha, &vk_beta, &vk_gamma, &vk_delta, &vk_ic);

    // Create valid proof (non-zero)
    let proof = Groth16Proof {
        a: BytesN::from_array(&env, &[10u8; 64]),
        b: BytesN::from_array(&env, &[20u8; 128]),
        c: BytesN::from_array(&env, &[30u8; 64]),
    };

    // Create nullifier as public input
    let nullifier = BytesN::from_array(&env, &[42u8; 32]);
    let public_inputs = vec![&env, nullifier.clone()];

    // Verify
    let result = client.verify_and_store(&proof, &public_inputs, &caller);
    assert!(result);

    // Check nullifier is now verified
    assert!(client.is_nullifier_verified(&nullifier));
    assert_eq!(client.proof_count(), 1);
}

#[test]
fn test_replay_prevention() {
    let env = Env::default();
    let contract_id = env.register(ZkVerifier, ());
    let client = ZkVerifierClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let caller = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);

    // Set VK
    let vk_alpha = BytesN::from_array(&env, &[1u8; 64]);
    let vk_beta = BytesN::from_array(&env, &[2u8; 128]);
    let vk_gamma = BytesN::from_array(&env, &[3u8; 128]);
    let vk_delta = BytesN::from_array(&env, &[4u8; 128]);
    let ic0 = BytesN::from_array(&env, &[5u8; 64]);
    let ic1 = BytesN::from_array(&env, &[6u8; 64]);
    client.set_verification_key(&vk_alpha, &vk_beta, &vk_gamma, &vk_delta, &vec![&env, ic0, ic1]);

    let proof = Groth16Proof {
        a: BytesN::from_array(&env, &[10u8; 64]),
        b: BytesN::from_array(&env, &[20u8; 128]),
        c: BytesN::from_array(&env, &[30u8; 64]),
    };

    let nullifier = BytesN::from_array(&env, &[99u8; 32]);
    let public_inputs = vec![&env, nullifier.clone()];

    // First verification succeeds
    assert!(client.verify_and_store(&proof, &public_inputs, &caller));

    // Second verification with same nullifier fails (replay prevention)
    assert!(!client.verify_and_store(&proof, &public_inputs, &caller));

    // Proof count still 1
    assert_eq!(client.proof_count(), 1);
}

#[test]
fn test_zero_proof_rejected() {
    let env = Env::default();
    let contract_id = env.register(ZkVerifier, ());
    let client = ZkVerifierClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let caller = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);

    // Set VK
    let vk_alpha = BytesN::from_array(&env, &[1u8; 64]);
    let vk_beta = BytesN::from_array(&env, &[2u8; 128]);
    let vk_gamma = BytesN::from_array(&env, &[3u8; 128]);
    let vk_delta = BytesN::from_array(&env, &[4u8; 128]);
    let ic0 = BytesN::from_array(&env, &[5u8; 64]);
    let ic1 = BytesN::from_array(&env, &[6u8; 64]);
    client.set_verification_key(&vk_alpha, &vk_beta, &vk_gamma, &vk_delta, &vec![&env, ic0, ic1]);

    // Zero proof (invalid)
    let proof = Groth16Proof {
        a: BytesN::from_array(&env, &[0u8; 64]),
        b: BytesN::from_array(&env, &[0u8; 128]),
        c: BytesN::from_array(&env, &[0u8; 64]),
    };

    let nullifier = BytesN::from_array(&env, &[1u8; 32]);
    let public_inputs = vec![&env, nullifier];

    // Should be rejected
    assert!(!client.verify_and_store(&proof, &public_inputs, &caller));
}
