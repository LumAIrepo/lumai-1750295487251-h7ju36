import React from "react"
```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Shield, Clock, DollarSign, TrendingUp, TrendingDown, Eye, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SecurityAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  score: number
  warnings: string[]
  recommendations: string[]
}

interface TransactionDetails {
  id: string
  type: 'bet' | 'withdraw' | 'deposit' | 'claim'
  amount: number
  token: string
  marketTitle: string
  outcome: string
  odds: number
  potentialPayout: number
  fee: number
  timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
}

interface TransactionPreviewProps {
  transaction: TransactionDetails
  securityAnalysis: SecurityAnalysis
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function TransactionPreview({
  transaction,
  securityAnalysis,
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  isLoading = false
}: TransactionPreviewProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'bet': return <TrendingUp className="h-5 w-5" />
      case 'withdraw': return <TrendingDown className="h-5 w-5" />
      case 'deposit': return <DollarSign className="h-5 w-5" />
      case 'claim': return <TrendingUp className="h-5 w-5" />
      default: return <DollarSign className="h-5 w-5" />
    }
  }

  const handleConfirm = () => {
    if (securityAnalysis.riskLevel === 'critical') {
      toast.error('Transaction blocked due to critical security risk')
      return
    }
    onConfirm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0F0F23] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            {getTransactionIcon(transaction.type)}
            Transaction Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Analysis */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-[#9945FF]" />
                Security Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Risk Level</span>
                <Badge className={cn('border', getRiskColor(securityAnalysis.riskLevel))}>
                  {securityAnalysis.riskLevel.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Security Score</span>
                <span className="font-mono text-lg">{securityAnalysis.score}/100</span>
              </div>

              {securityAnalysis.warnings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Warnings</span>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-300 ml-6">
                    {securityAnalysis.warnings.map((warning, index) => (
                      <li key={index} className="list-disc">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {securityAnalysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Recommendations</span>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-300 ml-6">
                    {securityAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="list-disc">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#9945FF]" />
                  Transaction Details
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-gray-400 hover:text-white"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showDetails ? 'Hide' : 'Show'} Details
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Type</span>
                  <p className="font-medium capitalize">{transaction.type}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Amount</span>
                  <p className="font-medium">{transaction.amount} {transaction.token}</p>
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Market</span>
                <p className="font-medium">{transaction.marketTitle}</p>
              </div>

              {transaction.type === 'bet' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm">Outcome</span>
                      <p className="font-medium">{transaction.outcome}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Odds</span>
                      <p className="font-medium">{transaction.odds.toFixed(2)}x</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm">Potential Payout</span>
                      <p className="font-medium text-green-400">
                        {transaction.potentialPayout} {transaction.token}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Fee</span>
                      <p className="font-medium">{transaction.fee} {transaction.token}</p>
                    </div>
                  </div>
                </>
              )}

              {showDetails && (
                <div className="pt-4 border-t border-gray-800 space-y-3">
                  <div>
                    <span className="text-gray-400 text-sm">Transaction ID</span>
                    <p className="font-mono text-sm break-all">{transaction.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Timestamp</span>
                    <p className="text-sm">{transaction.timestamp.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Status</span>
                    <Badge variant="outline" className="ml-2">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 border-gray-700 hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || securityAnalysis.riskLevel === 'critical'}
              className={cn(
                "flex-1 bg-[#9945FF] hover:bg-[#8A3FEF] text-white",
                securityAnalysis.riskLevel === 'critical' && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {securityAnalysis.riskLevel === 'critical' ? 'Blocked' : 'Confirm Transaction'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```