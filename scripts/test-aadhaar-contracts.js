// Test script to verify deployed contracts work with real Aadhaar proof
import { Contract, SorobanRpc, Keypair, TransactionBuilder, Networks, BASE_FEE, xdr } from '@stellar/stellar-sdk';

// Deployed contract addresses
const WALLET_FACTORY = 'CC4CG6Q4UPOHY6ATNOVEK7ZLY5YZL74FZVA4FCDMZY47UMJSMFLCPEG5';
const ZK_VERIFIER = 'CATK34GW5MOOUS4LKER6Y7M35YWQPHG2JBUVIHFLHS7NSUGW2OS57YG6';

const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org');

async function testAadhaarFlow() {
    console.log('🧪 Testing Aadhaar Verification Flow\n');

    // Step 1: Get Aadhaar proof from user
    console.log('📱 Step 1: Generate Aadhaar proof');
    console.log('   → Open app and scan Aadhaar');
    console.log('   → Copy the proof data (nullifier, proof components)\n');

    // For testing, we'll use mock data that matches the structure
    const mockNullifier = Buffer.from('a'.repeat(64), 'hex'); // 32 bytes
    const mockProof = {
        a: Buffer.from('1'.repeat(128), 'hex'),   // 64 bytes
        b: Buffer.from('2'.repeat(256), 'hex'),   // 128 bytes
        c: Buffer.from('3'.repeat(128), 'hex'),   // 64 bytes
    };
    const mockPublicInputs = [mockNullifier];

    console.log('📋 Mock Proof Data:');
    console.log('   Nullifier:', mockNullifier.toString('hex').slice(0, 16) + '...');
    console.log('   Proof A:', mockProof.a.toString('hex').slice(0, 16) + '...\n');

    // Step 2: Initialize contracts (admin only, one-time)
    console.log('🔧 Step 2: Initialize contracts (if needed)');
    console.log('   → This would be done once by deployer\n');

    // Step 3: Test ZK Verifier
    console.log('✅ Step 3: Test ZK Verifier');
    console.log('   → Call verify_and_store(proof, inputs, caller)');
    console.log('   → Contract validates proof structure');
    console.log('   → Contract stores nullifier\n');

    // Step 4: Test Wallet Factory
    console.log('💾 Step 4: Test Wallet Factory');
    console.log('   → Call register_wallet(nullifier, wallet_address)');
    console.log('   → Contract stores mapping\n');

    // Step 5: Test Recovery
    console.log('🔄 Step 5: Test Recovery');
    console.log('   → Call get_wallet(nullifier)');
    console.log('   → Contract returns wallet address\n');

    console.log('📝 Next Steps:');
    console.log('1. Run this with REAL Aadhaar proof from the app');
    console.log('2. Replace mock data with actual proof components');
    console.log('3. Test on testnet with deployer key');
    console.log('4. Verify all functions work end-to-end');
}

// Instructions for getting real proof
console.log('═══════════════════════════════════════════════════════');
console.log('📱 HOW TO GET REAL AADHAAR PROOF FOR TESTING');
console.log('═══════════════════════════════════════════════════════\n');

console.log('1. Open your app (http://localhost:3000 or ngrok URL)');
console.log('2. Click "Verify with Aadhaar"');
console.log('3. Complete Aadhaar verification');
console.log('4. Open browser console (F12)');
console.log('5. Look for proof data in console logs');
console.log('6. Copy the following:');
console.log('   - nullifier (32 bytes hex)');
console.log('   - proof.a (64 bytes hex)');
console.log('   - proof.b (128 bytes hex)');
console.log('   - proof.c (64 bytes hex)');
console.log('   - publicSignals array\n');

console.log('7. Paste into this script and run:\n');
console.log('   node scripts/test-aadhaar-contracts.js\n');

testAadhaarFlow();
