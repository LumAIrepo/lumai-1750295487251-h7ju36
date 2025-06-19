import React from "react"
```typescript
import { PublicKey, Transaction, Connection } from '@solana/web3.js'

export interface SecurityScanResult {
  isSecure: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  warnings: string[]
  errors: string[]
  score: number
  details: {
    maliciousAddresses: string[]
    suspiciousInstructions: string[]
    unusualPatterns: string[]
    tokenValidation: TokenValidationResult
  }
}

export interface TokenValidationResult {
  isValid: boolean
  mintAddress: string
  decimals: number
  supply: string
  freezeAuthority: string | null
  mintAuthority: string | null
  isVerified: boolean
}

export interface TransactionAnalysis {
  instructionCount: number
  accountCount: number
  signerCount: number
  hasUnknownPrograms: boolean
  programIds: string[]
  estimatedComputeUnits: number
}

export interface SecurityConfig {
  maxInstructions: number
  maxAccounts: number
  maxSigners: number
  allowedPrograms: string[]
  blockedAddresses: string[]
  enableTokenValidation: boolean
  riskThreshold: number
}

const DEFAULT_CONFIG: SecurityConfig = {
  maxInstructions: 10,
  maxAccounts: 20,
  maxSigners: 5,
  allowedPrograms: [
    '11111111111111111111111111111111',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  ],
  blockedAddresses: [],
  enableTokenValidation: true,
  riskThreshold: 70,
}

export class TransactionScanner {
  private config: SecurityConfig
  private connection: Connection

  constructor(connection: Connection, config?: Partial<SecurityConfig>) {
    this.connection = connection
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async scanTransaction(transaction: Transaction): Promise<SecurityScanResult> {
    try {
      const analysis = this.analyzeTransaction(transaction)
      const warnings: string[] = []
      const errors: string[] = []
      let riskScore = 0

      // Check instruction count
      if (analysis.instructionCount > this.config.maxInstructions) {
        warnings.push(`High instruction count: ${analysis.instructionCount}`)
        riskScore += 20
      }

      // Check account count
      if (analysis.accountCount > this.config.maxAccounts) {
        warnings.push(`High account count: ${analysis.accountCount}`)
        riskScore += 15
      }

      // Check signer count
      if (analysis.signerCount > this.config.maxSigners) {
        warnings.push(`High signer count: ${analysis.signerCount}`)
        riskScore += 10
      }

      // Check for unknown programs
      const unknownPrograms = analysis.programIds.filter(
        id => !this.config.allowedPrograms.includes(id)
      )
      if (unknownPrograms.length > 0) {
        warnings.push(`Unknown programs detected: ${unknownPrograms.join(', ')}`)
        riskScore += unknownPrograms.length * 25
      }

      // Check for blocked addresses
      const blockedFound = this.checkBlockedAddresses(transaction)
      if (blockedFound.length > 0) {
        errors.push(`Blocked addresses detected: ${blockedFound.join(', ')}`)
        riskScore += 100
      }

      // Validate tokens if enabled
      let tokenValidation: TokenValidationResult = {
        isValid: true,
        mintAddress: '',
        decimals: 0,
        supply: '0',
        freezeAuthority: null,
        mintAuthority: null,
        isVerified: false,
      }

      if (this.config.enableTokenValidation) {
        tokenValidation = await this.validateTokens(transaction)
        if (!tokenValidation.isValid) {
          warnings.push('Token validation failed')
          riskScore += 30
        }
      }

      const riskLevel = this.calculateRiskLevel(riskScore)
      const isSecure = riskScore < this.config.riskThreshold && errors.length === 0

      return {
        isSecure,
        riskLevel,
        warnings,
        errors,
        score: Math.min(100, riskScore),
        details: {
          maliciousAddresses: blockedFound,
          suspiciousInstructions: unknownPrograms,
          unusualPatterns: this.detectUnusualPatterns(analysis),
          tokenValidation,
        },
      }
    } catch (error) {
      return {
        isSecure: false,
        riskLevel: 'critical',
        warnings: [],
        errors: [`Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        score: 100,
        details: {
          maliciousAddresses: [],
          suspiciousInstructions: [],
          unusualPatterns: [],
          tokenValidation: {
            isValid: false,
            mintAddress: '',
            decimals: 0,
            supply: '0',
            freezeAuthority: null,
            mintAuthority: null,
            isVerified: false,
          },
        },
      }
    }
  }

  private analyzeTransaction(transaction: Transaction): TransactionAnalysis {
    const instructions = transaction.instructions
    const accounts = new Set<string>()
    const signers = new Set<string>()
    const programIds = new Set<string>()

    instructions.forEach(instruction => {
      programIds.add(instruction.programId.toString())
      
      instruction.keys.forEach(key => {
        accounts.add(key.pubkey.toString())
        if (key.isSigner) {
          signers.add(key.pubkey.toString())
        }
      })
    })

    return {
      instructionCount: instructions.length,
      accountCount: accounts.size,
      signerCount: signers.size,
      hasUnknownPrograms: Array.from(programIds).some(
        id => !this.config.allowedPrograms.includes(id)
      ),
      programIds: Array.from(programIds),
      estimatedComputeUnits: this.estimateComputeUnits(instructions.length),
    }
  }

  private checkBlockedAddresses(transaction: Transaction): string[] {
    const blockedFound: string[] = []
    const allAddresses = new Set<string>()

    transaction.instructions.forEach(instruction => {
      allAddresses.add(instruction.programId.toString())
      instruction.keys.forEach(key => {
        allAddresses.add(key.pubkey.toString())
      })
    })

    this.config.blockedAddresses.forEach(blocked => {
      if (allAddresses.has(blocked)) {
        blockedFound.push(blocked)
      }
    })

    return blockedFound
  }

  private async validateTokens(transaction: Transaction): Promise<TokenValidationResult> {
    try {
      // Extract token mint addresses from transaction
      const tokenMints = this.extractTokenMints(transaction)
      
      if (tokenMints.length === 0) {
        return {
          isValid: true,
          mintAddress: '',
          decimals: 0,
          supply: '0',
          freezeAuthority: null,
          mintAuthority: null,
          isVerified: false,
        }
      }

      // Validate the first token mint found
      const mintAddress = tokenMints[0]
      const mintInfo = await this.connection.getParsedAccountInfo(new PublicKey(mintAddress))

      if (!mintInfo.value || !mintInfo.value.data || typeof mintInfo.value.data === 'string') {
        return {
          isValid: false,
          mintAddress,
          decimals: 0,
          supply: '0',
          freezeAuthority: null,
          mintAuthority: null,
          isVerified: false,
        }
      }

      const parsedData = mintInfo.value.data as any
      const mintData = parsedData.parsed?.info

      return {
        isValid: true,
        mintAddress,
        decimals: mintData?.decimals || 0,
        supply: mintData?.supply || '0',
        freezeAuthority: mintData?.freezeAuthority,
        mintAuthority: mintData?.mintAuthority,
        isVerified: this.isVerifiedToken(mintAddress),
      }
    } catch (error) {
      return {
        isValid: false,
        mintAddress: '',
        decimals: 0,
        supply: '0',
        freezeAuthority: null,
        mintAuthority: null,
        isVerified: false,
      }
    }
  }

  private extractTokenMints(transaction: Transaction): string[] {
    const mints: string[] = []
    
    transaction.instructions.forEach(instruction => {
      // Check if this is a token program instruction
      if (instruction.programId.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        // Extract potential mint addresses from instruction keys
        instruction.keys.forEach(key => {
          mints.push(key.pubkey.toString())
        })
      }
    })

    return [...new Set(mints)]
  }

  private isVerifiedToken(mintAddress: string): boolean {
    // This would typically check against a verified token list
    const verifiedTokens = [
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      'So11111111111111111111111111111111111111112', // SOL
    ]
    
    return verifiedTokens.includes(mintAddress)
  }

  private detectUnusualPatterns(analysis: TransactionAnalysis): string[] {
    const patterns: string[] = []

    if (analysis.instructionCount === 1 && analysis.accountCount > 10) {
      patterns.push('Single instruction with many accounts')
    }

    if (analysis.signerCount > analysis.instructionCount) {
      patterns.push('More signers than instructions')
    }

    if (analysis.estimatedComputeUnits > 200000) {
      patterns.push('High compute unit usage')
    }

    return patterns
  }

  private estimateComputeUnits(instructionCount: number): number {
    // Basic estimation - would be more sophisticated in production
    return instructionCount * 10000
  }

  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical'
    if (score >= 60) return 'high'
    if (score >= 30) return 'medium'
    return 'low'
  }

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): SecurityConfig {
    return { ...this.config }
  }
}

export async function scanTransactionQuick(
  transaction: Transaction,
  connection: Connection
): Promise<SecurityScanResult> {
  const scanner = new TransactionScanner(connection)
  return scanner.scanTransaction(transaction)
}

export function createSecurityScanner(
  connection: Connection,
  config?: Partial<SecurityConfig>
): TransactionScanner {
  return new TransactionScanner(connection, config)
}

export function validateTransactionStructure(transaction: Transaction): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!transaction.instructions || transaction.instructions.length === 0) {
    errors.push('Transaction has no instructions')
  }

  if (transaction.instructions.length > 64) {
    errors.push('Transaction has too many instructions')
  }

  transaction.instructions.forEach((instruction, index) => {
    if (!instruction.programId) {
      errors.push(`Instruction ${index} missing program ID`)
    }

    if (!instruction.keys || instruction.keys.length === 0) {
      errors.push(`Instruction ${index} has no account keys`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export default TransactionScanner
```