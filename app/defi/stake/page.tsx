import React from "react"
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronRight, User, Settings, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface StakePool {
  id: string
  name: string
  token: string
  apy: number
  totalStaked: number
  userStaked: number
  minStake: number
  lockPeriod: number
  isActive: boolean
}

interface StakeTransaction {
  id: string
  type: 'stake' | 'unstake'
  amount: number
  token: string
  timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
}

export default function StakePage() {
  const { publicKey, connected, signTransaction } = useWallet()
  const { connection } = useConnection()
  
  const [stakePools, setStakePools] = useState<StakePool[]>([
    {
      id: '1',
      name: 'SOL Staking Pool',
      token: 'SOL',
      apy: 7.2,
      totalStaked: 125000,
      userStaked: 0,
      minStake: 0.1,
      lockPeriod: 0,
      isActive: true
    },
    {
      id: '2',
      name: 'USDC Yield Pool',
      token: 'USDC',
      apy: 12.5,
      totalStaked: 850000,
      userStaked: 0,
      minStake: 10,
      lockPeriod: 30,
      isActive: true
    },
    {
      id: '3',
      name: 'RAY Liquidity Pool',
      token: 'RAY',
      apy: 18.7,
      totalStaked: 45000,
      userStaked: 0,
      minStake: 1,
      lockPeriod: 7,
      isActive: true
    }
  ])
  
  const [transactions, setTransactions] = useState<StakeTransaction[]>([])
  const [selectedPool, setSelectedPool] = useState<StakePool | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [isStakeDialogOpen, setIsStakeDialogOpen] = useState(false)
  const [isUnstakeDialogOpen, setIsUnstakeDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [activeTab, setActiveTab] = useState('pools')

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
      fetchUserStakes()
    }
  }, [connected, publicKey])

  const fetchBalance = async () => {
    if (!connection || !publicKey) return
    
    try {
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const fetchUserStakes = async () => {
    // Simulate fetching user stakes
    setStakePools(prev => prev.map(pool => ({
      ...pool,
      userStaked: Math.random() * 100
    })))
  }

  const handleStake = async () => {
    if (!selectedPool || !stakeAmount || !publicKey || !signTransaction) {
      toast.error('Missing required information')
      return
    }

    const amount = parseFloat(stakeAmount)
    if (amount < selectedPool.minStake) {
      toast.error(`Minimum stake amount is ${selectedPool.minStake} ${selectedPool.token}`)
      return
    }

    if (selectedPool.token === 'SOL' && amount > balance) {
      toast.error('Insufficient balance')
      return
    }

    setIsLoading(true)

    try {
      // Simulate staking transaction
      const transaction = new Transaction()
      
      // Add your staking program instructions here
      // const stakeInstruction = createStakeInstruction(...)
      // transaction.add(stakeInstruction)

      // const signedTransaction = await signTransaction(transaction)
      // const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      
      // Simulate successful transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newTransaction: StakeTransaction = {
        id: Date.now().toString(),
        type: 'stake',
        amount,
        token: selectedPool.token,
        timestamp: new Date(),
        status: 'confirmed'
      }

      setTransactions(prev => [newTransaction, ...prev])
      setStakePools(prev => prev.map(pool => 
        pool.id === selectedPool.id 
          ? { ...pool, userStaked: pool.userStaked + amount, totalStaked: pool.totalStaked + amount }
          : pool
      ))

      toast.success(`Successfully staked ${amount} ${selectedPool.token}`)
      setIsStakeDialogOpen(false)
      setStakeAmount('')
      fetchBalance()
    } catch (error) {
      console.error('Staking error:', error)
      toast.error('Failed to stake tokens')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnstake = async () => {
    if (!selectedPool || !unstakeAmount || !publicKey || !signTransaction) {
      toast.error('Missing required information')
      return
    }

    const amount = parseFloat(unstakeAmount)
    if (amount > selectedPool.userStaked) {
      toast.error('Insufficient staked amount')
      return
    }

    setIsLoading(true)

    try {
      // Simulate unstaking transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newTransaction: StakeTransaction = {
        id: Date.now().toString(),
        type: 'unstake',
        amount,
        token: selectedPool.token,
        timestamp: new Date(),
        status: 'confirmed'
      }

      setTransactions(prev => [newTransaction, ...prev])
      setStakePools(prev => prev.map(pool => 
        pool.id === selectedPool.id 
          ? { ...pool, userStaked: pool.userStaked - amount, totalStaked: pool.totalStaked - amount }
          : pool
      ))

      toast.success(`Successfully unstaked ${amount} ${selectedPool.token}`)
      setIsUnstakeDialogOpen(false)
      setUnstakeAmount('')
      fetchBalance()
    } catch (error) {
      console.error('Unstaking error:', error)
      toast.error('Failed to unstake tokens')
    } finally {
      setIsLoading(false)
    }
  }

  const openStakeDialog = (pool: StakePool) => {
    setSelectedPool(pool)
    setIsStakeDialogOpen(true)
  }

  const openUnstakeDialog = (pool: StakePool) => {
    setSelectedPool(pool)
    setIsUnstakeDialogOpen(true)
  }

  const totalStakedValue = stakePools.reduce((sum, pool) => sum + pool.userStaked, 0)
  const totalRewards = stakePools.reduce((sum, pool) => sum + (pool.userStaked * pool.apy / 100 / 365), 0)

  return (
    <div className="min-h-screen bg-[#0F0F23] text-white font-inter">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Staking</h1>
          <p className="text-gray-400">Earn rewards by staking your tokens</p>
        </div>

        {!connected ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-400 mb-4">Connect your wallet to start staking</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Total Staked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalStakedValue.toFixed(2)}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Daily Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#9945FF]">${totalRewards.toFixed(4)}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Wallet Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{balance.toFixed(4)} SOL</div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-800">
                <TabsTrigger value="pools" className="data-[state=active]:bg-[#9945FF]">
                  Staking Pools
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-[#9945FF]">
                  Transaction History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pools" className="space-y-4">
                {stakePools.map((pool) => (
                  <Card key={pool.id} className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#9945FF] rounded-full flex items-center justify-center">
                            <span className="font-bold text-sm">{pool.token}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{pool.name}</h3>
                            <p className="text-sm text-gray-400">
                              {pool.lockPeriod > 0 ? `${pool.lockPeriod} day lock` : 'No lock period'}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={pool.isActive ? "default" : "secondary"}
                          className={pool.isActive ? "bg-green-600" : ""}
                        >
                          {pool.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-400">APY</p>
                          <p className="font-semibold text-[#9945FF]">{pool.apy}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Total Staked</p>
                          <p className="font-semibold">{pool.totalStaked.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Your Stake</p>
                          <p className="font-semibold">{pool.userStaked.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Min Stake</p>
                          <p className="font-semibold">{pool.minStake} {pool.token}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => openStakeDialog(pool)}
                          className="bg-[#9945FF] hover:bg-[#8A3FE8] flex-1"
                          disabled={!pool.isActive}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Stake
                        </Button>
                        <Button 
                          onClick={() => openUnstakeDialog(pool)}
                          variant="outline"
                          className="border-gray-700 hover:bg-gray-800 flex-1"
                          disabled={!pool.isActive || pool.userStaked === 0}
                        >
                          Unstake
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                {transactions.length === 0 ? (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-8 text-center">
                      <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-semibold mb-2">No Transactions</h3>
                      <p className="text-gray-400">Your staking transactions will appear here</p>
                    </CardContent>
                  </Card>
                ) : (
                  transactions.map((tx) => (
                    <Card key={tx.id} className="bg-gray-900 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              tx.type === 'stake' ? "bg-green-