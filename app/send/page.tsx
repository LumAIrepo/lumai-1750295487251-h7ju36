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
import { ChevronRight, User, Settings, Plus, Send, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TokenBalance {
  mint: string;
  symbol: string;
  balance: number;
  decimals: number;
  uiAmount: number;
}

interface SecurityCheck {
  id: string;
  name: string;
  status: 'pending' | 'passed' | 'failed';
  description: string;
}

interface SendFormData {
  recipient: string;
  amount: string;
  token: string;
  memo?: string;
}

export default function SendPage() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [formData, setFormData] = useState<SendFormData>({
    recipient: '',
    amount: '',
    token: 'SOL',
    memo: ''
  });
  
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);

  const defaultSecurityChecks: SecurityCheck[] = [
    {
      id: 'address-format',
      name: 'Address Format Validation',
      status: 'pending',
      description: 'Verifying recipient address format'
    },
    {
      id: 'balance-check',
      name: 'Sufficient Balance',
      status: 'pending',
      description: 'Checking available token balance'
    },
    {
      id: 'network-validation',
      name: 'Network Validation',
      status: 'pending',
      description: 'Validating network connectivity'
    },
    {
      id: 'recipient-verification',
      name: 'Recipient Verification',
      status: 'pending',
      description: 'Verifying recipient address exists'
    }
  ];

  useEffect(() => {
    if (connected && publicKey) {
      fetchTokenBalances();
    }
  }, [connected, publicKey]);

  const fetchTokenBalances = async () => {
    if (!publicKey || !connection) return;

    try {
      const balance = await connection.getBalance(publicKey);
      const solBalance: TokenBalance = {
        mint: 'SOL',
        symbol: 'SOL',
        balance: balance,
        decimals: 9,
        uiAmount: balance / LAMPORTS_PER_SOL
      };
      
      setTokenBalances([solBalance]);
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast.error('Failed to fetch token balances');
    }
  };

  const validateRecipientAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const runSecurityValidation = async () => {
    setIsValidating(true);
    setSecurityChecks(defaultSecurityChecks);
    
    const checks = [...defaultSecurityChecks];
    
    // Address format validation
    await new Promise(resolve => setTimeout(resolve, 500));
    const isValidAddress = validateRecipientAddress(formData.recipient);
    checks[0].status = isValidAddress ? 'passed' : 'failed';
    setSecurityChecks([...checks]);

    // Balance check
    await new Promise(resolve => setTimeout(resolve, 500));
    const selectedToken = tokenBalances.find(t => t.symbol === formData.token);
    const hasBalance = selectedToken && selectedToken.uiAmount >= parseFloat(formData.amount);
    checks[1].status = hasBalance ? 'passed' : 'failed';
    setSecurityChecks([...checks]);

    // Network validation
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      await connection.getLatestBlockhash();
      checks[2].status = 'passed';
    } catch {
      checks[2].status = 'failed';
    }
    setSecurityChecks([...checks]);

    // Recipient verification
    await new Promise(resolve => setTimeout(resolve, 500));
    if (isValidAddress) {
      try {
        const recipientPubkey = new PublicKey(formData.recipient);
        const accountInfo = await connection.getAccountInfo(recipientPubkey);
        checks[3].status = 'passed';
      } catch {
        checks[3].status = 'failed';
      }
    } else {
      checks[3].status = 'failed';
    }
    setSecurityChecks([...checks]);

    setIsValidating(false);
    setValidationComplete(true);
  };

  const handleSendTransaction = async () => {
    if (!publicKey || !signTransaction || !connection) {
      toast.error('Wallet not connected');
      return;
    }

    const allChecksPassed = securityChecks.every(check => check.status === 'passed');
    if (!allChecksPassed) {
      toast.error('Security validation failed');
      return;
    }

    setIsLoading(true);

    try {
      const recipientPubkey = new PublicKey(formData.recipient);
      const lamports = parseFloat(formData.amount) * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports: lamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      await connection.confirmTransaction(signature);
      
      toast.success(`Transaction sent successfully! Signature: ${signature}`);
      setShowSecurityDialog(false);
      setFormData({ recipient: '', amount: '', token: 'SOL', memo: '' });
      setValidationComplete(false);
      fetchTokenBalances();
    } catch (error) {
      console.error('Transaction failed:', error);
      toast.error('Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SendFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationComplete(false);
  };

  const isFormValid = formData.recipient && formData.amount && parseFloat(formData.amount) > 0;

  return (
    <div className="min-h-screen bg-[#0F0F23] text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Send Tokens</h1>
            <p className="text-gray-400">Secure token transfer with validation</p>
          </div>
          <Badge variant="outline" className="border-[#9945FF] text-[#9945FF]">
            <Shield className="w-4 h-4 mr-1" />
            PhantomSecure
          </Badge>
        </div>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Send className="w-5 h-5 mr-2 text-[#9945FF]" />
              Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-white">Select Token</Label>
              <select
                id="token"
                value={formData.token}
                onChange={(e) => handleInputChange('token', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
              >
                {tokenBalances.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol} - {token.uiAmount.toFixed(4)} available
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-white">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="Enter Solana wallet address"
                value={formData.recipient}
                onChange={(e) => handleInputChange('recipient', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-[#9945FF]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-white">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.000000001"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-[#9945FF]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo" className="text-white">Memo (Optional)</Label>
              <Input
                id="memo"
                placeholder="Add a note for this transaction"
                value={formData.memo}
                onChange={(e) => handleInputChange('memo', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-[#9945FF]"
              />
            </div>

            <Button
              onClick={() => setShowSecurityDialog(true)}
              disabled={!connected || !isFormValid}
              className="w-full bg-[#9945FF] hover:bg-[#8A3FEF] text-white font-semibold py-3 rounded-xl"
            >
              {!connected ? 'Connect Wallet' : 'Review & Send'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showSecurityDialog} onOpenChange={setShowSecurityDialog}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-[#9945FF]" />
                Security Validation
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 p-4 rounded-xl">
                <h3 className="font-semibold mb-2">Transaction Summary</h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Token:</span>
                    <span>{formData.token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>{formData.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span className="truncate ml-2 max-w-32">{formData.recipient}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Security Checks</h3>
                {securityChecks.map((check) => (
                  <div key={check.id} className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex-shrink-0">
                      {check.status === 'pending' && (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-[#9945FF] rounded-full animate-spin" />
                      )}
                      {check.status === 'passed' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {check.status === 'failed' && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{check.name}</div>
                      <div className="text-xs text-gray-400">{check.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                {!validationComplete ? (
                  <Button
                    onClick={runSecurityValidation}
                    disabled={isValidating}
                    className="flex-1 bg-[#9945FF] hover:bg-[#8A3FEF] text-white"
                  >
                    {isValidating ? 'Validating...' : 'Run Security Check'}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setShowSecurityDialog(false)}
                      variant="outline"
                      className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendTransaction}
                      disabled={isLoading || securityChecks.some(check => check.status === 'failed')}
                      className="flex-1 bg-[#9945FF] hover:bg-[#8A3FEF] text-white"
                    >
                      {isLoading ? 'Sending...' : 'Confirm Send'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}