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
import { ChevronRight, User, Settings, Plus, Shield, Key, Lock, AlertTriangle, Check, X } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MultiSigWallet {
  id: string
  name: string
  address: string
  threshold: number
  signers: string[]
  status: 'active' | 'pending' | 'inactive'
  createdAt: Date
}

interface SecuritySetting {
  id: string
  name: string
  description: string
  enabled: boolean
  level: 'low' | 'medium' | 'high'
}

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  lastUsed: Date
  status: 'active' | 'revoked'
}

export default function SecurityPage() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateMultiSig, setShowCreateMultiSig] = useState(false)
  const [showCreateApiKey, setShowCreateApiKey] = useState(false)
  
  const [multiSigWallets, setMultiSigWallets] = useState<MultiSigWallet[]>([
    {
      id: '1',
      name: 'Trading Wallet',
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      threshold: 2,
      signers: ['7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'],
      status: 'active',
      createdAt: new Date('2024-01-15')
    }
  ])
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([
    {
      id: '1',
      name: 'Two-Factor Authentication',
      description: 'Require 2FA for all transactions',
      enabled: true,
      level: 'high'
    },
    {
      id: '2',
      name: 'Transaction Limits',
      description: 'Set daily transaction limits',
      enabled: true,
      level: 'medium'
    },
    {
      id: '3',
      name: 'IP Whitelisting',
      description: 'Restrict access to specific IP addresses',
      enabled: false,
      level: 'high'
    },
    {
      id: '4',
      name: 'Session Timeout',
      description: 'Auto-logout after inactivity',
      enabled: true,
      level: 'low'
    }
  ])
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Trading Bot',
      key: 'pk_live_51H...',
      permissions: ['read', 'trade'],
      lastUsed: new Date('2024-01-20'),
      status: 'active'
    }
  ])
  
  const [newMultiSig, setNewMultiSig] = useState({
    name: '',
    threshold: 2,
    signers: ['']
  })
  
  const [newApiKey, setNewApiKey] = useState({
    name: '',
    permissions: [] as string[]
  })

  const handleCreateMultiSig = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(true)
    try {
      // Simulate multi-sig creation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newWallet: MultiSigWallet = {
        id: Date.now().toString(),
        name: newMultiSig.name,
        address: PublicKey.unique().toString(),
        threshold: newMultiSig.threshold,
        signers: newMultiSig.signers.filter(s => s.trim() !== ''),
        status: 'pending',
        createdAt: new Date()
      }
      
      setMultiSigWallets(prev => [...prev, newWallet])
      setShowCreateMultiSig(false)
      setNewMultiSig({ name: '', threshold: 2, signers: [''] })
      toast.success('Multi-sig wallet created successfully')
    } catch (error) {
      toast.error('Failed to create multi-sig wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateApiKey = async () => {
    if (!connected) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newApiKey.name,
        key: `pk_live_${Math.random().toString(36).substring(2, 15)}`,
        permissions: newApiKey.permissions,
        lastUsed: new Date(),
        status: 'active'
      }
      
      setApiKeys(prev => [...prev, newKey])
      setShowCreateApiKey(false)
      setNewApiKey({ name: '', permissions: [] })
      toast.success('API key created successfully')
    } catch (error) {
      toast.error('Failed to create API key')
    } finally {
      setLoading(false)
    }
  }

  const toggleSecuritySetting = (id: string) => {
    setSecuritySettings(prev => 
      prev.map(setting => 
        setting.id === id 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    )
  }

  const revokeApiKey = (id: string) => {
    setApiKeys(prev => 
      prev.map(key => 
        key.id === id 
          ? { ...key, status: 'revoked' as const }
          : key
      )
    )
    toast.success('API key revoked')
  }

  const addSignerField = () => {
    setNewMultiSig(prev => ({
      ...prev,
      signers: [...prev.signers, '']
    }))
  }

  const updateSigner = (index: number, value: string) => {
    setNewMultiSig(prev => ({
      ...prev,
      signers: prev.signers.map((signer, i) => i === index ? value : signer)
    }))
  }

  const removeSigner = (index: number) => {
    setNewMultiSig(prev => ({
      ...prev,
      signers: prev.signers.filter((_, i) => i !== index)
    }))
  }

  const togglePermission = (permission: string) => {
    setNewApiKey(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'inactive':
      case 'revoked': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F23] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Center</h1>
          <p className="text-gray-400">Manage your security settings and multi-signature wallets</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#1A1A2E] border border-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="multisig" className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
              Multi-Sig
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
              Settings
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#1A1A2E] border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#9945FF]" />
                    Security Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#9945FF] mb-2">85/100</div>
                  <p className="text-sm text-gray-400">Good security posture</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A2E] border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5 text-[#9945FF]" />
                    Multi-Sig Wallets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#9945FF] mb-2">{multiSigWallets.length}</div>
                  <p className="text-sm text-gray-400">Active wallets</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A2E] border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[#9945FF]" />
                    API Keys
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#9945FF] mb-2">
                    {apiKeys.filter(key => key.status === 'active').length}
                  </div>
                  <p className="text-sm text-gray-400">Active keys</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#1A1A2E] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  Security Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div>
                    <h4 className="font-medium text-yellow-400">Enable IP Whitelisting</h4>
                    <p className="text-sm text-gray-400">Restrict access to trusted IP addresses</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-[#9945FF] hover:bg-[#8A3FEF]"
                    onClick={() => setActiveTab('settings')}
                  >
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div>
                    <h4 className="font-medium text-blue-400">Create Backup Multi-Sig</h4>
                    <p className="text-sm text-gray-400">Set up a backup multi-signature wallet</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-[#9945FF] hover:bg-[#8A3FEF]"
                    onClick={() => setActiveTab('multisig')}
                  >
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="multisig" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Multi-Signature Wallets</h2>
              <Button 
                onClick={() => setShowCreateMultiSig(true)}
                className="bg-[#9945FF] hover:bg-[#8A3FEF]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Multi-Sig
              </Button>
            </div>

            <div className="grid gap-6">
              {multiSigWallets.map((wallet) => (
                <Card key={wallet.