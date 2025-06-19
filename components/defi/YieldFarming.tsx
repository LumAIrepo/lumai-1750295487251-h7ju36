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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, User, Settings, Plus, TrendingUp, Coins, Percent, Clock } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface YieldPool {
  id: string
  name: string
  tokenA: string
  tokenB: string
  apy: number
  tvl: number
  userStaked: number
  rewards: number
  lockPeriod: number
  riskLevel: 'Low' | 'Medium' | 'High'
  protocol: string
}

interface YieldFarmingProps {
  className?: string
}

export default function YieldFarming({ className }: YieldFarmingProps) {
  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()
  const [pools, setPools] = useState<YieldPool[]>([])
  const [selectedPool, setSelectedPool] = useState<YieldPool | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [isStakeDialogOpen, setIsStakeDialogOpen] = useState(false)
  const [isUnstakeDialogOpen, setIsUnstakeDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchYieldPools()
  }, [connected])

  const fetchYieldPools = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual API call
      const mockPools: YieldPool[] = [
        {
          id: '1',
          name: 'SOL-USDC LP',
          tokenA: 'SOL',
          tokenB: 'USDC',
          apy: 12.5,
          tvl: 2500000,
          userStaked: connected ? 1250 : 0,
          rewards: connected ? 15.75 : 0,
          lockPeriod: 0,
          riskLevel: 'Low',
          protocol: 'Raydium'
        },
        {
          id: '2',
          name: 'RAY-SOL LP',
          tokenA: 'RAY',
          tokenB: 'SOL',
          apy: 24.8,
          tvl: 1800000,
          userStaked: connected ? 850 : 0,
          rewards: connected ? 32.4 : 0,
          lockPeriod: 7,
          riskLevel: 'Medium',
          protocol: 'Raydium'
        },
        {
          id: '3',
          name: 'ORCA-USDC LP',
          tokenA: 'ORCA',
          tokenB: 'USDC',
          apy: 18.2,
          tvl: 950000,
          userStaked: connected ? 0 : 0,
          rewards: connected ? 0 : 0,
          lockPeriod: 14,
          riskLevel: 'Medium',
          protocol: 'Orca'
        },
        {
          id: '4',
          name: 'MNGO-SOL LP',
          tokenA: 'MNGO',
          tokenB: 'SOL',
          apy: 45.6,
          tvl: 420000,
          userStaked: connected ? 0 : 0,
          rewards: connected ? 0 : 0,
          lockPeriod: 30,
          riskLevel: 'High',
          protocol: 'Mango'
        }
      ]
      setPools(mockPools)
    } catch (error) {
      toast.error('Failed to fetch yield pools')
    } finally {
      setLoading(false)
    }
  }

  const handleStake = async () => {
    if (!connected || !selectedPool || !stakeAmount) {
      toast.error('Please connect wallet and enter stake amount')
      return
    }

    try {
      setLoading(true)
      // Mock transaction - replace with actual staking logic
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Successfully staked ${stakeAmount} tokens in ${selectedPool.name}`)
      setStakeAmount('')
      setIsStakeDialogOpen(false)
      fetchYieldPools()
    } catch (error) {
      toast.error('Failed to stake tokens')
    } finally {
      setLoading(false)
    }
  }

  const handleUnstake = async () => {
    if (!connected || !selectedPool || !unstakeAmount) {
      toast.error('Please connect wallet and enter unstake amount')
      return
    }

    try {
      setLoading(true)
      // Mock transaction - replace with actual unstaking logic
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Successfully unstaked ${unstakeAmount} tokens from ${selectedPool.name}`)
      setUnstakeAmount('')
      setIsUnstakeDialogOpen(false)
      fetchYieldPools()
    } catch (error) {
      toast.error('Failed to unstake tokens')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimRewards = async (pool: YieldPool) => {
    if (!connected || pool.rewards === 0) {
      toast.error('No rewards to claim')
      return
    }

    try {
      setLoading(true)
      // Mock transaction - replace with actual claim logic
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success(`Successfully claimed ${pool.rewards.toFixed(2)} tokens`)
      fetchYieldPools()
    } catch (error) {
      toast.error('Failed to claim rewards')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const filteredPools = pools.filter(pool => {
    if (activeTab === 'all') return true
    if (activeTab === 'staked') return pool.userStaked > 0
    if (activeTab === 'available') return pool.userStaked === 0
    return true
  })

  const totalStaked = pools.reduce((sum, pool) => sum + pool.userStaked, 0)
  const totalRewards = pools.reduce((sum, pool) => sum + pool.rewards, 0)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0F0F23] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Staked</p>
                <p className="text-2xl font-bold text-white">${totalStaked.toLocaleString()}</p>
              </div>
              <Coins className="h-8 w-8 text-[#9945FF]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F23] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Rewards</p>
                <p className="text-2xl font-bold text-white">${totalRewards.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F23] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Pools</p>
                <p className="text-2xl font-bold text-white">{pools.filter(p => p.userStaked > 0).length}</p>
              </div>
              <Percent className="h-8 w-8 text-[#9945FF]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pool Filters */}
      <Card className="bg-[#0F0F23] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Yield Farming Pools</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#9945FF]">All Pools</TabsTrigger>
              <TabsTrigger value="staked" className="data-[state=active]:bg-[#9945FF]">My Stakes</TabsTrigger>
              <TabsTrigger value="available" className="data-[state=active]:bg-[#9945FF]">Available</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9945FF] mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading pools...</p>
                  </div>
                ) : filteredPools.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No pools found</p>
                  </div>
                ) : (
                  filteredPools.map((pool) => (
                    <Card key={pool.id} className="bg-gray-900/50 border-gray-700 hover:border-[#9945FF]/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">{pool.name}</h3>
                              <Badge variant="outline" className={getRiskColor(pool.riskLevel)}>
                                {pool.riskLevel} Risk
                              </Badge>
                              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                {pool.protocol}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">APY</p>
                                <p className="text-green-400 font-semibold">{pool.apy}%</p>
                              </div>
                              <div>
                                <p className="text-gray-400">TVL</p>
                                <p className="text-white">${pool.tvl.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Lock Period</p>
                                <p className="text-white">{pool.lockPeriod === 0 ? 'None' : `${pool.lockPeriod} days`}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Your Stake</p>
                                <p className="text-white">${pool.userStaked.toLocaleString()}</p>
                              </div>
                            </div>

                            {pool.userStaked > 0 && (
                              <div className="mt-3 p-3 bg-[#9945FF]/10 rounded-lg border border-[#9945FF]/20">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-300">Pending Rewards:</span>
                                  <span className="text-sm font-semibold text-[#9945FF]">${pool.rewards.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            {pool.userStaked > 0 ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPool(pool)
                                    setIsUnstakeDialogOpen(true)
                                  }}
                                  className="border-gray-600 hover:border-red-500 hover:text-red-400"
                                >
                                  Unstake
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleClaimRewards(pool)}
                                  disabled={pool.rewards === 0 || loading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Claim ${pool.rewards.toFixed(2)}
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedPool(pool)
                                  setIsStakeDialogOpen(true)
                                }}
                                className="bg-[#9945FF] hover:bg-[#9945FF]/80"
                                disabled={!connected}
                              >
                                Stake
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Stake Dialog */}
      <Dialog