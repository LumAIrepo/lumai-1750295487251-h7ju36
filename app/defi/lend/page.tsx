import React from "react"
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, User, Settings, Plus, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface LendingPool {
  id: string
  asset: string
  symbol: string
  totalSupplied: number
  totalBorrowed: number
  supplyApy: number
  borrowApy: number
  utilizationRate: number
  collateralFactor: number
  liquidationThreshold: number
  userSupplied?: number
  userBorrowed?: number
}

interface UserPosition {
  totalSupplied: number
  totalBorrowed: number
  healthFactor: number
  netApy: number
  collateralValue: number
  borrowCapacity: number
}

export default function LendPage() {
  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()
  const [activeTab, setActiveTab] = useState<'supply' | 'borrow'>('supply')
  const [selectedPool, setSelectedPool] = useState<LendingPool | null>(null)
  const [amount, setAmount] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pools, setPools] = useState<LendingPool[]>([])
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null)

  useEffect(() => {
    // Mock data - replace with actual Solana program calls
    const mockPools: LendingPool[] = [
      {
        id: '1',
        asset: 'Solana',
        symbol: 'SOL',
        totalSupplied: 125000,
        totalBorrowed: 87500,
        supplyApy: 4.2,
        borrowApy: 6.8,
        utilizationRate: 70,
        collateralFactor: 80,
        liquidationThreshold: 85,
        userSupplied: connected ? 15.5 : undefined,
        userBorrowed: connected ? 0 : undefined
      },
      {
        id: '2',
        asset: 'USD Coin',
        symbol: 'USDC',
        totalSupplied: 2500000,
        totalBorrowed: 1875000,
        supplyApy: 3.8,
        borrowApy: 5.2,
        utilizationRate: 75,
        collateralFactor: 85,
        liquidationThreshold: 90,
        userSupplied: connected ? 1250 : undefined,
        userBorrowed: connected ? 500 : undefined
      },
      {
        id: '3',
        asset: 'Ethereum',
        symbol: 'ETH',
        totalSupplied: 8500,
        totalBorrowed: 5950,
        supplyApy: 3.5,
        borrowApy: 5.8,
        utilizationRate: 70,
        collateralFactor: 75,
        liquidationThreshold: 80,
        userSupplied: connected ? 2.1 : undefined,
        userBorrowed: connected ? 0.5 : undefined
      },
      {
        id: '4',
        asset: 'Bitcoin',
        symbol: 'BTC',
        totalSupplied: 450,
        totalBorrowed: 315,
        supplyApy: 2.8,
        borrowApy: 4.9,
        utilizationRate: 70,
        collateralFactor: 70,
        liquidationThreshold: 75,
        userSupplied: connected ? 0.05 : undefined,
        userBorrowed: connected ? 0 : undefined
      }
    ]
    setPools(mockPools)

    if (connected) {
      setUserPosition({
        totalSupplied: 45250.75,
        totalBorrowed: 18500.25,
        healthFactor: 2.45,
        netApy: 2.1,
        collateralValue: 38463.64,
        borrowCapacity: 30770.91
      })
    }
  }, [connected])

  const handleSupply = async () => {
    if (!connected || !selectedPool || !amount) {
      toast.error('Please connect wallet and enter amount')
      return
    }

    setIsLoading(true)
    try {
      // Mock transaction - replace with actual Solana program interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Successfully supplied ${amount} ${selectedPool.symbol}`)
      setIsDialogOpen(false)
      setAmount('')
    } catch (error) {
      toast.error('Transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBorrow = async () => {
    if (!connected || !selectedPool || !amount) {
      toast.error('Please connect wallet and enter amount')
      return
    }

    setIsLoading(true)
    try {
      // Mock transaction - replace with actual Solana program interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Successfully borrowed ${amount} ${selectedPool.symbol}`)
      setIsDialogOpen(false)
      setAmount('')
    } catch (error) {
      toast.error('Transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = (pool: LendingPool, tab: 'supply' | 'borrow') => {
    setSelectedPool(pool)
    setActiveTab(tab)
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#0F0F23] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Lending & Borrowing</h1>
            <p className="text-gray-400">Supply assets to earn yield or borrow against your collateral</p>
          </div>
          {connected && (
            <Badge variant="outline" className="border-[#9945FF] text-[#9945FF] px-4 py-2">
              <User className="w-4 h-4 mr-2" />
              Connected
            </Badge>
          )}
        </div>

        {/* User Position Overview */}
        {connected && userPosition && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Supplied</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${userPosition.totalSupplied.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Borrowed</p>
                    <p className="text-2xl font-bold text-red-400">
                      ${userPosition.totalBorrowed.toLocaleString()}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Health Factor</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      userPosition.healthFactor > 2 ? "text-green-400" : 
                      userPosition.healthFactor > 1.5 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {userPosition.healthFactor.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-[#9945FF]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Net APY</p>
                    <p className="text-2xl font-bold text-[#9945FF]">
                      {userPosition.netApy.toFixed(1)}%
                    </p>
                  </div>
                  <Percent className="w-8 h-8 text-[#9945FF]" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lending Pools */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Lending Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-4 px-2 text-gray-400 font-medium">Asset</th>
                    <th className="text-right py-4 px-2 text-gray-400 font-medium">Total Supplied</th>
                    <th className="text-right py-4 px-2 text-gray-400 font-medium">Total Borrowed</th>
                    <th className="text-right py-4 px-2 text-gray-400 font-medium">Supply APY</th>
                    <th className="text-right py-4 px-2 text-gray-400 font-medium">Borrow APY</th>
                    <th className="text-right py-4 px-2 text-gray-400 font-medium">Utilization</th>
                    {connected && <th className="text-right py-4 px-2 text-gray-400 font-medium">Your Position</th>}
                    <th className="text-right py-4 px-2 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool) => (
                    <tr key={pool.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-4 px-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#9945FF] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {pool.symbol.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{pool.asset}</p>
                            <p className="text-sm text-gray-400">{pool.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-4 px-2 text-white">
                        {pool.totalSupplied.toLocaleString()} {pool.symbol}
                      </td>
                      <td className="text-right py-4 px-2 text-white">
                        {pool.totalBorrowed.toLocaleString()} {pool.symbol}
                      </td>
                      <td className="text-right py-4 px-2 text-green-400 font-medium">
                        {pool.supplyApy.toFixed(1)}%
                      </td>
                      <td className="text-right py-4 px-2 text-red-400 font-medium">
                        {pool.borrowApy.toFixed(1)}%
                      </td>
                      <td className="text-right py-4 px-2">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#9945FF] transition-all duration-300"
                              style={{ width: `${pool.utilizationRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400">{pool.utilizationRate}%</span>
                        </div>
                      </td>
                      {connected && (
                        <td className="text-right py-4 px-2">
                          <div className="text-sm">
                            {pool.userSupplied && pool.userSupplied > 0 && (
                              <p className="text-green-400">
                                Supplied: {pool.userSupplied} {pool.symbol}
                              </p>
                            )}
                            {pool.userBorrowed && pool.userBorrowed > 0 && (
                              <p className="text-red-400">
                                Borrowed: {pool.userBorrowed} {pool.symbol}
                              </p>
                            )}
                            {(!pool.userSupplied || pool.userSupplied === 0) && 
                             (!pool.userBorrowed || pool.userBorrowed === 0) && (
                              <p className="text-gray-400">No position</p>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="text-right py-4 px-2">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            onClick={() => openDialog(pool, 'supply')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Supply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(pool,