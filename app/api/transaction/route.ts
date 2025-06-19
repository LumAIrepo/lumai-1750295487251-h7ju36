import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface TransactionRequest {
  type: 'transfer' | 'swap' | 'stake' | 'unstake'
  fromAddress: string
  toAddress?: string
  amount: number
  tokenMint?: string
  slippage?: number
  priority?: 'low' | 'medium' | 'high'
}

interface TransactionResponse {
  success: boolean
  transaction?: string
  simulationResult?: {
    success: boolean
    logs: string[]
    unitsConsumed: number
    err: any
  }
  error?: string
  estimatedFee?: number
}

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com'

export async function POST(request: NextRequest) {
  try {
    const body: TransactionRequest = await request.json()
    
    if (!body.type || !body.fromAddress || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, fromAddress, amount' },
        { status: 400 }
      )
    }

    const connection = new Connection(RPC_ENDPOINT, 'confirmed')
    
    let fromPubkey: PublicKey
    let toPubkey: PublicKey | undefined
    
    try {
      fromPubkey = new PublicKey(body.fromAddress)
      if (body.toAddress) {
        toPubkey = new PublicKey(body.toAddress)
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid public key format' },
        { status: 400 }
      )
    }

    const transaction = new Transaction()
    
    switch (body.type) {
      case 'transfer':
        if (!toPubkey) {
          return NextResponse.json(
            { success: false, error: 'toAddress required for transfer' },
            { status: 400 }
          )
        }
        
        transaction.add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: body.amount * LAMPORTS_PER_SOL
          })
        )
        break
        
      case 'swap':
        return NextResponse.json(
          { success: false, error: 'Swap functionality not implemented' },
          { status: 501 }
        )
        
      case 'stake':
        return NextResponse.json(
          { success: false, error: 'Stake functionality not implemented' },
          { status: 501 }
        )
        
      case 'unstake':
        return NextResponse.json(
          { success: false, error: 'Unstake functionality not implemented' },
          { status: 501 }
        )
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid transaction type' },
          { status: 400 }
        )
    }

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromPubkey

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    })

    const simulationResult = await connection.simulateTransaction(transaction)
    
    const estimatedFee = await connection.getFeeForMessage(
      transaction.compileMessage(),
      'confirmed'
    )

    const response: TransactionResponse = {
      success: true,
      transaction: Buffer.from(serializedTransaction).toString('base64'),
      simulationResult: {
        success: !simulationResult.value.err,
        logs: simulationResult.value.logs || [],
        unitsConsumed: simulationResult.value.unitsConsumed || 0,
        err: simulationResult.value.err
      },
      estimatedFee: estimatedFee.value || 5000
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Transaction API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  
  if (!address) {
    return NextResponse.json(
      { success: false, error: 'Address parameter required' },
      { status: 400 }
    )
  }

  try {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed')
    const pubkey = new PublicKey(address)
    
    const balance = await connection.getBalance(pubkey)
    const accountInfo = await connection.getAccountInfo(pubkey)
    
    return NextResponse.json({
      success: true,
      balance: balance / LAMPORTS_PER_SOL,
      accountInfo: {
        executable: accountInfo?.executable || false,
        owner: accountInfo?.owner.toString() || null,
        lamports: accountInfo?.lamports || 0,
        data: accountInfo?.data ? Buffer.from(accountInfo.data).toString('base64') : null
      }
    })
    
  } catch (error) {
    console.error('Account info error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch account info' 
      },
      { status: 500 }
    )
  }
}