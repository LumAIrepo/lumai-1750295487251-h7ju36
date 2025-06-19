```tsx
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { toast } from 'sonner'

require('@solana/wallet-adapter-react-ui/styles.css')

interface WalletContextType {
  network: WalletAdapterNetwork
  setNetwork: (network: WalletAdapterNetwork) => void
  isConnecting: boolean
  setIsConnecting: (connecting: boolean) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const useWalletContext = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider')
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const [network, setNetwork] = useState<WalletAdapterNetwork>(WalletAdapterNetwork.Devnet)
  const [isConnecting, setIsConnecting] = useState(false)

  const endpoint = React.useMemo(() => clusterApiUrl(network), [network])

  const wallets = React.useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
    ],
    [network]
  )

  const onError = React.useCallback((error: any) => {
    console.error('Wallet error:', error)
    toast.error(error?.message || 'Wallet connection failed')
    setIsConnecting(false)
  }, [])

  const contextValue: WalletContextType = {
    network,
    setNetwork,
    isConnecting,
    setIsConnecting,
  }

  return (
    <WalletContext.Provider value={contextValue}>
      <ConnectionProvider endpoint={endpoint}>
        <SolanaWalletProvider wallets={wallets} onError={onError} autoConnect>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </SolanaWalletProvider>
      </ConnectionProvider>
    </WalletContext.Provider>
  )
}
```