import React from "react"
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TokenBalanceProps {
  symbol: string
  balance: number
  price?: number
  priceChange24h?: number
  decimals?: number
  className?: string
  showPrice?: boolean
  showPriceChange?: boolean
}

interface PriceData {
  price: number
  change24h: number
  lastUpdated: number
}

export default function TokenBalance({
  symbol,
  balance,
  price,
  priceChange24h,
  decimals = 6,
  className,
  showPrice = true,
  showPriceChange = true
}: TokenBalanceProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (price !== undefined && priceChange24h !== undefined) {
      setPriceData({
        price,
        change24h: priceChange24h,
        lastUpdated: Date.now()
      })
    }
  }, [price, priceChange24h])

  const formatBalance = (balance: number, decimals: number): string => {
    if (balance === 0) return '0'
    if (balance < 0.000001) return '< 0.000001'
    return balance.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    })
  }

  const formatPrice = (price: number): string => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`
    }
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const formatPriceChange = (change: number): string => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  const getPriceChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    if (change < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const totalValue = priceData ? balance * priceData.price : 0

  return (
    <Card className={cn(
      "bg-[#0F0F23] border-gray-800 text-white",
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="text-gray-400">Balance</span>
          <Badge 
            variant="outline" 
            className="border-[#9945FF] text-[#9945FF] bg-[#9945FF]/10"
          >
            {symbol}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="text-2xl font-bold text-white">
            {formatBalance(balance, decimals)}
          </div>
          <div className="text-sm text-gray-400">
            {symbol} Balance
          </div>
        </div>

        {showPrice && priceData && (
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Price</span>
              <span className="text-sm font-medium text-white">
                {formatPrice(priceData.price)}
              </span>
            </div>
            
            {showPriceChange && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">24h Change</span>
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  getPriceChangeColor(priceData.change24h)
                )}>
                  {getPriceChangeIcon(priceData.change24h)}
                  {formatPriceChange(priceData.change24h)}
                </div>
              </div>
            )}

            {totalValue > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-sm text-gray-400">Total Value</span>
                <span className="text-sm font-bold text-[#9945FF]">
                  {formatPrice(totalValue)}
                </span>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9945FF]"></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```