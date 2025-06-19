import React from "react"
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, User, Settings, Plus, Trash2, Shield, Key, Users } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Signer {
  id: string
  address: string
  name: string
  isOwner: boolean
}

interface MultiSigConfig {
  threshold: number
  signers: Signer[]
  totalSigners: number
}

interface MultiSigSetupProps {
  onConfigChange?: (config: MultiSigConfig) => void
  initialConfig?: MultiSigConfig
  className?: string
}

export default function MultiSigSetup({ onConfigChange, initialConfig, className }: MultiSigSetupProps) {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  
  const [config, setConfig] = useState<MultiSigConfig>({
    threshold: 2,
    signers: [],
    totalSigners: 0
  })
  
  const [newSignerAddress, setNewSignerAddress] = useState('')
  const [newSignerName, setNewSignerName] = useState('')
  const [isAddingSigner, setIsAddingSigner] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig)
    } else if (connected && publicKey) {
      setConfig(prev => ({
        ...prev,
        signers: [{
          id: '1',
          address: publicKey.toString(),
          name: 'Owner (You)',
          isOwner: true
        }],
        totalSigners: 1
      }))
    }
  }, [initialConfig, connected, publicKey])

  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config)
    }
  }, [config, onConfigChange])

  const validateAddress = (address: string): boolean => {
    try {
      new PublicKey(address)
      return true
    } catch {
      return false
    }
  }

  const addSigner = async () => {
    if (!newSignerAddress.trim() || !newSignerName.trim()) {
      toast.error('Please enter both address and name')
      return
    }

    if (!validateAddress(newSignerAddress)) {
      toast.error('Invalid Solana address')
      return
    }

    if (config.signers.some(s => s.address === newSignerAddress)) {
      toast.error('Signer already exists')
      return
    }

    setIsLoading(true)
    
    try {
      const newSigner: Signer = {
        id: Date.now().toString(),
        address: newSignerAddress,
        name: newSignerName,
        isOwner: false
      }

      setConfig(prev => ({
        ...prev,
        signers: [...prev.signers, newSigner],
        totalSigners: prev.totalSigners + 1
      }))

      setNewSignerAddress('')
      setNewSignerName('')
      setIsAddingSigner(false)
      toast.success('Signer added successfully')
    } catch (error) {
      toast.error('Failed to add signer')
    } finally {
      setIsLoading(false)
    }
  }

  const removeSigner = (signerId: string) => {
    const signer = config.signers.find(s => s.id === signerId)
    if (signer?.isOwner) {
      toast.error('Cannot remove owner')
      return
    }

    setConfig(prev => ({
      ...prev,
      signers: prev.signers.filter(s => s.id !== signerId),
      totalSigners: prev.totalSigners - 1,
      threshold: Math.min(prev.threshold, prev.totalSigners - 1)
    }))
    
    toast.success('Signer removed')
  }

  const updateThreshold = (newThreshold: number) => {
    if (newThreshold < 1 || newThreshold > config.totalSigners) {
      toast.error(`Threshold must be between 1 and ${config.totalSigners}`)
      return
    }

    setConfig(prev => ({
      ...prev,
      threshold: newThreshold
    }))
  }

  const deployMultiSig = async () => {
    if (!connected) {
      toast.error('Please connect your wallet')
      return
    }

    if (config.signers.length < 2) {
      toast.error('At least 2 signers required')
      return
    }

    setIsLoading(true)
    
    try {
      // Simulate multisig deployment
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Multi-signature wallet deployed successfully')
      setIsDialogOpen(false)
    } catch (error) {
      toast.error('Failed to deploy multi-signature wallet')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="bg-[#0F0F23] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#9945FF]" />
            Multi-Signature Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="signers" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="signers" className="text-white data-[state=active]:bg-[#9945FF]">
                Signers
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-white data-[state=active]:bg-[#9945FF]">
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signers" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#9945FF]" />
                  <span className="text-white font-medium">
                    Signers ({config.totalSigners})
                  </span>
                </div>
                <Button
                  onClick={() => setIsAddingSigner(true)}
                  size="sm"
                  className="bg-[#9945FF] hover:bg-[#8A3FEF] text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Signer
                </Button>
              </div>

              <div className="space-y-3">
                {config.signers.map((signer) => (
                  <div
                    key={signer.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-[#9945FF] rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{signer.name}</span>
                          {signer.isOwner && (
                            <Badge className="bg-[#9945FF] text-white text-xs">
                              Owner
                            </Badge>
                          )}
                        </div>
                        <span className="text-gray-400 text-sm font-mono">
                          {signer.address.slice(0, 8)}...{signer.address.slice(-8)}
                        </span>
                      </div>
                    </div>
                    {!signer.isOwner && (
                      <Button
                        onClick={() => removeSigner(signer.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {isAddingSigner && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signer-name" className="text-white">
                        Signer Name
                      </Label>
                      <Input
                        id="signer-name"
                        value={newSignerName}
                        onChange={(e) => setNewSignerName(e.target.value)}
                        placeholder="Enter signer name"
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signer-address" className="text-white">
                        Wallet Address
                      </Label>
                      <Input
                        id="signer-address"
                        value={newSignerAddress}
                        onChange={(e) => setNewSignerAddress(e.target.value)}
                        placeholder="Enter Solana wallet address"
                        className="bg-gray-900 border-gray-600 text-white font-mono"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={addSigner}
                        disabled={isLoading}
                        className="bg-[#9945FF] hover:bg-[#8A3FEF] text-white"
                      >
                        Add Signer
                      </Button>
                      <Button
                        onClick={() => {
                          setIsAddingSigner(false)
                          setNewSignerAddress('')
                          setNewSignerName('')
                        }}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#9945FF]" />
                  <span className="text-white font-medium">Signature Threshold</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="threshold" className="text-white">
                    Required Signatures ({config.threshold} of {config.totalSigners})
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="threshold"
                      type="number"
                      min={1}
                      max={config.totalSigners}
                      value={config.threshold}
                      onChange={(e) => updateThreshold(parseInt(e.target.value))}
                      className="bg-gray-900 border-gray-600 text-white w-24"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-400">
                        {config.threshold} out of {config.totalSigners} signatures required to execute transactions
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-xl">
                  <h4 className="text-white font-medium mb-2">Security Level</h4>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-2 w-full rounded-full",
                      config.threshold / config.totalSigners >= 0.7 ? "bg-green-500" :
                      config.threshold / config.totalSigners >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      config.threshold / config.totalSigners >= 0.7 ? "text-green-400" :
                      config.threshold / config.totalSigners >= 0.5 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {config.threshold / config.totalSigners >= 0.7 ? "High" :
                       config.threshold / config.totalSigners >= 0.5 ? "Medium" : "Low"}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3">
            <Button
              onClick={() => setIsDialogOpen(true)}
              disabled={config.signers.length < 2 || !connected}
              className="bg-[#9945FF] hover:bg-[#8A3FEF] text-white flex-1"
            >
              Deploy Multi-Sig Wallet
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0F0F23] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Deploy Multi-Signature Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Signers:</span>
                <span className="text-white">{config.totalSigners}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Required Signatures:</span>
                <span className="text-white">{config.threshold}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Security Level:</span>
                <span className={cn(
                  "font-medium",
                  config.threshold / config.totalSigners >= 0.7 ? "text-green-400" :
                  config.threshold / config.totalSigners >= 0.5 ? "text