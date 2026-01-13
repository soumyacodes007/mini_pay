// Script to setup USDC trustline for a Stellar testnet wallet
const { Horizon, Keypair, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } = require('@stellar/stellar-sdk');

const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC = new Asset('USDC', USDC_ISSUER);

async function setupTrustline(secretKey) {
    const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
    const keypair = Keypair.fromSecret(secretKey);
    const publicKey = keypair.publicKey();

    console.log('Setting up USDC trustline for:', publicKey);

    // Load account
    const account = await horizon.loadAccount(publicKey);

    // Check if trustline already exists
    const hasTrustline = account.balances.some(
        b => b.asset_type === 'credit_alphanum4' &&
            b.asset_code === 'USDC' &&
            b.asset_issuer === USDC_ISSUER
    );

    if (hasTrustline) {
        console.log('Trustline already exists!');
        return;
    }

    // Build transaction to add trustline
    const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET
    })
        .addOperation(Operation.changeTrust({
            asset: USDC,
            limit: '1000000' // 1 million USDC limit
        }))
        .setTimeout(30)
        .build();

    // Sign
    transaction.sign(keypair);

    // Submit
    try {
        const result = await horizon.submitTransaction(transaction);
        console.log('Trustline created successfully!');
        console.log('Transaction hash:', result.hash);
    } catch (err) {
        console.error('Error:', err.response?.data?.extras?.result_codes || err.message);
    }
}

// Get secret key from command line
const secretKey = process.argv[2];
if (!secretKey) {
    console.log('Usage: node setup-usdc-trustline.js <SECRET_KEY>');
    console.log('');
    console.log('To get your secret key, check localStorage in browser console:');
    console.log('  JSON.parse(localStorage.getItem("invisiblerail_wallet")).secret');
    process.exit(1);
}

setupTrustline(secretKey);
