import React from "react"
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Download, ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Transaction {
  id: string
  type: 'bet' | 'claim' | 'deposit' | 'withdraw'
  market: string
  amount: number
  outcome: 'yes' | 'no' | null
  status: 'completed' | 'pending' | 'failed'
  timestamp: Date
  signature: string
  pnl?: number
}

interface TransactionHistoryProps {
  className?: string
  limit?: number
  showFilters?: boolean
}

export default function TransactionHistory({ 
  className, 
  limit,
  showFilters = true 
}: TransactionHistoryProps) {
  const { publicKey } = useWallet()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (publicKey) {
      fetchTransactions()
    }
  }, [publicKey])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchQuery, selectedType, selectedStatus])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      // Mock data - replace with actual API call
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'bet',
          market: 'Will Bitcoin reach $100k by 2024?',
          amount: 50,
          outcome: 'yes',
          status: 'completed',
          timestamp: new Date('2024-01-15T10:30:00Z'),
          signature: '5KJp7z2X9vQ8mR3nF1wY4tE6sA9bC2dH8gL5pM7qN1rS3uV4xW',
          pnl: 25.5
        },
        {
          id: '2',
          type: 'claim',
          market: 'US Election 2024 Winner',
          amount: 125.75,
          outcome: null,
          status: 'completed',
          timestamp: new Date('2024-01-14T15:45:00Z'),
          signature: '3Hp9z1X8vQ7mR2nF0wY3tE5sA8bC1dH7gL4pM6qN0rS2uV3xW',
          pnl: 75.75
        },
        {
          id: '3',
          type: 'deposit',
          market: 'Wallet Deposit',
          amount: 200,
          outcome: null,
          status: 'completed',
          timestamp: new Date('2024-01-13T09:15:00Z'),
          signature: '7Lp2z4X1vQ9mR5nF3wY6tE8sA1bC4dH0gL7pM9qN3rS5uV6xW'
        },
        {
          id: '4',
          type: 'bet',
          market: 'Tesla Stock Price Prediction',
          amount: 75,
          outcome: 'no',
          status: 'pending',
          timestamp: new Date('2024-01-12T14:20:00Z'),
          signature: '9Np5z7X4vQ2mR8nF6wY9tE1sA4bC7dH3gL0pM2qN6rS8uV9xW'
        }
      ]
      
      setTransactions(mockTransactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load transaction history')
    } finally {
      setIsLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.signature.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(tx => tx.type === selectedType)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === selectedStatus)
    }

    if (limit) {
      filtered = filtered.slice(0, limit)
    }

    setFilteredTransactions(filtered)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bet': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'claim': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'deposit': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'withdraw': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Type', 'Market', 'Amount', 'Outcome', 'Status', 'P&L', 'Signature'].join(','),
      ...filteredTransactions.map(tx => [
        tx.timestamp.toISOString(),
        tx.type,
        `"${tx.market}"`,
        tx.amount,
        tx.outcome || '',
        tx.status,
        tx.pnl || '',
        tx.signature
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transaction-history.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Transaction history exported')
  }

  if (!publicKey) {
    return (
      <Card className={cn("bg-[#0F0F23] border-gray-800", className)}>
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">Connect your wallet to view transaction history</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("bg-[#0F0F23] border-gray-800", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white font-semibold">Transaction History</CardTitle>
          <Button
            onClick={exportTransactions}
            variant="outline"
            size="sm"
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showFilters && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-900">
                <TabsTrigger value="all" className="text-gray-300 data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
                  All
                </TabsTrigger>
                <TabsTrigger value="bet" className="text-gray-300 data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
                  Bets
                </TabsTrigger>
                <TabsTrigger value="claim" className="text-gray-300 data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
                  Claims
                </TabsTrigger>
                <TabsTrigger value="deposit" className="text-gray-300 data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
                  Deposits
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="text-gray-300 data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
                  Withdrawals
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-800 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={cn("text-xs font-medium", getTypeColor(transaction.type))}>
                        {transaction.type.toUpperCase()}
                      </Badge>
                      <Badge className={cn("text-xs font-medium", getStatusColor(transaction.status))}>
                        {transaction.status.toUpperCase()}
                      </Badge>
                      {transaction.outcome && (
                        <Badge className={cn(
                          "text-xs font-medium flex items-center gap-1",
                          transaction.outcome === 'yes' 
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        )}>
                          {transaction.outcome === 'yes' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {transaction.outcome.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="text-white font-medium truncate mb-1">
                      {transaction.market}
                    </h4>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{formatDate(transaction.timestamp)}</span>
                      <span className="truncate">
                        {transaction.signature.slice(0, 8)}...{transaction.signature.slice(-8)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-white font-semibold">
                      {formatAmount(transaction.amount)}
                    </div>
                    {transaction.pnl !== undefined && (
                      <div className={cn(
                        "text-sm font-medium",
                        transaction.pnl >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {transaction.pnl >= 0 ? '+' : ''}{formatAmount(transaction.pnl)}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 px-2 text-gray-400 hover:text-white"
                      onClick={() => window.open(`https://solscan.io/tx/${transaction.signature}`, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```