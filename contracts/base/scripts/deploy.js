const hre = require("hardhat");

async function main() {
    console.log("Deploying IdentityRegistry to Base Sepolia...");

    // Private key (temporary - remove after deployment!)
    const privateKey = "7d45d0e9ab3e11c876820f440ebd06e9bf28d4d8eb527324a4e07254c94d73b0";

    const provider = new hre.ethers.JsonRpcProvider("https://sepolia.base.org");
    const wallet = new hre.ethers.Wallet(privateKey, provider);

    console.log("Deploying with account:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

    if (balance === 0n) {
        throw new Error("No ETH balance! Get testnet ETH from https://www.alchemy.com/faucets/base-sepolia");
    }

    const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry", wallet);
    const registry = await IdentityRegistry.deploy();

    console.log("Waiting for deployment...");
    await registry.waitForDeployment();

    const address = await registry.getAddress();
    console.log(`\n✅ IdentityRegistry deployed to: ${address}`);
    console.log(`📝 Save this address for frontend integration!`);
    console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/address/${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
