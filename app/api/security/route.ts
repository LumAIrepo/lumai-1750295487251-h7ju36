import React from "react"
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'

interface SecurityScanRequest {
  address?: string
  transactionSignature?: string
  programId?: string
  scanType: 'wallet' | 'transaction' | 'program' | 'token'
}

interface SecurityScanResult {
  status: 'safe' | 'warning' | 'danger'
  score: number
  risks: SecurityRisk[]
  recommendations: string[]
  metadata: {
    scannedAt: string
    scanDuration: number
    version: string
  }
}

interface SecurityRisk {
  type: 'high' | 'medium' | 'low'
  category: string
  description: string
  severity: number
  mitigation?: string
}

interface TokenSecurityInfo {
  mintAddress: string
  isVerified: boolean
  hasMetadata: boolean
  freezeAuthority: string | null
  mintAuthority: string | null
  supply: string
  decimals: number
  risks: string[]
}

interface WalletSecurityInfo {
  address: string
  balance: number
  transactionCount: number
  firstActivity: string | null
  lastActivity: string | null
  suspiciousActivity: boolean
  knownScammer: boolean
  riskFactors: string[]
}

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
const connection = new Connection(SOLANA_RPC_URL)

const KNOWN_SCAM_ADDRESSES = new Set([
  // Add known scam addresses here
])

const SUSPICIOUS_PROGRAM_IDS = new Set([
  // Add suspicious program IDs here
])

async function validateAddress(address: string): Promise<boolean> {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

async function scanWallet(address: string): Promise<WalletSecurityInfo> {
  const publicKey = new PublicKey(address)
  const accountInfo = await connection.getAccountInfo(publicKey)
  const balance = accountInfo ? accountInfo.lamports / 1e9 : 0
  
  const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 100 })
  const transactionCount = signatures.length
  
  const firstActivity = signatures.length > 0 ? 
    new Date(signatures[signatures.length - 1].blockTime! * 1000).toISOString() : null
  const lastActivity = signatures.length > 0 ? 
    new Date(signatures[0].blockTime! * 1000).toISOString() : null
  
  const knownScammer = KNOWN_SCAM_ADDRESSES.has(address)
  const suspiciousActivity = signatures.some(sig => 
    sig.err !== null || (sig.memo && sig.memo.includes('scam'))
  )
  
  const riskFactors: string[] = []
  if (knownScammer) riskFactors.push('Known scammer address')
  if (suspiciousActivity) riskFactors.push('Suspicious transaction history')
  if (balance === 0 && transactionCount > 50) riskFactors.push('High activity with zero balance')
  if (transactionCount > 1000) riskFactors.push('Extremely high transaction volume')
  
  return {
    address,
    balance,
    transactionCount,
    firstActivity,
    lastActivity,
    suspiciousActivity,
    knownScammer,
    riskFactors
  }
}

async function scanTransaction(signature: string): Promise<SecurityRisk[]> {
  try {
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    })
    
    if (!transaction) {
      return [{
        type: 'medium',
        category: 'Transaction Not Found',
        description: 'Transaction signature not found on the blockchain',
        severity: 5
      }]
    }
    
    const risks: SecurityRisk[] = []
    
    if (transaction.meta?.err) {
      risks.push({
        type: 'high',
        category: 'Failed Transaction',
        description: 'Transaction failed during execution',
        severity: 8,
        mitigation: 'Review transaction details and avoid similar patterns'
      })
    }
    
    const programIds = transaction.transaction.message.staticAccountKeys
      .filter(key => SUSPICIOUS_PROGRAM_IDS.has(key.toString()))
    
    if (programIds.length > 0) {
      risks.push({
        type: 'high',
        category: 'Suspicious Program',
        description: 'Transaction interacts with known suspicious programs',
        severity: 9,
        mitigation: 'Avoid interacting with flagged programs'
      })
    }
    
    return risks
  } catch (error) {
    return [{
      type: 'medium',
      category: 'Scan Error',
      description: 'Unable to analyze transaction',
      severity: 5
    }]
  }
}

async function scanProgram(programId: string): Promise<SecurityRisk[]> {
  const risks: SecurityRisk[] = []
  
  if (SUSPICIOUS_PROGRAM_IDS.has(programId)) {
    risks.push({
      type: 'high',
      category: 'Known Malicious Program',
      description: 'This program has been flagged as potentially malicious',
      severity: 10,
      mitigation: 'Do not interact with this program'
    })
  }
  
  try {
    const accountInfo = await connection.getAccountInfo(new PublicKey(programId))
    
    if (!accountInfo) {
      risks.push({
        type: 'medium',
        category: 'Program Not Found',
        description: 'Program account does not exist',
        severity: 6
      })
    } else if (!accountInfo.executable) {
      risks.push({
        type: 'low',
        category: 'Non-Executable Account',
        description: 'Account is not marked as executable program',
        severity: 3
      })
    }
  } catch (error) {
    risks.push({
      type: 'medium',
      category: 'Program Analysis Error',
      description: 'Unable to analyze program account',
      severity: 5
    })
  }
  
  return risks
}

async function scanToken(mintAddress: string): Promise<TokenSecurityInfo> {
  const publicKey = new PublicKey(mintAddress)
  const mintInfo = await connection.getParsedAccountInfo(publicKey)
  
  if (!mintInfo.value || !mintInfo.value.data || typeof mintInfo.value.data === 'string') {
    throw new Error('Invalid token mint address')
  }
  
  const parsedData = mintInfo.value.data as any
  const mintData = parsedData.parsed.info
  
  const risks: string[] = []
  
  if (mintData.mintAuthority) {
    risks.push('Token has mint authority - supply can be increased')
  }
  
  if (mintData.freezeAuthority) {
    risks.push('Token has freeze authority - accounts can be frozen')
  }
  
  if (parseInt(mintData.supply) === 0) {
    risks.push('Token has zero supply')
  }
  
  return {
    mintAddress,
    isVerified: false, // Would need to check against token registry
    hasMetadata: false, // Would need to check metadata account
    freezeAuthority: mintData.freezeAuthority,
    mintAuthority: mintData.mintAuthority,
    supply: mintData.supply,
    decimals: mintData.decimals,
    risks
  }
}

function calculateSecurityScore(risks: SecurityRisk[]): number {
  if (risks.length === 0) return 100
  
  const totalSeverity = risks.reduce((sum, risk) => sum + risk.severity, 0)
  const maxPossibleSeverity = risks.length * 10
  
  return Math.max(0, 100 - (totalSeverity / maxPossibleSeverity) * 100)
}

function getSecurityStatus(score: number): 'safe' | 'warning' | 'danger' {
  if (score >= 80) return 'safe'
  if (score >= 50) return 'warning'
  return 'danger'
}

function generateRecommendations(risks: SecurityRisk[]): string[] {
  const recommendations: string[] = []
  
  if (risks.some(r => r.type === 'high')) {
    recommendations.push('Exercise extreme caution - high risk detected')
  }
  
  if (risks.some(r => r.category.includes('Scam'))) {
    recommendations.push('Avoid this address/transaction completely')
  }
  
  if (risks.some(r => r.category.includes('Authority'))) {
    recommendations.push('Be aware of centralized control risks')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue with normal security practices')
  }
  
  return recommendations
}

export async function POST(request: NextRequest) {
  try {
    const body: SecurityScanRequest = await request.json()
    const { address, transactionSignature, programId, scanType } = body
    
    const startTime = Date.now()
    let risks: SecurityRisk[] = []
    
    switch (scanType) {
      case 'wallet':
        if (!address) {
          return NextResponse.json(
            { error: 'Address is required for wallet scan' },
            { status: 400 }
          )
        }
        
        if (!await validateAddress(address)) {
          return NextResponse.json(
            { error: 'Invalid Solana address' },
            { status: 400 }
          )
        }
        
        const walletInfo = await scanWallet(address)
        risks = walletInfo.riskFactors.map(factor => ({
          type: walletInfo.knownScammer ? 'high' as const : 'medium' as const,
          category: 'Wallet Risk',
          description: factor,
          severity: walletInfo.knownScammer ? 10 : 6
        }))
        break
        
      case 'transaction':
        if (!transactionSignature) {
          return NextResponse.json(
            { error: 'Transaction signature is required' },
            { status: 400 }
          )
        }
        
        risks = await scanTransaction(transactionSignature)
        break
        
      case 'program':
        if (!programId) {
          return NextResponse.json(
            { error: 'Program ID is required' },
            { status: 400 }
          )
        }
        
        if (!await validateAddress(programId)) {
          return NextResponse.json(
            { error: 'Invalid program ID' },
            { status: 400 }
          )
        }
        
        risks = await scanProgram(programId)
        break
        
      case 'token':
        if (!address) {
          return NextResponse.json(
            { error: 'Token mint address is required' },
            { status: 400 }
          )
        }
        
        if (!await validateAddress(address)) {
          return NextResponse.json(
            { error: 'Invalid token mint address' },
            { status: 400 }
          )
        }
        
        const tokenInfo = await scanToken(address)
        risks = tokenInfo.risks.map(risk => ({
          type: 'medium' as const,
          category: 'Token Risk',
          description: risk,
          severity: 5
        }))
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid scan type' },
          { status: 400 }
        )
    }
    
    const score = calculateSecurityScore(risks)
    const status = getSecurityStatus(score)
    const recommendations = generateRecommendations(risks)
    const scanDuration = Date.now() - startTime
    
    const result: SecurityScanResult = {
      status,
      score,
      risks,
      recommendations,
      metadata: {
        scannedAt: new Date().toISOString(),
        scanDuration,
        version: '1.0.0'
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Security scan error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const healthCheck = searchParams.get('health')
  
  if (healthCheck === 'true') {
    try {
      // Test connection to Solana RPC
      const slot = await connection.getSlot()
      
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        rpcConnection: 'active',
        currentSlot: slot,
        version: '1.0.0'
      })
    } catch (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'RPC connection failed'
        },
        { status: 503 }
      )
    }
  }
  
  return NextResponse.json({
    service: 'PhantomSecure Security API',
    version: '1.0.0',
    endpoints: {
      'POST /api/security': 'Perform security scan',
      'GET /api/security?health=true': 'Health check'
    },
    supportedScanTypes: ['wallet', 'transaction', 'program', 'token']
  })
}
```