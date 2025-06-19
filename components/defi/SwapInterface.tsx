import React from "react"
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronRight, Settings, ArrowUpDown } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Token {
  symbol: string
  name: string
  mint: string
  decimals: number
  logoURI: string
  balance?: number
}

interface SwapInterfaceProps {
  className?: string
  onSwapComplete?: (txSignature: string) => void
}

interface SwapState {
  fromToken: Token | null
  toToken: Token | null
  fromAmount: string
  toAmount: string
  slippage: number
  isLoading: boolean
  priceImpact: number
}

const POPULAR_TOKENS: Token[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    logoURI: '/tokens/sol.png'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logoURI: '/tokens/usdc.png'
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logoURI: '/tokens/usdt.png'
  }
]

export default function SwapInterface({ className, onSwapComplete }: SwapInterfaceProps) {
  const { connected, publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  
  const [swapState, setSwapState] = useState<SwapState>({
    fromToken: POPULAR_TOKENS[0],
    toToken: POPULAR_TOKENS[1],
    fromAmount: '',
    toAmount: '',
    slippage: 0.5,
    isLoading: false,
    priceImpact: 0
  })
  
  const [showSettings, setShowSettings] = useState(false)
  const [showTokenSelect, setShowTokenSelect] = useState<'from' | 'to' | null>(null)

  const handleAmountChange = (value: string, type: 'from' | 'to') => {
    if (!/^\d*\.?\d*$/.test(value)) return
    
    setSwapState(prev => ({
      ...prev,
      [type === 'from' ? 'fromAmount' : 'toAmount']: value
    }))
    
    // Simulate price calculation
    if (type === 'from' && value) {
      const estimatedOutput = (parseFloat(value) * 0.98).toFixed(6)
      setSwapState(prev => ({
        ...prev,
        toAmount: estimatedOutput,
        priceImpact: 0.2
      }))
    }
  }

  const handleTokenSwap = () => {
    setSwapState(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount
    }))
  }

  const handleTokenSelect = (token: Token) => {
    if (showTokenSelect === 'from') {
      setSwapState(prev => ({ ...prev, fromToken: token }))
    } else if (showTokenSelect === 'to') {
      setSwapState(prev => ({ ...prev, toToken: token }))
    }
    setShowTokenSelect(null)
  }

  const executeSwap = async () => {
    if (!connected || !publicKey || !signTransaction) {
      toast.error('Please connect your wallet')
      return
    }

    if (!swapState.fromToken || !swapState.toToken || !swapState.fromAmount) {
      toast.error('Please fill in all swap details')
      return
    }

    setSwapState(prev => ({ ...prev, isLoading: true }))

    try {
      // Simulate swap transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockTxSignature = 'mock_tx_' + Date.now()
      toast.success('Swap completed successfully!')
      onSwapComplete?.(mockTxSignature)
      
      setSwapState(prev => ({
        ...prev,
        fromAmount: '',
        toAmount: '',
        isLoading: false
      }))
    } catch (error) {
      console.error('Swap failed:', error)
      toast.error('Swap failed. Please try again.')
      setSwapState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const isSwapDisabled = !connected || 
    !swapState.fromToken || 
    !swapState.toToken || 
    !swapState.fromAmount || 
    parseFloat(swapState.fromAmount) <= 0 ||
    swapState.isLoading

  return (
    <Card className={cn("w-full max-w-md mx-auto bg-[#0F0F23] border-gray-800", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-inter">Swap Tokens</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="text-gray-400 hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <Label className="text-gray-300 text-sm">From</Label>
          <div className="relative">
            <div className="flex items-center space-x-2 p-3 bg-gray-900 rounded-xl border border-gray-700">
              <Button
                variant="ghost"
                onClick={() => setShowTokenSelect('from')}
                className="flex items-center space-x-2 p-0 h-auto text-white hover:bg-transparent"
              >
                <div className="w-6 h-6 bg-[#9945FF] rounded-full flex items-center justify-center text-xs font-bold">
                  {swapState.fromToken?.symbol.charAt(0)}
                </div>
                <span className="font-medium">{swapState.fromToken?.symbol}</span>
                <ChevronRight className="h-4 w-4 rotate-90" />
              </Button>
              <Input
                type="text"
                placeholder="0.00"
                value={swapState.fromAmount}
                onChange={(e) => handleAmountChange(e.target.value, 'from')}
                className="border-0 bg-transparent text-right text-lg font-medium text-white placeholder:text-gray-500 focus-visible:ring-0"
              />
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTokenSwap}
            className="rounded-full p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600"
          >
            <ArrowUpDown className="h-4 w-4 text-gray-300" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <Label className="text-gray-300 text-sm">To</Label>
          <div className="relative">
            <div className="flex items-center space-x-2 p-3 bg-gray-900 rounded-xl border border-gray-700">
              <Button
                variant="ghost"
                onClick={() => setShowTokenSelect('to')}
                className="flex items-center space-x-2 p-0 h-auto text-white hover:bg-transparent"
              >
                <div className="w-6 h-6 bg-[#9945FF] rounded-full flex items-center justify-center text-xs font-bold">
                  {swapState.toToken?.symbol.charAt(0)}
                </div>
                <span className="font-medium">{swapState.toToken?.symbol}</span>
                <ChevronRight className="h-4 w-4 rotate-90" />
              </Button>
              <Input
                type="text"
                placeholder="0.00"
                value={swapState.toAmount}
                readOnly
                className="border-0 bg-transparent text-right text-lg font-medium text-white placeholder:text-gray-500 focus-visible:ring-0"
              />
            </div>
          </div>
        </div>

        {/* Price Impact */}
        {swapState.priceImpact > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Price Impact</span>
            <Badge variant={swapState.priceImpact > 3 ? "destructive" : "secondary"}>
              {swapState.priceImpact.toFixed(2)}%
            </Badge>
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={executeSwap}
          disabled={isSwapDisabled}
          className="w-full bg-[#9945FF] hover:bg-[#8A3FE8] text-white font-medium py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {swapState.isLoading ? 'Swapping...' : connected ? 'Swap' : 'Connect Wallet'}
        </Button>
      </CardContent>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-[#0F0F23] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Swap Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Slippage Tolerance</Label>
              <div className="flex space-x-2">
                {[0.1, 0.5, 1.0].map((value) => (
                  <Button
                    key={value}
                    variant={swapState.slippage === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSwapState(prev => ({ ...prev, slippage: value }))}
                    className={cn(
                      "flex-1",
                      swapState.slippage === value 
                        ? "bg-[#9945FF] hover:bg-[#8A3FE8]" 
                        : "border-gray-600 text-gray-300 hover:bg-gray-800"
                    )}
                  >
                    {value}%
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Token Select Dialog */}
      <Dialog open={showTokenSelect !== null} onOpenChange={() => setShowTokenSelect(null)}>
        <DialogContent className="bg-[#0F0F23] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Select Token</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {POPULAR_TOKENS.map((token) => (
              <Button
                key={token.mint}
                variant="ghost"
                onClick={() => handleTokenSelect(token)}
                className="w-full justify-start p-3 hover:bg-gray-800"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#9945FF] rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {token.symbol.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-sm text-gray-400">{token.name}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
```