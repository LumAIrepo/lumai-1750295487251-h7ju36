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
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ChevronRight, User, Settings, Bell, Shield, Wallet, Eye, EyeOff, Copy, Check } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    marketUpdates: boolean;
    priceAlerts: boolean;
  };
  privacy: {
    showBalance: boolean;
    showActivity: boolean;
    publicProfile: boolean;
  };
  trading: {
    slippageTolerance: string;
    autoApprove: boolean;
    confirmTransactions: boolean;
  };
  display: {
    currency: string;
    language: string;
    theme: string;
  };
}

interface WalletInfo {
  address: string;
  balance: number;
  connected: boolean;
}

export default function SettingsPage() {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    address: '',
    balance: 0,
    connected: false
  });

  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: false,
      marketUpdates: true,
      priceAlerts: true
    },
    privacy: {
      showBalance: true,
      showActivity: false,
      publicProfile: false
    },
    trading: {
      slippageTolerance: '0.5',
      autoApprove: false,
      confirmTransactions: true
    },
    display: {
      currency: 'USD',
      language: 'English',
      theme: 'Dark'
    }
  });

  useEffect(() => {
    if (connected && publicKey) {
      setWalletInfo({
        address: publicKey.toString(),
        balance: 0,
        connected: true
      });
      fetchWalletBalance();
    } else {
      setWalletInfo({
        address: '',
        balance: 0,
        connected: false
      });
    }
  }, [connected, publicKey]);

  const fetchWalletBalance = async () => {
    if (!publicKey || !connection) return;
    
    try {
      const balance = await connection.getBalance(publicKey);
      setWalletInfo(prev => ({
        ...prev,
        balance: balance / 1e9
      }));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleSettingChange = (category: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    toast.success('Setting updated successfully');
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
      toast.success('Wallet disconnected');
    } catch (error) {
      toast.error('Failed to disconnect wallet');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-[#0F0F23] text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your wallet settings and preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-[#1A1A2E] border border-gray-800">
            <TabsTrigger value="general" className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
              General
            </TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
              Wallet
            </TabsTrigger>
            <TabsTrigger value="trading" className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
              Trading
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="bg-[#1A1A2E] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Email Notifications</Label>
                    <p className="text-sm text-gray-400">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'email', checked)}
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Push Notifications</Label>
                    <p className="text-sm text-gray-400">Browser push notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'push', checked)}
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Market Updates</Label>
                    <p className="text-sm text-gray-400">Get notified about market changes</p>
                  </div>
                  <Switch
                    checked={settings.notifications.marketUpdates}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'marketUpdates', checked)}
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Price Alerts</Label>
                    <p className="text-sm text-gray-400">Alerts for price movements</p>
                  </div>
                  <Switch
                    checked={settings.notifications.priceAlerts}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'priceAlerts', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A2E] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5" />
                  Display Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Currency</Label>
                    <Select
                      value={settings.display.currency}
                      onValueChange={(value) => handleSettingChange('display', 'currency', value)}
                    >
                      <SelectTrigger className="bg-[#0F0F23] border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A2E] border-gray-700">
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="SOL">SOL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Language</Label>
                    <Select
                      value={settings.display.language}
                      onValueChange={(value) => handleSettingChange('display', 'language', value)}
                    >
                      <SelectTrigger className="bg-[#0F0F23] border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A2E] border-gray-700">
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <Card className="bg-[#1A1A2E] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wallet className="h-5 w-5" />
                  Wallet Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {connected ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-[#0F0F23] rounded-xl border border-gray-800">
                      <div>
                        <Label className="text-white">Wallet Address</Label>
                        <p className="text-sm text-gray-400 font-mono">
                          {truncateAddress(walletInfo.address)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                          Connected
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(walletInfo.address)}
                          className="text-gray-400 hover:text-white"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#0F0F23] rounded-xl border border-gray-800">
                      <div>
                        <Label className="text-white">Balance</Label>
                        <p className="text-sm text-gray-400">
                          {walletInfo.balance.toFixed(4)} SOL
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleDisconnectWallet}
                      className="w-full"
                    >
                      Disconnect Wallet
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No wallet connected</p>
                    <p className="text-sm text-gray-500">Connect your wallet to view settings</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A2E] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Eye className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Show Balance</Label>
                    <p className="text-sm text-gray-400">Display wallet balance publicly</p>
                  </div>
                  <Switch
                    checked={settings.privacy.showBalance}
                    onCheckedChange={(checked) => handleSettingChange('privacy', 'showBalance', checked)}
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Show Activity</Label>
                    <p className="text-sm text-gray-400">Display trading activity</p>
                  </div>
                  <Switch
                    checked={settings.privacy.showActivity}
                    onCheckedChange={(checked) => handleSettingChange('privacy', 'showActivity', checked)}
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Public Profile</Label>
                    <p className="text-sm text-gray-400">Make profile visible to others</p>
                  </div>
                  <Switch
                    checked={settings.