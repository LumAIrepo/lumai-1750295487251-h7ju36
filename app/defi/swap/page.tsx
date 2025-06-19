import React from "react"
```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, Settings, Plus, ArrowUpDown, Zap, TrendingUp } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Token {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logoURI: string;
  balance?: number;
}

interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  fee: number;
  route: string[];
}

interface PredictionMarket {
  id: string;
  title: string;
  description: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  endDate: Date;
  category: string;
  liquidity: number;
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
  },
  {
    symbol: 'RAY',
    name: 'Raydium',
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6,
    logoURI: '/tokens/ray.png'
  }
];

const PREDICTION_MARKETS: PredictionMarket[] = [
  {
    id: '1',
    title: 'Will SOL reach $300 by end of 2024?',
    description: 'Solana price prediction for end of year 2024',
    yesPrice: 0.65,
    noPrice: 0.35,
    volume: 125000,
    endDate: new Date('2024-12-31'),
    category: 'Crypto',
    liquidity: 50000
  },
  {
    id: '2',
    title: 'Will Bitcoin ETF approval happen in Q1 2024?',
    description: 'SEC approval of spot Bitcoin ETF in first quarter',
    yesPrice: 0.78,
    noPrice: 0.22,
    volume: 89000,
    endDate: new Date('2024-03-31'),
    category: 'Crypto',
    liquidity: 35000
  },
  {
    id: '3',
    title: 'Will Ethereum 2.0 staking rewards exceed 5%?',
    description: 'Annual staking rewards for ETH 2.0 validators',
    yesPrice: 0.42,
    noPrice: 0.58,
    volume: 67000,
    endDate: new Date('2024-06-30'),
    category: 'DeFi',
    liquidity: 28000
  }
];

export default function SwapPage() {
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [fromToken, setFromToken] = useState<Token>(POPULAR_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(POPULAR_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showTokenSelect, setShowTokenSelect] = useState<boolean>(false);
  const [selectingToken, setSelectingToken] = useState<'from' | 'to'>('from');
  const [activeTab, setActiveTab] = useState<string>('swap');
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');

  const fetchQuote = useCallback(async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null);
      setToAmount('');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate Jupiter API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockQuote: SwapQuote = {
        inputAmount: fromAmount,
        outputAmount: (parseFloat(fromAmount) * 0.98).toFixed(6),
        priceImpact: 0.1,
        fee: 0.0025,
        route: [fromToken.symbol, toToken.symbol]
      };
      
      setQuote(mockQuote);
      setToAmount(mockQuote.outputAmount);
    } catch (error) {
      toast.error('Failed to fetch quote');
      console.error('Quote error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fromAmount, fromToken, toToken]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchQuote();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [fetchQuote]);

  const handleSwap = async () => {
    if (!connected || !publicKey || !quote) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate swap transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Swap completed successfully!');
      setFromAmount('');
      setToAmount('');
      setQuote(null);
    } catch (error) {
      toast.error('Swap failed');
      console.error('Swap error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSwap = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleTokenSelect = (token: Token) => {
    if (selectingToken === 'from') {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowTokenSelect(false);
  };

  const handlePlaceBet = async () => {
    if (!connected || !publicKey || !selectedMarket || !betAmount) {
      toast.error('Please connect your wallet and enter bet amount');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate bet placement
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Bet placed: ${betAmount} SOL on ${betSide.toUpperCase()}`);
      setBetAmount('');
      setSelectedMarket(null);
    } catch (error) {
      toast.error('Failed to place bet');
      console.error('Bet error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F23] text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#9945FF] to-purple-400 bg-clip-text text-transparent">
            PhantomSecure DeFi
          </h1>
          <p className="text-gray-400">Trade tokens and predict market outcomes</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-gray-700">
            <TabsTrigger 
              value="swap" 
              className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white"
            >
              Token Swap
            </TabsTrigger>
            <TabsTrigger 
              value="predict" 
              className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white"
            >
              Prediction Markets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swap" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Swap Tokens</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(true)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">From</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectingToken('from');
                            setShowTokenSelect(true);
                          }}
                          className="flex items-center space-x-2 bg-gray-800 border-gray-600 hover:bg-gray-700"
                        >
                          <span>{fromToken.symbol}</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={fromAmount}
                          onChange={(e) => setFromAmount(e.target.value)}
                          className="flex-1 bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTokenSwap}
                        className="rounded-full bg-gray-800 hover:bg-gray-700 p-2"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">To</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectingToken('to');
                            setShowTokenSelect(true);
                          }}
                          className="flex items-center space-x-2 bg-gray-800 border-gray-600 hover:bg-gray-700"
                        >
                          <span>{toToken.symbol}</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={toAmount}
                          readOnly
                          className="flex-1 bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    {quote && (
                      <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Price Impact</span>
                          <span className={cn(
                            quote.priceImpact > 1 ? 'text-red-400' : 'text-green-400'
                          )}>
                            {quote.priceImpact.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Fee</span>
                          <span>{(quote.fee * 100).toFixed(3)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Route</span>
                          <span>{quote.route.join(' → ')}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSwap}
                      disabled={!connected || !quote || isLoading}
                      className="w-full bg-[#9945FF] hover:bg-purple-600 text-white font-semibold py-3"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Swapping...</span>
                        </div>
                      ) : !connected ? (
                        'Connect Wallet'
                      ) : !quote ? (
                        'Enter Amount'
                      ) : (
                        'Swap'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-[#9945FF]" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-