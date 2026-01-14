/**
 * Initialize Soroban Contracts
 * Run this once after deploying contracts to set up admin and verifier
 */

import { 
    Keypair, 
    Contract, 
    TransactionBuilder, 
    Networks, 
    nativeToScVal,
    Address
} from '@stellar/stellar-sdk'
import { Server } from '@stellar/stellar-sdk/rpc'

const CONTRACTS = {
    walletFactory: 'CC4CG6Q4UPOHY6ATNOVEK7ZLY5YZL74FZVA4FCDMZY47UMJSMFLCPEG5',
    zkVerifier: 'CATK34GW5MOOUS4LKER6Y7M35YWQPHG2JBUVIHFLHS7NSUGW2OS57YG6',
}

const RPC_URL = 'https://soroban-testnet.stellar.org'

async function initializeContracts() {
    // You need to provide a funded admin keypair
    // Generate one at: https://laboratory.stellar.org/#account-creator?network=test
    const adminSecret = process.env.ADMIN_SECRET
    
    if (!adminSecret) {
        console.log('❌ Please set ADMIN_SECRET environment variable')
        console.log('   Generate a testnet account at: https://laboratory.stellar.org/#account-creator?network=test')
        console.log('')
        console.log('   Example:')
        console.log('   $env:ADMIN_SECRET="SXXXX..."; npx tsx scripts/initialize-contracts.ts')
        return
    }

    const adminKeypair = Keypair.fromSecret(adminSecret)
    const adminAddress = adminKeypair.publicKey()
    
    console.log('🔧 Initializing contracts...')
    console.log('   Admin:', adminAddress)
    console.log('')

    const server = new Server(RPC_URL)
    
    try {
        // Check if wallet factory is already initialized
        const walletFactory = new Contract(CONTRACTS.walletFactory)
        const account = await server.getAccount(adminAddress)
        
        // Try to call wallet_count to check if initialized
        const checkTx = new TransactionBuilder(account, {
            fee: '100000',
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(walletFactory.call('wallet_count'))
            .setTimeout(30)
            .build()
        
        const simResult = await server.simulateTransaction(checkTx)
        
        if ('result' in simResult && simResult.result) {
            console.log('✅ Wallet Factory already initialized!')
            console.log('   Contract:', CONTRACTS.walletFactory)
            return
        }
    } catch (e: any) {
        console.log('📝 Wallet Factory needs initialization...')
    }

    // Initialize wallet factory
    try {
        const walletFactory = new Contract(CONTRACTS.walletFactory)
        const account = await server.getAccount(adminAddress)
        
        const initTx = new TransactionBuilder(account, {
            fee: '100000',
            networkPassphrase: Networks.TESTNET
        })
            .addOperation(
                walletFactory.call(
                    'initialize',
                    new Address(adminAddress).toScVal(),
                    new Address(CONTRACTS.zkVerifier).toScVal()
                )
            )
            .setTimeout(30)
            .build()

        // Prepare transaction
        const preparedTx = await server.prepareTransaction(initTx)
        preparedTx.sign(adminKeypair)
        
        // Submit
        const result = await server.sendTransaction(preparedTx)
        console.log('📤 Submitted:', result.hash)
        
        // Wait for confirmation
        let status = await server.getTransaction(result.hash)
        while (status.status === 'NOT_FOUND') {
            await new Promise(r => setTimeout(r, 1000))
            status = await server.getTransaction(result.hash)
        }
        
        if (status.status === 'SUCCESS') {
            console.log('✅ Wallet Factory initialized!')
        } else {
            console.log('❌ Initialization failed:', status.status)
        }
    } catch (e: any) {
        if (e.message?.includes('already initialized')) {
            console.log('✅ Wallet Factory already initialized!')
        } else {
            console.log('❌ Error:', e.message)
        }
    }
}

initializeContracts().catch(console.error)
