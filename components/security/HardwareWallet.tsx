import React from "react"
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, Settings, Plus, Shield, Usb, Bluetooth, Wifi } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface HardwareWalletDevice {
  id: string
  name: string
  type: 'ledger' | 'trezor' | 'keystone'
  status: 'connected' | 'disconnected' | 'connecting'
  address?: string
  balance?: number
  connectionType: 'usb' | 'bluetooth' | 'qr'
}

interface HardwareWalletProps {
  onDeviceConnect?: (device: HardwareWalletDevice) => void
  onDeviceDisconnect?: (deviceId: string) => void
  className?: string
}

export default function HardwareWallet({ 
  onDeviceConnect, 
  onDeviceDisconnect, 
  className 
}: HardwareWalletProps) {
  const [devices, setDevices] = useState<HardwareWalletDevice[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<HardwareWalletDevice | null>(null)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('devices')
  
  const { wallet, connect, disconnect, connected } = useWallet()
  const { connection } = useConnection()

  useEffect(() => {
    // Initialize with mock devices for demo
    const mockDevices: HardwareWalletDevice[] = [
      {
        id: '1',
        name: 'Ledger Nano X',
        type: 'ledger',
        status: 'connected',
        address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        balance: 12.45,
        connectionType: 'usb'
      },
      {
        id: '2',
        name: 'Trezor Model T',
        type: 'trezor',
        status: 'disconnected',
        connectionType: 'usb'
      }
    ]
    setDevices(mockDevices)
  }, [])

  const handleScanDevices = async () => {
    setIsScanning(true)
    try {
      // Simulate device scanning
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newDevice: HardwareWalletDevice = {
        id: Date.now().toString(),
        name: 'Keystone Pro',
        type: 'keystone',
        status: 'disconnected',
        connectionType: 'qr'
      }
      
      setDevices(prev => [...prev, newDevice])
      toast.success('New device found!')
    } catch (error) {
      toast.error('Failed to scan for devices')
    } finally {
      setIsScanning(false)
    }
  }

  const handleConnectDevice = async (device: HardwareWalletDevice) => {
    try {
      setDevices(prev => 
        prev.map(d => 
          d.id === device.id 
            ? { ...d, status: 'connecting' }
            : d
        )
      )

      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1500))

      const connectedDevice: HardwareWalletDevice = {
        ...device,
        status: 'connected',
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        balance: Math.random() * 100
      }

      setDevices(prev => 
        prev.map(d => 
          d.id === device.id ? connectedDevice : d
        )
      )

      onDeviceConnect?.(connectedDevice)
      toast.success(`${device.name} connected successfully`)
    } catch (error) {
      setDevices(prev => 
        prev.map(d => 
          d.id === device.id 
            ? { ...d, status: 'disconnected' }
            : d
        )
      )
      toast.error(`Failed to connect ${device.name}`)
    }
  }

  const handleDisconnectDevice = async (device: HardwareWalletDevice) => {
    try {
      setDevices(prev => 
        prev.map(d => 
          d.id === device.id 
            ? { ...d, status: 'disconnected', address: undefined, balance: undefined }
            : d
        )
      )

      onDeviceDisconnect?.(device.id)
      toast.success(`${device.name} disconnected`)
    } catch (error) {
      toast.error(`Failed to disconnect ${device.name}`)
    }
  }

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'usb':
        return <Usb className="h-4 w-4" />
      case 'bluetooth':
        return <Bluetooth className="h-4 w-4" />
      case 'qr':
        return <Wifi className="h-4 w-4" />
      default:
        return <Usb className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Connecting...</Badge>
      case 'disconnected':
        return <Badge variant="outline" className="border-gray-600 text-gray-400">Disconnected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="bg-[#0F0F23] border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-[#9945FF]" />
            <CardTitle className="text-white">Hardware Wallets</CardTitle>
          </div>
          <Button
            onClick={handleScanDevices}
            disabled={isScanning}
            size="sm"
            className="bg-[#9945FF] hover:bg-[#8A3FEF] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isScanning ? 'Scanning...' : 'Scan Devices'}
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
              <TabsTrigger value="devices" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-[#9945FF]">
                Devices
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-[#9945FF]">
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="devices" className="space-y-4 mt-6">
              {devices.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hardware wallets found</p>
                  <p className="text-sm">Click "Scan Devices" to search for connected wallets</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <Card key={device.id} className="bg-gray-800/30 border-gray-700 hover:border-[#9945FF]/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {getConnectionIcon(device.connectionType)}
                              <div>
                                <h3 className="font-medium text-white">{device.name}</h3>
                                <p className="text-sm text-gray-400 capitalize">{device.type}</p>
                              </div>
                            </div>
                            {getStatusBadge(device.status)}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {device.status === 'connected' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDevice(device)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {device.status === 'disconnected' ? (
                              <Button
                                onClick={() => handleConnectDevice(device)}
                                size="sm"
                                className="bg-[#9945FF] hover:bg-[#8A3FEF] text-white"
                              >
                                Connect
                              </Button>
                            ) : device.status === 'connected' ? (
                              <Button
                                onClick={() => handleDisconnectDevice(device)}
                                variant="outline"
                                size="sm"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              >
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                disabled
                                size="sm"
                                className="bg-gray-600 text-gray-400"
                              >
                                Connecting...
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {device.status === 'connected' && device.address && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">Address:</span>
                              <span className="text-white font-mono text-xs">
                                {device.address.slice(0, 8)}...{device.address.slice(-8)}
                              </span>
                            </div>
                            {device.balance !== undefined && (
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-gray-400">Balance:</span>
                                <span className="text-white">{device.balance.toFixed(4)} SOL</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4 mt-6">
              <Card className="bg-gray-800/30 border-gray-700">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">Auto-connect</h3>
                        <p className="text-sm text-gray-400">Automatically connect to known devices</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-600">
                        Enable
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">Connection timeout</h3>
                        <p className="text-sm text-gray-400">Timeout for device connections</p>
                      </div>
                      <span className="text-sm text-gray-300">30 seconds</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">Security level</h3>
                        <p className="text-sm text-gray-400">Hardware wallet security requirements</p>
                      </div>
                      <Badge className="bg-[#9945FF]/20 text-[#9945FF] border-[#9945FF]/30">
                        High
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDevice} onOpenChange={() => setSelectedDevice(null)}>
        <DialogContent className="bg-[#0F0F23] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-[#9945FF]" />
              <span>{selectedDevice?.name} Settings</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedDevice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Device Type:</span>
                  <p className="text-white capitalize">{selectedDevice.type}</p>
                </div>
                <div>
                  <span className="text-gray-400">Connection:</span>
                  <p className="text-white capitalize">{selectedDevice.connectionType}</p>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <p className="text-white capitalize">{selectedDevice.status}</p>
                </div>
                <div>
                  <span className="text-gray-400">Balance:</span>
                  <p className="text-white">{selectedDevice.balance?.toFixed(4) || '0.0000'} SOL</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleDisconnectDevice(selectedDevice)}
                    variant="outline"
                    className="flex-1 border