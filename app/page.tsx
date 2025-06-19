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
import { ChevronRight, User, Settings, Plus, TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface PredictionMarket {
  id: string;
  title: string;
  description: string;
  category: string;
  endDate: Date;
  totalVolume: number;
  yesPrice: number;
  noPrice: number;
  yesShares: number;
  noShares: number;
  status: 'active' | 'resolved' | 'pending';
  outcome?: 'yes' | 'no';
}

interface UserPosition {
  marketId: string;
  marketTitle: string;
  position: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  currentValue: number;
  pnl: number;
}

interface PortfolioStats {
  totalValue: number;
  totalPnl: number;
  activePositions: number;
  winRate: number;
}

export default function Page() {
  const { connected, publicKey, connect, disconnect } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalValue: 0,
    totalPnl: 0,
    activePositions: 0,
    winRate: 0
  });
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [trendingMarkets, setTrendingMarkets] = useState<PredictionMarket[]>([]);
  const [isCreateMarketOpen, setIsCreateMarketOpen] = useState(false);
  const [newMarketTitle, setNewMarketTitle] = useState('');
  const [newMarketDescription, setNewMarketDescription] = useState('');
  const [newMarketCategory, setNewMarketCategory] = useState('');
  const [newMarketEndDate, setNewMarketEndDate] = useState('');

  useEffect(() => {
    if (connected && publicKey) {
      loadUserData();
    }
    loadTrendingMarkets();
  }, [connected, publicKey]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual Solana program calls
      setPortfolioStats({
        totalValue: 2450.75,
        totalPnl: 325.50,
        activePositions: 8,
        winRate: 67.5
      });

      setUserPositions([
        {
          marketId: '1',
          marketTitle: 'Will Bitcoin reach $100k by end of 2024?',
          position: 'yes',
          shares: 100,
          avgPrice: 0.65,
          currentValue: 72.50,
          pnl: 7.50
        },
        {
          marketId: '2',
          marketTitle: 'Will Ethereum 2.0 launch successfully?',
          position: 'no',
          shares: 50,
          avgPrice: 0.35,
          currentValue: 15.50,
          pnl: -2.00
        }
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMarkets = async () => {
    try {
      // Mock data - replace with actual API calls
      setTrendingMarkets([
        {
          id: '1',
          title: 'Will Bitcoin reach $100k by end of 2024?',
          description: 'Bitcoin price prediction for end of year 2024',
          category: 'Crypto',
          endDate: new Date('2024-12-31'),
          totalVolume: 125000,
          yesPrice: 0.72,
          noPrice: 0.28,
          yesShares: 87500,
          noShares: 37500,
          status: 'active'
        },
        {
          id: '2',
          title: 'Will Solana outperform Ethereum in 2024?',
          description: 'Performance comparison between SOL and ETH',
          category: 'Crypto',
          endDate: new Date('2024-12-31'),
          totalVolume: 89000,
          yesPrice: 0.58,
          noPrice: 0.42,
          yesShares: 51620,
          noShares: 37380,
          status: 'active'
        },
        {
          id: '3',
          title: 'Will AI tokens surge in Q2 2024?',
          description: 'Artificial Intelligence token market prediction',
          category: 'AI',
          endDate: new Date('2024-06-30'),
          totalVolume: 67500,
          yesPrice: 0.45,
          noPrice: 0.55,
          yesShares: 30375,
          noShares: 37125,
          status: 'active'
        }
      ]);
    } catch (error) {
      console.error('Error loading trending markets:', error);
      toast.error('Failed to load trending markets');
    }
  };

  const handleCreateMarket = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!newMarketTitle || !newMarketDescription || !newMarketCategory || !newMarketEndDate) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Mock market creation - replace with actual Solana program call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Market created successfully!');
      setIsCreateMarketOpen(false);
      setNewMarketTitle('');
      setNewMarketDescription('');
      setNewMarketCategory('');
      setNewMarketEndDate('');
      loadTrendingMarkets();
    } catch (error) {
      console.error('Error creating market:', error);
      toast.error('Failed to create market');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-[#0F0F23] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">PhantomSecure Dashboard</h1>
            <p className="text-gray-400">Decentralized prediction markets on Solana</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsCreateMarketOpen(true)}
              className="bg-[#9945FF] hover:bg-[#8A3FE8] text-white rounded-xl"
              disabled={!connected}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Market
            </Button>
            {connected ? (
              <Button
                onClick={disconnect}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800 rounded-xl"
              >
                <User className="w-4 h-4 mr-2" />
                {publicKey?.toString().slice(0, 8)}...
              </Button>
            ) : (
              <Button
                onClick={connect}
                className="bg-[#9945FF] hover:bg-[#8A3FE8] text-white rounded-xl"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        {connected ? (
          <>
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-900 border-gray-800 rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Portfolio Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{formatCurrency(portfolioStats.totalValue)}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800 rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Total P&L</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold flex items-center",
                    portfolioStats.totalPnl >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {portfolioStats.totalPnl >= 0 ? (
                      <TrendingUp className="w-5 h-5 mr-2" />
                    ) : (
                      <TrendingDown className="w-5 h-5 mr-2" />
                    )}
                    {formatCurrency(Math.abs(portfolioStats.totalPnl))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800 rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Active Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{portfolioStats.activePositions}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-gray-800 rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{portfolioStats.winRate}%</div>
                </CardContent>
              </Card>
            </div>

            {/* User Positions */}
            <Card className="bg-gray-900 border-gray-800 rounded-xl mb-8">
              <CardHeader>
                <CardTitle className="text-white">Your Positions</CardTitle>
              </CardHeader>
              <CardContent>
                {userPositions.length > 0 ? (
                  <div className="space-y-4">
                    {userPositions.map((position) => (
                      <div key={position.marketId} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">{position.marketTitle}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <Badge 
                              variant={position.position === 'yes' ? 'default' : 'secondary'}
                              className={cn(
                                "rounded-lg",
                                position.position === 'yes' 
                                  ? "bg-green-500/20 text-green-400 border-green-500/30" 
                                  : "bg-red-500/20 text-red-400 border-red-500/30"
                              )}
                            >
                              {position.position.toUpperCase()}
                            </Badge>
                            <span>{position.shares} shares @ {formatCurrency(position.avgPrice)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">{formatCurrency(position.currentValue)}</div>
                          <div className={cn(
                            "text-sm",
                            position.pnl >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active positions yet</p>
                    <p className="text-sm">Start trading to see your positions here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}

        {/* Trending Markets */}
        <Card className="bg-gray-900 border-gray-800 rounded-xl">
          <CardHeader>
            <CardTitle className="text-white">Trending Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingMarkets.map((market) => (
                <Card key={market.id} className="bg-gray-800 border-gray-700 rounded-xl hover:bg-gray-750 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary" className="bg-[#9945FF]/20 text-[#9945FF] border-[#9945FF]/30 rounded-lg">
                        {market.category}
                      </Badge>
                      <Badge variant="outline" className="border-gray-600 text-gray-400 rounded-lg">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.ceil((market.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-lg leading-tight">{market.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text