import React from "react"
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Fingerprint, Shield, Eye, Smartphone, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface BiometricAuthProps {
  onAuthSuccess?: (method: BiometricMethod) => void
  onAuthFailure?: (error: string) => void
  requiredMethods?: BiometricMethod[]
  className?: string
  showDialog?: boolean
  onDialogClose?: () => void
}

type BiometricMethod = 'fingerprint' | 'face' | 'voice' | 'device'

interface BiometricCapability {
  method: BiometricMethod
  available: boolean
  enrolled: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
}

interface AuthenticationResult {
  success: boolean
  method: BiometricMethod
  timestamp: number
  error?: string
}

export default function BiometricAuth({
  onAuthSuccess,
  onAuthFailure,
  requiredMethods = ['fingerprint'],
  className,
  showDialog = false,
  onDialogClose
}: BiometricAuthProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [capabilities, setCapabilities] = useState<BiometricCapability[]>([])
  const [authResults, setAuthResults] = useState<AuthenticationResult[]>([])
  const [selectedMethod, setSelectedMethod] = useState<BiometricMethod | null>(null)

  const biometricMethods: BiometricCapability[] = [
    {
      method: 'fingerprint',
      available: false,
      enrolled: false,
      icon: Fingerprint,
      label: 'Fingerprint',
      description: 'Use your fingerprint to authenticate'
    },
    {
      method: 'face',
      available: false,
      enrolled: false,
      icon: Eye,
      label: 'Face Recognition',
      description: 'Use facial recognition to authenticate'
    },
    {
      method: 'device',
      available: false,
      enrolled: false,
      icon: Smartphone,
      label: 'Device Authentication',
      description: 'Use device PIN, pattern, or password'
    }
  ]

  const checkBiometricCapabilities = useCallback(async () => {
    try {
      if (!window.PublicKeyCredential) {
        setCapabilities(biometricMethods.map(method => ({
          ...method,
          available: false,
          enrolled: false
        })))
        return
      }

      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      
      const updatedCapabilities = biometricMethods.map(method => ({
        ...method,
        available: available && (method.method === 'fingerprint' || method.method === 'face' || method.method === 'device'),
        enrolled: available && (method.method === 'fingerprint' || method.method === 'face' || method.method === 'device')
      }))

      setCapabilities(updatedCapabilities)
    } catch (error) {
      console.error('Error checking biometric capabilities:', error)
      setCapabilities(biometricMethods.map(method => ({
        ...method,
        available: false,
        enrolled: false
      })))
    }
  }, [])

  useEffect(() => {
    checkBiometricCapabilities()
  }, [checkBiometricCapabilities])

  const authenticateWithBiometric = async (method: BiometricMethod): Promise<AuthenticationResult> => {
    try {
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported')
      }

      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'PhantomSecure',
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode('user-id'),
            name: 'user@phantomsecure.com',
            displayName: 'PhantomSecure User'
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'direct'
        }
      })

      if (credential) {
        return {
          success: true,
          method,
          timestamp: Date.now()
        }
      } else {
        throw new Error('Authentication failed')
      }
    } catch (error) {
      return {
        success: false,
        method,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const handleAuthenticate = async (method: BiometricMethod) => {
    setIsAuthenticating(true)
    setSelectedMethod(method)

    try {
      const result = await authenticateWithBiometric(method)
      setAuthResults(prev => [...prev, result])

      if (result.success) {
        toast.success(`Authentication successful with ${method}`)
        onAuthSuccess?.(method)
      } else {
        toast.error(`Authentication failed: ${result.error}`)
        onAuthFailure?.(result.error || 'Authentication failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      toast.error(errorMessage)
      onAuthFailure?.(errorMessage)
    } finally {
      setIsAuthenticating(false)
      setSelectedMethod(null)
    }
  }

  const getMethodStatus = (method: BiometricMethod) => {
    const capability = capabilities.find(cap => cap.method === method)
    const lastResult = authResults.filter(result => result.method === method).pop()

    if (lastResult?.success) return 'success'
    if (lastResult?.error) return 'error'
    if (!capability?.available) return 'unavailable'
    if (!capability?.enrolled) return 'not-enrolled'
    return 'available'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Authenticated</Badge>
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>
      case 'unavailable':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unavailable</Badge>
      case 'not-enrolled':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Not Enrolled</Badge>
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Available</Badge>
    }
  }

  const AuthContent = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#9945FF]/20">
          <Shield className="h-6 w-6 text-[#9945FF]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Biometric Authentication</h3>
          <p className="text-sm text-gray-400">Secure your account with biometric verification</p>
        </div>
      </div>

      <div className="grid gap-4">
        {capabilities.map((capability) => {
          const Icon = capability.icon
          const status = getMethodStatus(capability.method)
          const isRequired = requiredMethods.includes(capability.method)
          const canAuthenticate = capability.available && capability.enrolled && status !== 'success'

          return (
            <Card key={capability.method} className="bg-[#1a1a2e] border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      status === 'success' ? "bg-green-500/20" :
                      status === 'error' ? "bg-red-500/20" :
                      status === 'unavailable' ? "bg-gray-500/20" :
                      "bg-[#9945FF]/20"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        status === 'success' ? "text-green-400" :
                        status === 'error' ? "text-red-400" :
                        status === 'unavailable' ? "text-gray-400" :
                        "text-[#9945FF]"
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{capability.label}</span>
                        {isRequired && (
                          <Badge variant="outline" className="text-xs border-[#9945FF] text-[#9945FF]">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{capability.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(status)}
                    {canAuthenticate && (
                      <Button
                        onClick={() => handleAuthenticate(capability.method)}
                        disabled={isAuthenticating}
                        size="sm"
                        className="bg-[#9945FF] hover:bg-[#8a3ff0] text-white"
                      >
                        {isAuthenticating && selectedMethod === capability.method ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Authenticating...
                          </div>
                        ) : (
                          'Authenticate'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {authResults.length > 0 && (
        <Card className="bg-[#1a1a2e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Authentication History</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              {authResults.slice(-3).map((result, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="text-gray-300 capitalize">{result.method}</span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!capabilities.some(cap => cap.available) && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-medium">Biometric Authentication Unavailable</p>
                <p className="text-yellow-400/80 text-sm">
                  Your device doesn't support biometric authentication or it's not set up.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  if (showDialog) {
    return (
      <Dialog open={showDialog} onOpenChange={onDialogClose}>
        <DialogContent className="bg-[#0F0F23] border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Biometric Authentication</DialogTitle>
          </DialogHeader>
          <AuthContent />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <AuthContent />
    </div>
  )
}
```