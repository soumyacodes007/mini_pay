// Quick test: Query Base Sepolia contract directly
const { ethers } = require('ethers')

const BASE_CONFIG = {
    rpcUrl: 'https://sepolia.base.org',
    identityRegistry: '0x180a9b92653819d8B0e724AF3320Ffbe4b4170e8',
}

const ABI = [
    {
        "inputs": [{ "name": "nullifierHash", "type": "bytes32" }],
        "name": "getWallet",
        "outputs": [
            { "name": "stellarAddress", "type": "string" },
            { "name": "username", "type": "string" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "nullifierHash", "type": "bytes32" }],
        "name": "isRegistered",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalRegistrations",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
]

async function main() {
    console.log('🔍 Querying Base Sepolia IdentityRegistry...\n')

    const provider = new ethers.JsonRpcProvider(BASE_CONFIG.rpcUrl)
    const contract = new ethers.Contract(BASE_CONFIG.identityRegistry, ABI, provider)

    // Check total registrations
    const total = await contract.totalRegistrations()
    console.log(`📊 Total registrations: ${total}\n`)

    // If you have a specific nullifier, test it here:
    // Replace with your actual nullifier from the console logs
    const testNullifier = process.argv[2]

    if (testNullifier) {
        console.log(`🔐 Testing nullifier: ${testNullifier.slice(0, 30)}...\n`)

        const nullifierHash = ethers.keccak256(ethers.toUtf8Bytes(testNullifier))
        console.log(`📝 Nullifier Hash: ${nullifierHash}\n`)

        const isRegistered = await contract.isRegistered(nullifierHash)
        console.log(`✅ Is Registered: ${isRegistered}\n`)

        if (isRegistered) {
            const [stellarAddress, username] = await contract.getWallet(nullifierHash)
            console.log(`🏦 Stellar Address: ${stellarAddress}`)
            console.log(`👤 Username: ${username || '(none)'}`)
            console.log('\n🎉 RECOVERY WOULD WORK!')
        } else {
            console.log('❌ Nullifier not found in registry')
        }
    } else {
        console.log('💡 To test a specific nullifier, run:')
        console.log('   node scripts/test-base-recovery.js "YOUR_NULLIFIER_HERE"')
        console.log('\n📋 Get nullifier from browser console after Aadhaar verification')
    }
}

main().catch(console.error)
