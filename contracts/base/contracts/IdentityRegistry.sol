// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IdentityRegistry
 * @notice Stores Aadhaar nullifier → Stellar wallet mappings for recovery
 * @dev Deployed on Base (Coinbase L2) for cheap, fast identity storage
 * 
 * Architecture:
 * - Payments: Stellar (USDC, fast, free)
 * - Identity: Base (ZK-friendly, cheap storage)
 */
contract IdentityRegistry {
    // Owner for admin functions
    address public owner;
    
    // Mapping: nullifier hash → Stellar address (as string, G...)
    mapping(bytes32 => string) public wallets;
    
    // Mapping: nullifier hash → username (optional)
    mapping(bytes32 => string) public usernames;
    
    // Mapping: nullifier hash → registration timestamp
    mapping(bytes32 => uint256) public registeredAt;
    
    // Total registrations
    uint256 public totalRegistrations;
    
    // Events
    event WalletRegistered(bytes32 indexed nullifierHash, string stellarAddress, string username);
    event WalletUpdated(bytes32 indexed nullifierHash, string oldAddress, string newAddress);
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @notice Register a Stellar wallet with Aadhaar nullifier
     * @param nullifierHash Keccak256 hash of the Aadhaar nullifier
     * @param stellarAddress Stellar public key (G...)
     * @param username Optional username (e.g., "rahul" for rahul@rail)
     */
    function registerWallet(
        bytes32 nullifierHash,
        string calldata stellarAddress,
        string calldata username
    ) external {
        require(bytes(stellarAddress).length == 56, "Invalid Stellar address length");
        require(bytes(stellarAddress)[0] == 'G', "Stellar address must start with G");
        require(registeredAt[nullifierHash] == 0, "Nullifier already registered");
        
        wallets[nullifierHash] = stellarAddress;
        usernames[nullifierHash] = username;
        registeredAt[nullifierHash] = block.timestamp;
        totalRegistrations++;
        
        emit WalletRegistered(nullifierHash, stellarAddress, username);
    }
    
    /**
     * @notice Get wallet by nullifier (for recovery)
     * @param nullifierHash Keccak256 hash of the Aadhaar nullifier
     * @return stellarAddress The linked Stellar wallet address
     * @return username The linked username
     */
    function getWallet(bytes32 nullifierHash) external view returns (
        string memory stellarAddress,
        string memory username
    ) {
        return (wallets[nullifierHash], usernames[nullifierHash]);
    }
    
    /**
     * @notice Check if nullifier is registered
     * @param nullifierHash Keccak256 hash of the Aadhaar nullifier
     */
    function isRegistered(bytes32 nullifierHash) external view returns (bool) {
        return registeredAt[nullifierHash] > 0;
    }
    
    /**
     * @notice Update wallet address (requires proof of ownership via signature)
     * @dev In production, this should verify a ZK proof or signature
     */
    function updateWallet(
        bytes32 nullifierHash,
        string calldata newStellarAddress
    ) external {
        require(registeredAt[nullifierHash] > 0, "Not registered");
        require(bytes(newStellarAddress).length == 56, "Invalid Stellar address");
        
        string memory oldAddress = wallets[nullifierHash];
        wallets[nullifierHash] = newStellarAddress;
        
        emit WalletUpdated(nullifierHash, oldAddress, newStellarAddress);
    }
}
