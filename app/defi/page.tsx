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
import { ChevronRight, User, Settings, Plus, TrendingUp, TrendingDown, DollarSign, BarChart3, Zap, Shield } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface YieldOpportunity {
  id: string;
  protocol: string;
  asset: string;
  apy: number;
  tvl: string;
  risk: 'Low' | 'Medium' | 'High';
  category: 'Lending' | 'Staking' | 'LP' | 'Yield Farming';
  logo: string;
}

interface PortfolioPosition {
  id: string;
  protocol: string;
  asset: string;
  amount: string;
  value: string;
  apy: number;
  earnings: string;
}

interface ProtocolStats {
  totalValueLocked: string;
  totalEarnings: string;
  activePositions: number;
  averageAPY: number;
}

export default function DeFiPage() {
  const { connected, publicKey, connect, disconnect } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('opportunities');
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<YieldOpportunity | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [yieldOpportunities, setYieldOpportunities] = useState<YieldOpportunity[]>([
    {
      id: '1',
      protocol: 'Marinade',
      asset: 'SOL',
      apy: 7.2,
      tvl: '$1.2B',
      risk: 'Low',
      category: 'Staking',
      logo: '🌊'
    },
    {
      id: '2',
      protocol: 'Raydium',
      asset: 'SOL-USDC',
      apy: 12.5,
      tvl: '$450M',
      risk: 'Medium',
      category: 'LP',
      logo: '⚡'
    },
    {
      id: '3',
      protocol: 'Solend',
      asset: 'USDC',
      apy: 5.8,
      tvl: '$800M',
      risk: 'Low',
      category: 'Lending',
      logo: '🏦'
    },
    {
      id: '4',
      protocol: 'Orca',
      asset: 'ORCA-SOL',
      apy: 15.3,
      tvl: '$320M',
      risk: 'High',
      category: 'LP',
      logo: '🐋'
    },
    {
      id: '5',
      protocol: 'Tulip',
      asset: 'RAY',
      apy: 18.7,
      tvl: '$180M',
      risk: 'High',
      category: 'Yield Farming',
      logo: '🌷'
    },
    {
      id: '6',
      protocol: 'Francium',
      asset: 'BTC',
      apy: 4.2,
      tvl: '$95M',
      risk: 'Medium',
      category: 'Lending',
      logo: '⚛️'
    }
  ]);

  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([
    {
      id: '1',
      protocol: 'Marinade',
      asset: 'mSOL',
      amount: '25.5',
      value: '$2,550',
      apy: 7.2,
      earnings: '+$183.60'
    },
    {
      id: '2',
      protocol: 'Raydium',
      asset: 'SOL-USDC LP',
      amount: '1,200',
      value: '$1,200',
      apy: 12.5,
      earnings: '+$150.00'
    }
  ]);

  const [protocolStats, setProtocolStats] = useState<ProtocolStats>({
    totalValueLocked: '$3,750',
    totalEarnings: '+$333.60',
    activePositions: 2,
    averageAPY: 9.85
  });

  useEffect(() => {
    if (connected && publicKey) {
      loadUserData();
    }
  }, [connected, publicKey]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Simulate loading user data
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Portfolio data loaded');
    } catch (error) {
      toast.error('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!connected || !selectedOpportunity || !depositAmount) {
      toast.error('Please connect wallet and enter amount');
      return;
    }

    setLoading(true);
    try {
      // Simulate deposit transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Successfully deposited ${depositAmount} ${selectedOpportunity.asset}`);
      setShowDepositDialog(false);
      setDepositAmount('');
      setSelectedOpportunity(null);
    } catch (error) {
      toast.error('Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Staking': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Lending': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'LP': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'Yield Farming': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F23] text-white font-inter">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">DeFi Dashboard</h1>
            <p className="text-gray-400">Discover and manage yield opportunities across Solana</p>
          </div>
          <div className="flex items-center gap-4">
            {connected ? (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-[#9945FF]/20 text-[#9945FF] border-[#9945FF]/30">
                  {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                </Badge>
                <Button
                  onClick={disconnect}
                  variant="outline"
                  className="border-gray-600 hover:border-gray-500"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connect}
                className="bg-[#9945FF] hover:bg-[#9945FF]/90"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Value Locked</p>
                  <p className="text-2xl font-bold">{protocolStats.totalValueLocked}</p>
                </div>
                <DollarSign className="h-8 w-8 text-[#9945FF]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-400">{protocolStats.totalEarnings}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Positions</p>
                  <p className="text-2xl font-bold">{protocolStats.activePositions}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Average APY</p>
                  <p className="text-2xl font-bold">{protocolStats.averageAPY}%</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-gray-900/50 border border-gray-800">
            <TabsTrigger value="opportunities" className="data-[state=active]:bg-[#9945FF]">
              Yield Opportunities
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-[#9945FF]">
              My Portfolio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Available Opportunities</h2>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search protocols..."
                  className="w-64 bg-gray-900/50 border-gray-700"
                />
                <Button variant="outline" className="border-gray-600">
                  <Settings className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {yieldOpportunities.map((opportunity) => (
                <Card key={opportunity.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{opportunity.logo}</div>
                        <div>
                          <CardTitle className="text-lg">{opportunity.protocol}</CardTitle>
                          <p className="text-gray-400 text-sm">{opportunity.asset}</p>
                        </div>
                      </div>
                      <Badge className={cn("text-xs", getCategoryColor(opportunity.category))}>
                        {opportunity.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">APY</span>
                      <span className="text-xl font-bold text-green-400">{opportunity.apy}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">TVL</span>
                      <span className="font-semibold">{opportunity.tvl}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Risk</span>
                      <Badge className={cn("text-xs", getRiskColor(opportunity.risk))}>
                        {opportunity.risk}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedOpportunity(opportunity);
                        setShowDepositDialog(true);
                      }}
                      className="w-full bg-[#9945FF] hover:bg-[#9945FF]/90"
                      disabled={!connected}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Deposit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Positions</h2>
              <Button className="bg-[#9945FF] hover:bg-[#9945FF]/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Position