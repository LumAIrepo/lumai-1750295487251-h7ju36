import React from "react"
```typescript
import { Connection, PublicKey, Transaction, SendOptions, Commitment, ConfirmOptions } from '@solana/web3.js'
import { WalletAdapter } from '@solana/wallet-adapter-base'

export interface SolanaConfig {
  rpcUrl: string
  commitment: Commitment
  confirmTransactionInitialTimeout?: number
  wsEndpoint?: string
}

export interface TransactionResult {
  signature: string
  confirmed: boolean
  error?: string
}

export interface ConnectionStatus {
  connected: boolean
  rpcUrl: string
  slot: number
  blockHeight: number
  version: string
}

export class SolanaConnectionManager {
  private connection: Connection
  private config: SolanaConfig

  constructor(config: SolanaConfig) {
    this.config = config
    this.connection = new Connection(config.rpcUrl, {
      commitment: config.commitment,
      wsEndpoint: config.wsEndpoint,
      confirmTransactionInitialTimeout: config.confirmTransactionInitialTimeout || 60000,
    })
  }

  getConnection(): Connection {
    return this.connection
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      const [slot, blockHeight, version] = await Promise.all([
        this.connection.getSlot(),
        this.connection.getBlockHeight(),
        this.connection.getVersion(),
      ])

      return {
        connected: true,
        rpcUrl: this.config.rpcUrl,
        slot,
        blockHeight,
        version: version['solana-core'],
      }
    } catch (error) {
      return {
        connected: false,
        rpcUrl: this.config.rpcUrl,
        slot: 0,
        blockHeight: 0,
        version: 'unknown',
      }
    }
  }

  async switchRpc(newRpcUrl: string): Promise<void> {
    this.config.rpcUrl = newRpcUrl
    this.connection = new Connection(newRpcUrl, {
      commitment: this.config.commitment,
      wsEndpoint: this.config.wsEndpoint,
      confirmTransactionInitialTimeout: this.config.confirmTransactionInitialTimeout || 60000,
    })
  }
}

export const DEFAULT_SOLANA_CONFIG: SolanaConfig = {
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
}

export const DEVNET_CONFIG: SolanaConfig = {
  rpcUrl: 'https://api.devnet.solana.com',
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
}

export const MAINNET_CONFIG: SolanaConfig = {
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
}

export function createSolanaConnection(config: SolanaConfig = DEFAULT_SOLANA_CONFIG): Connection {
  return new Connection(config.rpcUrl, {
    commitment: config.commitment,
    wsEndpoint: config.wsEndpoint,
    confirmTransactionInitialTimeout: config.confirmTransactionInitialTimeout || 60000,
  })
}

export async function sendAndConfirmTransaction(
  connection: Connection,
  transaction: Transaction,
  wallet: WalletAdapter,
  options?: SendOptions & ConfirmOptions
): Promise<TransactionResult> {
  try {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected')
    }

    if (!wallet.signTransaction) {
      throw new Error('Wallet does not support transaction signing')
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = wallet.publicKey

    const signedTransaction = await wallet.signTransaction(transaction)
    
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: options?.skipPreflight || false,
      preflightCommitment: options?.preflightCommitment || 'processed',
      maxRetries: options?.maxRetries || 3,
    })

    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, options?.commitment || 'confirmed')

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`)
    }

    return {
      signature,
      confirmed: true,
    }
  } catch (error) {
    return {
      signature: '',
      confirmed: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function getAccountBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  try {
    const balance = await connection.getBalance(publicKey)
    return balance / 1e9 // Convert lamports to SOL
  } catch (error) {
    console.error('Error fetching account balance:', error)
    return 0
  }
}

export async function getTokenAccountBalance(
  connection: Connection,
  tokenAccountAddress: PublicKey
): Promise<number> {
  try {
    const tokenAccount = await connection.getTokenAccountBalance(tokenAccountAddress)
    return parseFloat(tokenAccount.value.amount) / Math.pow(10, tokenAccount.value.decimals)
  } catch (error) {
    console.error('Error fetching token account balance:', error)
    return 0
  }
}

export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!isValidPublicKey(address)) {
    return address
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export async function airdropSol(
  connection: Connection,
  publicKey: PublicKey,
  amount: number
): Promise<string> {
  try {
    const signature = await connection.requestAirdrop(publicKey, amount * 1e9)
    await connection.confirmTransaction(signature)
    return signature
  } catch (error) {
    throw new Error(`Airdrop failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function getExplorerUrl(signature: string, cluster: 'mainnet-beta' | 'devnet' | 'testnet' = 'mainnet-beta'): string {
  const baseUrl = 'https://explorer.solana.com'
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
  return `${baseUrl}/tx/${signature}${clusterParam}`
}

export function getAccountExplorerUrl(address: string, cluster: 'mainnet-beta' | 'devnet' | 'testnet' = 'mainnet-beta'): string {
  const baseUrl = 'https://explorer.solana.com'
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
  return `${baseUrl}/address/${address}${clusterParam}`
}

export const solanaConnectionManager = new SolanaConnectionManager(DEFAULT_SOLANA_CONFIG)

export default solanaConnectionManager
```