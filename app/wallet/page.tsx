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
import { ChevronRight, User, Settings, Plus, Copy, ExternalLink, Wallet, RefreshCw } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface WalletAccount {
  publicKey: string;
  balance: number;
  name: string;
  isActive: boolean;
}

interface Transaction {
  signature: string;
  type: 'send' | 'receive' | 'stake' | 'swap';
  amount: number;
  timestamp: Date;
  status: 'confirmed' | 'pending' | 'failed';
}

export default function WalletPage() {
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAccountDialog, setShowAccountDialog] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newAccountName, setNewAccountName] = useState<string>('');

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
      fetchTransactions();
      loadAccounts();
    }
  }, [connected, publicKey, connection]);

  const fetchBalance = async () => {
    if (!publicKey || !connection) return;
    
    try {
      setIsLoading(true);
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to fetch wallet balance');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!publicKey || !connection) return;

    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
      const mockTransactions: Transaction[] = signatures.map((sig, index) => ({
        signature: sig.signature,
        type: ['send', 'receive', 'stake', 'swap'][index % 4] as Transaction['type'],
        amount: Math.random() * 10,
        timestamp: new Date(sig.blockTime ? sig.blockTime * 1000 : Date.now()),
        status: sig.err ? 'failed' : 'confirmed'
      }));
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const loadAccounts = () => {
    if (!publicKey) return;
    
    const currentAccount: WalletAccount = {
      publicKey: publicKey.toString(),
      balance: balance,
      name: 'Main Account',
      isActive: true
    };
    
    setAccounts([currentAccount]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const handleCreateAccount = () => {
    if (!newAccountName.trim()) {
      toast.error('Please enter an account name');
      return;
    }

    const newAccount: WalletAccount = {
      publicKey: PublicKey.unique().toString(),
      balance: 0,
      name: newAccountName,
      isActive: false
    };

    setAccounts(prev => [...prev, newAccount]);
    setNewAccountName('');
    setShowAccountDialog(false);
    toast.success('Account created successfully');
  };

  const switchAccount = (account: WalletAccount) => {
    setAccounts(prev => 
      prev.map(acc => ({
        ...acc,
        isActive: acc.publicKey === account.publicKey
      }))
    );
    toast.success(`Switched to ${account.name}`);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#1A1A2E] border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">Connect Wallet</CardTitle>
            <p className="text-gray-400">Connect your wallet to access PhantomSecure</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full bg-[#9945FF] hover:bg-[#8A3FE8] text-white"
              onClick={() => toast.info('Please use the wallet adapter to connect')}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F23] text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallet</h1>
            <p className="text-gray-400">Manage your accounts and transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBalance}
              disabled={isLoading}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAccountDialog(true)}
              className="bg-[#9945FF] hover:bg-[#8A3FE8]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <Card className="lg:col-span-2 bg-[#1A1A2E] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Account Balance</span>
                <Badge variant="secondary" className="bg-[#9945FF] text-white">
                  {wallet?.adapter.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold text-white">
                {formatAmount(balance)} SOL
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{formatAddress(publicKey?.toString() || '')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(publicKey?.toString() || '')}
                  className="h-6 w-6 p-0 hover:bg-gray-800"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex gap-3">
                <Button className="bg-[#9945FF] hover:bg-[#8A3FE8]">
                  Send
                </Button>
                <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                  Receive
                </Button>
                <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                  Swap
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Accounts */}
          <Card className="bg-[#1A1A2E] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.publicKey}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-colors",
                    account.isActive 
                      ? "border-[#9945FF] bg-[#9945FF]/10" 
                      : "border-gray-700 hover:border-gray-600"
                  )}
                  onClick={() => switchAccount(account)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{account.name}</div>
                      <div className="text-sm text-gray-400">
                        {formatAddress(account.publicKey)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {formatAmount(account.balance)} SOL
                      </div>
                      {account.isActive && (
                        <Badge variant="secondary" className="bg-[#9945FF] text-white text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card className="bg-[#1A1A2E] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#9945FF]">All</TabsTrigger>
                <TabsTrigger value="send" className="data-[state=active]:bg-[#9945FF]">Send</TabsTrigger>
                <TabsTrigger value="receive" className="data-[state=active]:bg-[#9945FF]">Receive</TabsTrigger>
                <TabsTrigger value="swap" className="data-[state=active]:bg-[#9945FF]">Swap</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-3 mt-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No transactions found
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.signature}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          tx.type === 'send' && "bg-red-500/20 text-red-400",
                          tx.type === 'receive' && "bg-green-500/20 text-green-400",
                          tx.type === 'swap' && "bg-blue-500/20 text-blue-400",
                          tx.type === 'stake' && "bg-purple-500/20 text-purple-400"
                        )}>
                          {tx.type === 'send' && '↗'}
                          {tx.type === 'receive' && '↙'}
                          {tx.type === 'swap' && '⇄'}
                          {tx.type === 'stake' && '⚡'}
                        </div>
                        <div>
                          <div className="font-medium text-white capitalize">{tx.type}</div>
                          <div className="text-sm text-gray-400">
                            {tx.timestamp.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "font-medium",
                          tx.type === 'send' ? "text-red-400" : "text-green-400"
                        )}>
                          {tx.type === 'send' ? '-' : '+'}{formatAmount(tx.amount)} SOL
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={tx.status === 'confirmed' ? 'default' : 'destructive'}
                            className={cn(
                              "text-xs",
                              tx.status === 'confirmed' && "bg-green-500/20 text-green-400"
                            )}
                          >
                            {tx.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-800"
                            onClick={() => window.open(`https://explorer.solana.com/tx/${tx.signature}`, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add Account Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="bg-[#1A1A2E] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountName" className="text-white">Account Name</Label>
              <Input
                id="accountName"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value