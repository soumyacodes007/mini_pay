// Base Sepolia Chain Configuration
export const BASE_CONFIG = {
    chainId: 84532,
    chainName: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',

    // IdentityRegistry Contract
    identityRegistry: '0x180a9b92653819d8B0e724AF3320Ffbe4b4170e8',
}

// Contract ABI (only the functions we need)
export const IDENTITY_REGISTRY_ABI = [
    {
        "inputs": [
            { "name": "nullifierHash", "type": "bytes32" },
            { "name": "stellarAddress", "type": "string" },
            { "name": "username", "type": "string" }
        ],
        "name": "registerWallet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
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
        "inputs": [
            { "name": "nullifierHash", "type": "bytes32" },
            { "name": "newStellarAddress", "type": "string" }
        ],
        "name": "updateWallet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]
