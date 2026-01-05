import { createPublicClient, http, formatUnits, parseAbi } from 'viem'
import { baseSepolia } from 'viem/chains'

// USDC Contract on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
const ERC20_ABI = parseAbi([
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
])

async function main() {
    // 1. Setup Client
    const client = createPublicClient({
        chain: baseSepolia,
        transport: http()
    })

    console.log('🔍 Checking Blockchain Connectivity...')

    try {
        // 2. Check Chain Connection
        const blockNumber = await client.getBlockNumber()
        console.log(`✅ Connected to Base Sepolia (Block: ${blockNumber})`)

        // 3. User Wallet Address (Replace with the one from your screenshot/app)
        const userAddress = process.argv[2] as `0x${string}`

        if (!userAddress) {
            console.log('\n⚠️  No address provided. Run with: npx tsx scripts/verify-blockchain.ts <YOUR_ADDRESS>')
            return
        }

        // 4. Check ETH Balance (Gas)
        const ethBalance = await client.getBalance({ address: userAddress })
        console.log(`\n👛 Wallet: ${userAddress}`)
        console.log(`🔹 ETH Balance: ${formatUnits(ethBalance, 18)} ETH`)

        // 5. Check USDC Balance
        const usdcBalance = await client.readContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [userAddress]
        })

        // USDC has 6 decimals
        const formattedUSDC = formatUnits(usdcBalance, 6)
        console.log(`🔹 USDC Balance: ${formattedUSDC} USDC`)

        // 6. Diagnostics
        if (Number(formattedUSDC) === 0) {
            console.log('\n❌ You have 0 USDC. You need USDC to test payments.')
            console.log('👉 Action: Swap your Sepolia ETH for USDC on Uniswap (Base Sepolia network)')
        } else {
            console.log('\n✅ You have USDC! You are ready to test payments.')
        }

    } catch (error) {
        console.error('❌ Error connecting to blockchain:', error)
    }
}

main()
