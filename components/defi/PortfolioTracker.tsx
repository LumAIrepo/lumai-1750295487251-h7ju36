import React from "react"
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, RefreshCw, Plus, Search, Filter } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface PortfolioAsset {
  id: string
  symbol: string
  name: string
  balance: number
  value: number
  price: number
  change24h: number
  allocation: number
}

interface PortfolioStats {
  totalValue: number
  totalChange24h: number
  totalChangePercent: number
  totalAssets: number
}

interface PortfolioTrackerProps {
  className?: string
}

export default function PortfolioTracker({ className }: PortfolioTrackerProps) {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [assets, setAssets] = useState<PortfolioAsset[]>([])
  const [stats, setStats] = useState<PortfolioStats>({
    totalValue: 0,
    totalChange24h: 0,
    totalChangePercent: 0,
    totalAssets: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')
  const [showAddAssetDialog, setShowAddAssetDialog] = useState(false)
  const [newAssetSymbol, setNewAssetSymbol] = useState('')

  const mockAssets: PortfolioAsset[] = [
    {
      id: '1',
      symbol: 'SOL',
      name: 'Solana',
      balance: 125.5,
      value: 12550.75,
      price: 100.00,
      change24h: 5.25,
      allocation: 45.2
    },
    {
      id: '2',
      symbol: 'USDC',
      name: 'USD Coin',
      balance: 5000,
      value: 5000.00,
      price: 1.00,
      change24h: 0.01,
      allocation: 18.0
    },
    {
      id: '3',
      symbol: 'RAY',
      name: 'Raydium',
      balance: 2500,
      value: 3750.00,
      price: 1.50,
      change24h: -2.15,
      allocation: 13.5
    },
    {
      id: '4',
      symbol: 'ORCA',
      name: 'Orca',
      balance: 1800,
      value: 2700.00,
      price: 1.50,
      change24h: 8.45,
      allocation: 9.7
    },
    {
      id: '5',
      symbol: 'SRM',
      name: 'Serum',
      balance: 5000,
      value: 2500.00,
      price: 0.50,
      change24h: -5.30,
      allocation: 9.0
    },
    {
      id: '6',
      symbol: 'MNGO',
      name: 'Mango',
      balance: 10000,
      value: 1250.00,
      price: 0.125,
      change24h: 12.75,
      allocation: 4.5
    }
  ]

  useEffect(() => {
    if (connected && publicKey) {
      loadPortfolioData()
    } else {
      setAssets(mockAssets)
      calculateStats(mockAssets)
    }
  }, [connected, publicKey])

  const loadPortfolioData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setAssets(mockAssets)
      calculateStats(mockAssets)
      toast.success('Portfolio data updated')
    } catch (error) {
      toast.error('Failed to load portfolio data')
      console.error('Error loading portfolio:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (assetList: PortfolioAsset[]) => {
    const totalValue = assetList.reduce((sum, asset) => sum + asset.value, 0)
    const totalChange24h = assetList.reduce((sum, asset) => sum + (asset.value * asset.change24h / 100), 0)
    const totalChangePercent = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0

    setStats({
      totalValue,
      totalChange24h,
      totalChangePercent,
      totalAssets: assetList.length
    })
  }

  const filteredAssets = assets.filter(asset =>
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddAsset = async () => {
    if (!newAssetSymbol.trim()) return

    try {
      // Simulate adding asset
      const newAsset: PortfolioAsset = {
        id: Date.now().toString(),
        symbol: newAssetSymbol.toUpperCase(),
        name: newAssetSymbol,
        balance: 0,
        value: 0,
        price: 0,
        change24h: 0,
        allocation: 0
      }

      const updatedAssets = [...assets, newAsset]
      setAssets(updatedAssets)
      calculateStats(updatedAssets)
      setNewAssetSymbol('')
      setShowAddAssetDialog(false)
      toast.success(`${newAssetSymbol.toUpperCase()} added to portfolio`)
    } catch (error) {
      toast.error('Failed to add asset')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#0F0F23] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-[#9945FF]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalValue)}</div>
            <div className={cn(
              "text-xs flex items-center",
              stats.totalChangePercent >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {stats.totalChangePercent >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {formatPercent(stats.totalChangePercent)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F23] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">24h Change</CardTitle>
            <BarChart3 className="h-4 w-4 text-[#9945FF]" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              stats.totalChange24h >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {formatCurrency(Math.abs(stats.totalChange24h))}
            </div>
            <div className="text-xs text-gray-400">
              {stats.totalChange24h >= 0 ? 'Profit' : 'Loss'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F23] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Assets</CardTitle>
            <PieChart className="h-4 w-4 text-[#9945FF]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalAssets}</div>
            <div className="text-xs text-gray-400">
              Tracked tokens
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0F0F23] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => setShowAddAssetDialog(true)}
              className="w-full bg-[#9945FF] hover:bg-[#8A3FEF] text-white"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Asset
            </Button>
            <Button
              onClick={loadPortfolioData}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Details */}
      <Card className="bg-[#0F0F23] border-gray-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-white">Portfolio Holdings</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="1h" className="text-gray-300 data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">1H</TabsTrigger>
              <TabsTrigger value="24h" className="text-gray-300 data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">24H</TabsTrigger>
              <TabsTrigger value="7d" className="text-gray-300 data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">7D</TabsTrigger>
              <TabsTrigger value="30d" className="text-gray-300 data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">30D</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTimeframe} className="mt-6">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#9945FF]" />
                  </div>
                ) : filteredAssets.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {searchQuery ? 'No assets found matching your search.' : 'No assets in portfolio.'}
                  </div>
                ) : (
                  filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-[#9945FF] flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {asset.symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-white">{asset.symbol}</div>
                          <div className="text-sm text-gray-400">{asset.name}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {asset.balance.toLocaleString()} {asset.symbol}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatCurrency(asset.price)} per token
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {formatCurrency(asset.value)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {asset.allocation.toFixed(1)}% of portfolio
                        </div>
                      </div>