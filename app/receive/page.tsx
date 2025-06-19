import React from "react"
```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, QrCode, Share2, Download, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface QRCodeOptions {
  size: number
  margin: number
  color: {
    dark: string
    light: string
  }
}

interface ReceiveRequest {
  address: string
  amount?: number
  token?: string
  label?: string
  message?: string
}

export default function ReceivePage() {
  const { publicKey, connected } = useWallet()
  const [amount, setAmount] = useState<string>('')
  const [token, setToken] = useState<string>('SOL')
  const [label, setLabel] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateQRCode = async (data: string, options: QRCodeOptions): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current
      if (!canvas) {
        resolve('')
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      const size = options.size
      const margin = options.margin
      const cellSize = Math.floor((size - 2 * margin) / 25)
      const actualSize = 25 * cellSize + 2 * margin

      canvas.width = actualSize
      canvas.height = actualSize

      ctx.fillStyle = options.color.light
      ctx.fillRect(0, 0, actualSize, actualSize)

      ctx.fillStyle = options.color.dark

      const pattern = generateQRPattern(data)
      for (let row = 0; row < 25; row++) {
        for (let col = 0; col < 25; col++) {
          if (pattern[row][col]) {
            ctx.fillRect(
              margin + col * cellSize,
              margin + row * cellSize,
              cellSize,
              cellSize
            )
          }
        }
      }

      resolve(canvas.toDataURL())
    })
  }

  const generateQRPattern = (data: string): boolean[][] => {
    const size = 25
    const pattern: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false))
    
    const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        pattern[i][j] = ((i + j + hash) % 3) === 0
      }
    }

    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        pattern[i][j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4))
        pattern[i][size - 1 - j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4))
        pattern[size - 1 - i][j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4))
      }
    }

    return pattern
  }

  const generateReceiveUrl = (): string => {
    if (!publicKey) return ''

    const baseUrl = 'solana:'
    const params = new URLSearchParams()
    
    params.append('recipient', publicKey.toString())
    
    if (amount && parseFloat(amount) > 0) {
      params.append('amount', amount)
    }
    
    if (token && token !== 'SOL') {
      params.append('spl-token', token)
    }
    
    if (label) {
      params.append('label', label)
    }
    
    if (message) {
      params.append('message', message)
    }

    return `${baseUrl}${publicKey.toString()}?${params.toString()}`
  }

  const handleGenerateQR = async (): Promise<void> => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }

    setIsGenerating(true)
    
    try {
      const url = generateReceiveUrl()
      const qrOptions: QRCodeOptions = {
        size: 300,
        margin: 20,
        color: {
          dark: '#9945FF',
          light: '#FFFFFF'
        }
      }
      
      const qrUrl = await generateQRCode(url, qrOptions)
      setQrCodeUrl(qrUrl)
      toast.success('QR code generated successfully')
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const downloadQRCode = (): void => {
    if (!qrCodeUrl) return

    const link = document.createElement('a')
    link.download = `phantomsecure-receive-${publicKey?.toString().slice(0, 8)}.png`
    link.href = qrCodeUrl
    link.click()
    toast.success('QR code downloaded')
  }

  const shareReceiveUrl = async (): Promise<void> => {
    const url = generateReceiveUrl()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PhantomSecure - Receive Payment',
          text: 'Send me tokens using this address',
          url: url
        })
      } catch (error) {
        console.error('Error sharing:', error)
        await copyToClipboard(url)
      }
    } else {
      await copyToClipboard(url)
    }
  }

  useEffect(() => {
    if (connected && publicKey && !qrCodeUrl) {
      handleGenerateQR()
    }
  }, [connected, publicKey])

  if (!connected) {
    return (
      <div className="min-h-screen bg-[#0F0F23] text-white p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="bg-[#1A1A2E] border-[#9945FF]/20">
            <CardContent className="p-8 text-center">
              <Wallet className="w-16 h-16 text-[#9945FF] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">
                Please connect your wallet to generate a receive address and QR code.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F23] text-white p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Receive Tokens</h1>
          <p className="text-gray-400">
            Generate a QR code and share your address to receive payments
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="bg-[#1A1A2E] border-[#9945FF]/20">
              <CardHeader>
                <CardTitle className="text-[#9945FF]">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (Optional)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-[#0F0F23] border-[#9945FF]/30 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="token">Token</Label>
                  <select
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#0F0F23] border border-[#9945FF]/30 text-white"
                  >
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="label">Label (Optional)</Label>
                  <Input
                    id="label"
                    placeholder="Payment for..."
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="bg-[#0F0F23] border-[#9945FF]/30 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Input
                    id="message"
                    placeholder="Additional message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-[#0F0F23] border-[#9945FF]/30 text-white"
                  />
                </div>

                <Button
                  onClick={handleGenerateQR}
                  disabled={isGenerating}
                  className="w-full bg-[#9945FF] hover:bg-[#9945FF]/80"
                >
                  {isGenerating ? 'Generating...' : 'Update QR Code'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A2E] border-[#9945FF]/20">
              <CardHeader>
                <CardTitle className="text-[#9945FF]">Your Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-3 bg-[#0F0F23] rounded-lg">
                  <code className="flex-1 text-sm text-gray-300 break-all">
                    {publicKey?.toString()}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(publicKey?.toString() || '')}
                    className="text-[#9945FF] hover:bg-[#9945FF]/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-[#1A1A2E] border-[#9945FF]/20">
              <CardHeader>
                <CardTitle className="text-[#9945FF] flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {qrCodeUrl ? (
                    <div className="space-y-4">
                      <div className="inline-block p-4 bg-white rounded-xl">
                        <img
                          src={qrCodeUrl}
                          alt="Payment QR Code"
                          className="w-64 h-64 mx-auto"
                        />
                      </div>
                      
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={downloadQRCode}
                          className="border-[#9945FF]/30 text-[#9945FF] hover:bg-[#9945FF]/10"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={shareReceiveUrl}
                          className="border-[#9945FF]/30 text-[#9945FF] hover:bg-[#9945FF]/10"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16">
                      <QrCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">QR code will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {(amount || label || message) && (
              <Card className="bg-[#1A1A2E] border-[#9945FF]/20">
                <CardHeader>
                  <CardTitle className="text-[#9945FF]">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <Badge variant="secondary" className="bg-[#9945FF]/20 text-[#9945FF]">
                        {amount} {token}
                      </Badge>
                    </div>
                  )}
                  {label && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Label:</span>
                      <span className="text-white">{label}</span>
                    </div>
                  )}
                  {message && (
                    <div className="flex justify-between">