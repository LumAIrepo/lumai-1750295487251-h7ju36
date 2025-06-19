import React from "react"
```typescript
import { PublicKey } from "@solana/web3.js"

export interface WalletInfo {
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  disconnecting: boolean
  wallet: {
    adapter: {
      name: string
      icon: string
      url: string
    }
  } | null
}

export interface TransactionStatus {
  signature: string
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: number
  blockTime?: number
  slot?: number
  confirmations?: number
}

export interface WalletTransaction {
  signature: string
  blockTime: number | null
  slot: number
  meta: {
    err: any
    fee: number
    preBalances: number[]
    postBalances: number[]
    logMessages?: string[]
  } | null
  transaction: {
    message: {
      accountKeys: PublicKey[]
      instructions: TransactionInstruction[]
      recentBlockhash: string
    }
    signatures: string[]
  }
}

export interface TransactionInstruction {
  programId: PublicKey
  accounts: {
    pubkey: PublicKey
    isSigner: boolean
    isWritable: boolean
  }[]
  data: string
}

export interface WalletBalance {
  lamports: number
  sol: number
  usd?: number
}

export interface TokenAccount {
  mint: PublicKey
  owner: PublicKey
  amount: string
  decimals: number
  uiAmount: number | null
  uiAmountString: string
}

export interface WalletTokenBalance {
  mint: string
  symbol: string
  name: string
  decimals: number
  balance: number
  uiBalance: string
  logoURI?: string
  price?: number
  value?: number
}

export interface WalletActivity {
  signature: string
  type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'other'
  amount: number
  token: string
  timestamp: number
  status: 'confirmed' | 'failed'
  fee: number
  from?: string
  to?: string
}

export interface WalletError {
  code: number
  message: string
  data?: any
}

export interface WalletState {
  info: WalletInfo
  balance: WalletBalance | null
  tokens: WalletTokenBalance[]
  transactions: WalletTransaction[]
  activity: WalletActivity[]
  loading: boolean
  error: WalletError | null
}

export interface SendTransactionParams {
  to: string
  amount: number
  token?: string
  memo?: string
}

export interface SwapTransactionParams {
  fromToken: string
  toToken: string
  amount: number
  slippage: number
}

export interface StakeTransactionParams {
  validatorAddress: string
  amount: number
}

export type WalletActionType = 
  | 'CONNECT_WALLET'
  | 'DISCONNECT_WALLET'
  | 'UPDATE_BALANCE'
  | 'UPDATE_TOKENS'
  | 'ADD_TRANSACTION'
  | 'UPDATE_ACTIVITY'
  | 'SET_LOADING'
  | 'SET_ERROR'
  | 'CLEAR_ERROR'

export interface WalletAction {
  type: WalletActionType
  payload?: any
}

export interface WalletContextType {
  state: WalletState
  dispatch: (action: WalletAction) => void
  connectWallet: () => Promise<void>
  disconnectWallet: () => Promise<void>
  sendTransaction: (params: SendTransactionParams) => Promise<string>
  swapTokens: (params: SwapTransactionParams) => Promise<string>
  stakeTokens: (params: StakeTransactionParams) => Promise<string>
  refreshBalance: () => Promise<void>
  refreshTokens: () => Promise<void>
  refreshActivity: () => Promise<void>
}
```