import React from "react"
```typescript
import { useState, useEffect, useCallback } from 'react'
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, Connection } from '@solana/web3.js'
import { toast } from 'sonner'

interface WalletState {
  isConnected: boolean
  isConnecting: boolean
  publicKey: PublicKey | null
  balance: number
  error: string | null
}

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  sendTransaction: (transaction: Transaction) => Promise<string | null>
  refreshBalance: () => Promise<void>
}

export function useWallet(): UseWalletReturn {
  const { 
    publicKey, 
    connected, 
    connecting, 
    connect: walletConnect, 
    disconnect: walletDisconnect,
    sendTransaction: walletSendTransaction
  } = useSolanaWallet()
  
  const { connection } = useConnection()
  
  const [balance, setBalance] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connection) {
      setBalance(0)
      return
    }

    try {
      const lamports = await connection.getBalance(publicKey)
      setBalance(lamports / 1e9) // Convert lamports to SOL
    } catch (err) {
      console.error('Failed to fetch balance:', err)
      setError('Failed to fetch balance')
    }
  }, [publicKey, connection])

  const connect = useCallback(async () => {
    try {
      setError(null)
      await walletConnect()
      toast.success('Wallet connected successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [walletConnect])

  const disconnect = useCallback(async () => {
    try {
      setError(null)
      await walletDisconnect()
      setBalance(0)
      toast.success('Wallet disconnected')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [walletDisconnect])

  const sendTransaction = useCallback(async (transaction: Transaction): Promise<string | null> => {
    if (!publicKey || !connection) {
      const errorMessage = 'Wallet not connected'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }

    try {
      setError(null)
      const signature = await walletSendTransaction(transaction, connection)
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')
      
      toast.success('Transaction sent successfully')
      await refreshBalance()
      
      return signature
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    }
  }, [publicKey, connection, walletSendTransaction, refreshBalance])

  // Refresh balance when wallet connects or publicKey changes
  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance()
    }
  }, [connected, publicKey, refreshBalance])

  // Set up periodic balance refresh
  useEffect(() => {
    if (!connected || !publicKey) return

    const interval = setInterval(() => {
      refreshBalance()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [connected, publicKey, refreshBalance])

  return {
    isConnected: connected,
    isConnecting: connecting,
    publicKey,
    balance,
    error,
    connect,
    disconnect,
    sendTransaction,
    refreshBalance
  }
}

export default useWallet
```