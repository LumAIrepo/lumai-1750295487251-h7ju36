import React from "react"
```typescript
import { PublicKey, Connection, AccountInfo } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token'

export interface ProtocolConfig {
  name: string
  programId: PublicKey
  baseUrl: string
  fees: {
    deposit: number
    withdraw: number
    trade: number
  }
  supportedTokens: PublicKey[]
}

export interface YieldOpportunity {
  protocol: string
  poolAddress: PublicKey
  tokenMint: PublicKey
  apy: number
  tvl: number
  risk: 'low' | 'medium' | 'high'
  lockupPeriod?: number
  minimumDeposit: number
}

export interface PoolInfo {
  address: PublicKey
  tokenA: PublicKey
  tokenB: PublicKey
  liquidity: number
  volume24h: number
  fees24h: number
  apy: number
}

export interface StakeInfo {
  validator: PublicKey
  commission: number
  apy: number
  totalStaked: number
  isActive: boolean
}

export const PROTOCOLS: Record<string, ProtocolConfig> = {
  raydium: {
    name: 'Raydium',
    programId: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
    baseUrl: 'https://api.raydium.io',
    fees: {
      deposit: 0,
      withdraw: 0,
      trade: 0.0025
    },
    supportedTokens: [
      new PublicKey('So11111111111111111111111111111111111111112'), // SOL
      new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
    ]
  },
  orca: {
    name: 'Orca',
    programId: new PublicKey('9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP'),
    baseUrl: 'https://api.orca.so',
    fees: {
      deposit: 0,
      withdraw: 0,
      trade: 0.003
    },
    supportedTokens: [
      new PublicKey('So11111111111111111111111111111111111111112'), // SOL
      new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
    ]
  },
  marinade: {
    name: 'Marinade',
    programId: new PublicKey('MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD'),
    baseUrl: 'https://api.marinade.finance',
    fees: {
      deposit: 0,
      withdraw: 0.003,
      trade: 0
    },
    supportedTokens: [
      new PublicKey('So11111111111111111111111111111111111111112'), // SOL
      new PublicKey('7Q2afV64in6N6SeZsAAB81TJzwDoD6zpqmHkzi9Dcavn'), // mSOL
    ]
  }
}

export class ProtocolIntegration {
  private connection: Connection
  private protocol: ProtocolConfig

  constructor(connection: Connection, protocolName: string) {
    this.connection = connection
    const protocol = PROTOCOLS[protocolName]
    if (!protocol) {
      throw new Error(`Protocol ${protocolName} not supported`)
    }
    this.protocol = protocol
  }

  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    try {
      const response = await fetch(`${this.protocol.baseUrl}/pools`)
      if (!response.ok) {
        throw new Error(`Failed to fetch pools: ${response.statusText}`)
      }
      
      const pools = await response.json()
      
      return pools.map((pool: any) => ({
        protocol: this.protocol.name,
        poolAddress: new PublicKey(pool.address),
        tokenMint: new PublicKey(pool.tokenMint),
        apy: pool.apy || 0,
        tvl: pool.tvl || 0,
        risk: this.calculateRisk(pool.apy, pool.tvl),
        lockupPeriod: pool.lockupPeriod,
        minimumDeposit: pool.minimumDeposit || 0
      }))
    } catch (error) {
      console.error(`Error fetching yield opportunities for ${this.protocol.name}:`, error)
      return []
    }
  }

  async getPoolInfo(poolAddress: PublicKey): Promise<PoolInfo | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(poolAddress)
      if (!accountInfo) {
        return null
      }

      // Parse pool data based on protocol
      const poolData = this.parsePoolData(accountInfo.data)
      
      return {
        address: poolAddress,
        tokenA: poolData.tokenA,
        tokenB: poolData.tokenB,
        liquidity: poolData.liquidity,
        volume24h: poolData.volume24h,
        fees24h: poolData.fees24h,
        apy: poolData.apy
      }
    } catch (error) {
      console.error('Error fetching pool info:', error)
      return null
    }
  }

  async calculateYield(
    amount: number,
    tokenMint: PublicKey,
    duration: number
  ): Promise<{
    expectedYield: number
    apy: number
    fees: number
    netYield: number
  }> {
    try {
      const opportunities = await this.getYieldOpportunities()
      const bestOpportunity = opportunities
        .filter(opp => opp.tokenMint.equals(tokenMint))
        .sort((a, b) => b.apy - a.apy)[0]

      if (!bestOpportunity) {
        return {
          expectedYield: 0,
          apy: 0,
          fees: 0,
          netYield: 0
        }
      }

      const dailyRate = bestOpportunity.apy / 365
      const expectedYield = amount * (dailyRate * duration)
      const fees = amount * this.protocol.fees.deposit + expectedYield * this.protocol.fees.withdraw
      const netYield = expectedYield - fees

      return {
        expectedYield,
        apy: bestOpportunity.apy,
        fees,
        netYield
      }
    } catch (error) {
      console.error('Error calculating yield:', error)
      return {
        expectedYield: 0,
        apy: 0,
        fees: 0,
        netYield: 0
      }
    }
  }

  async getStakingInfo(): Promise<StakeInfo[]> {
    try {
      if (this.protocol.name !== 'Marinade') {
        return []
      }

      const response = await fetch(`${this.protocol.baseUrl}/validators`)
      if (!response.ok) {
        throw new Error(`Failed to fetch validators: ${response.statusText}`)
      }

      const validators = await response.json()
      
      return validators.map((validator: any) => ({
        validator: new PublicKey(validator.vote_account),
        commission: validator.commission,
        apy: validator.apy || 0,
        totalStaked: validator.activated_stake || 0,
        isActive: validator.delinquent === false
      }))
    } catch (error) {
      console.error('Error fetching staking info:', error)
      return []
    }
  }

  private calculateRisk(apy: number, tvl: number): 'low' | 'medium' | 'high' {
    if (apy > 50 || tvl < 1000000) {
      return 'high'
    } else if (apy > 20 || tvl < 10000000) {
      return 'medium'
    }
    return 'low'
  }

  private parsePoolData(data: Buffer): any {
    // This would contain protocol-specific parsing logic
    // For now, return mock data
    return {
      tokenA: new PublicKey('So11111111111111111111111111111111111111112'),
      tokenB: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
      liquidity: 1000000,
      volume24h: 500000,
      fees24h: 1500,
      apy: 12.5
    }
  }
}

export async function getAllYieldOpportunities(connection: Connection): Promise<YieldOpportunity[]> {
  const allOpportunities: YieldOpportunity[] = []
  
  for (const protocolName of Object.keys(PROTOCOLS)) {
    try {
      const integration = new ProtocolIntegration(connection, protocolName)
      const opportunities = await integration.getYieldOpportunities()
      allOpportunities.push(...opportunities)
    } catch (error) {
      console.error(`Error fetching opportunities for ${protocolName}:`, error)
    }
  }

  return allOpportunities.sort((a, b) => b.apy - a.apy)
}

export async function getBestYieldForToken(
  connection: Connection,
  tokenMint: PublicKey,
  amount: number
): Promise<YieldOpportunity | null> {
  try {
    const opportunities = await getAllYieldOpportunities(connection)
    const filtered = opportunities.filter(
      opp => opp.tokenMint.equals(tokenMint) && opp.minimumDeposit <= amount
    )
    
    return filtered.length > 0 ? filtered[0] : null
  } catch (error) {
    console.error('Error finding best yield:', error)
    return null
  }
}

export async function calculatePortfolioYield(
  connection: Connection,
  positions: Array<{ tokenMint: PublicKey; amount: number }>
): Promise<{
  totalValue: number
  totalYield: number
  averageApy: number
  breakdown: Array<{
    token: PublicKey
    amount: number
    apy: number
    expectedYield: number
  }>
}> {
  try {
    let totalValue = 0
    let totalYield = 0
    const breakdown: Array<{
      token: PublicKey
      amount: number
      apy: number
      expectedYield: number
    }> = []

    for (const position of positions) {
      const bestYield = await getBestYieldForToken(
        connection,
        position.tokenMint,
        position.amount
      )

      const apy = bestYield?.apy || 0
      const expectedYield = position.amount * (apy / 100)

      totalValue += position.amount
      totalYield += expectedYield

      breakdown.push({
        token: position.tokenMint,
        amount: position.amount,
        apy,
        expectedYield
      })
    }

    const averageApy = totalValue > 0 ? (totalYield / totalValue) * 100 : 0

    return {
      totalValue,
      totalYield,
      averageApy,
      breakdown
    }
  } catch (error) {
    console.error('Error calculating portfolio yield:', error)
    return {
      totalValue: 0,
      totalYield: 0,
      averageApy: 0,
      breakdown: []
    }
  }
}

export function getProtocolByName(name: string): ProtocolConfig | null {
  return PROTOCOLS[name.toLowerCase()] || null
}

export function getSupportedProtocols(): string[] {
  return Object.keys(PROTOCOLS)
}

export default ProtocolIntegration
```