import React from "react"
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Keypair, PublicKey, Connection, clusterApiUrl } from '@solana/web3.js'
import { encryptData, decryptData } from '@/lib/encryption'
import { validateApiKey } from '@/lib/auth'
import { z } from 'zod'

const connection = new Connection(clusterApiUrl('devnet'))

const createWalletSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional()
})

const importWalletSchema = z.object({
  privateKey: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional()
})

const unlockWalletSchema = z.object({
  address: z.string(),
  password: z.string()
})

interface WalletData {
  address: string
  encryptedPrivateKey: string
  name?: string
  createdAt: string
}

interface WalletResponse {
  address: string
  name?: string
  balance?: number
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create':
        return await createWallet(body)
      case 'import':
        return await importWallet(body)
      case 'unlock':
        return await unlockWallet(body)
      case 'list':
        return await listWallets()
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Wallet API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createWallet(data: any) {
  try {
    const validatedData = createWalletSchema.parse(data)
    
    const keypair = Keypair.generate()
    const address = keypair.publicKey.toString()
    const privateKeyArray = Array.from(keypair.secretKey)
    
    const encryptedPrivateKey = await encryptData(
      JSON.stringify(privateKeyArray),
      validatedData.password
    )
    
    const walletData: WalletData = {
      address,
      encryptedPrivateKey,
      name: validatedData.name,
      createdAt: new Date().toISOString()
    }
    
    // Store wallet data (implement your storage logic here)
    await storeWalletData(address, walletData)
    
    const balance = await connection.getBalance(keypair.publicKey)
    
    const response: WalletResponse = {
      address,
      name: validatedData.name,
      balance: balance / 1e9 // Convert lamports to SOL
    }
    
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    throw error
  }
}

async function importWallet(data: any) {
  try {
    const validatedData = importWalletSchema.parse(data)
    
    let privateKeyArray: number[]
    
    try {
      if (validatedData.privateKey.includes(',')) {
        privateKeyArray = validatedData.privateKey.split(',').map(num => parseInt(num.trim()))
      } else {
        privateKeyArray = JSON.parse(validatedData.privateKey)
      }
      
      if (!Array.isArray(privateKeyArray) || privateKeyArray.length !== 64) {
        throw new Error('Invalid private key format')
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid private key format' },
        { status: 400 }
      )
    }
    
    const keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray))
    const address = keypair.publicKey.toString()
    
    const encryptedPrivateKey = await encryptData(
      JSON.stringify(privateKeyArray),
      validatedData.password
    )
    
    const walletData: WalletData = {
      address,
      encryptedPrivateKey,
      name: validatedData.name,
      createdAt: new Date().toISOString()
    }
    
    await storeWalletData(address, walletData)
    
    const balance = await connection.getBalance(keypair.publicKey)
    
    const response: WalletResponse = {
      address,
      name: validatedData.name,
      balance: balance / 1e9
    }
    
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    throw error
  }
}

async function unlockWallet(data: any) {
  try {
    const validatedData = unlockWalletSchema.parse(data)
    
    const walletData = await getWalletData(validatedData.address)
    if (!walletData) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }
    
    try {
      const decryptedPrivateKey = await decryptData(
        walletData.encryptedPrivateKey,
        validatedData.password
      )
      
      const privateKeyArray = JSON.parse(decryptedPrivateKey)
      const keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray))
      
      if (keypair.publicKey.toString() !== validatedData.address) {
        throw new Error('Address mismatch')
      }
      
      const balance = await connection.getBalance(keypair.publicKey)
      
      const response: WalletResponse = {
        address: validatedData.address,
        name: walletData.name,
        balance: balance / 1e9
      }
      
      return NextResponse.json(response)
    } catch {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    throw error
  }
}

async function listWallets() {
  try {
    const wallets = await getAllWallets()
    
    const walletsWithBalance = await Promise.all(
      wallets.map(async (wallet) => {
        try {
          const publicKey = new PublicKey(wallet.address)
          const balance = await connection.getBalance(publicKey)
          
          return {
            address: wallet.address,
            name: wallet.name,
            balance: balance / 1e9,
            createdAt: wallet.createdAt
          }
        } catch {
          return {
            address: wallet.address,
            name: wallet.name,
            balance: 0,
            createdAt: wallet.createdAt
          }
        }
      })
    )
    
    return NextResponse.json({ wallets: walletsWithBalance })
  } catch (error) {
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (address) {
      const walletData = await getWalletData(address)
      if (!walletData) {
        return NextResponse.json(
          { error: 'Wallet not found' },
          { status: 404 }
        )
      }
      
      try {
        const publicKey = new PublicKey(address)
        const balance = await connection.getBalance(publicKey)
        
        const response: WalletResponse = {
          address,
          name: walletData.name,
          balance: balance / 1e9
        }
        
        return NextResponse.json(response)
      } catch {
        return NextResponse.json(
          { error: 'Invalid wallet address' },
          { status: 400 }
        )
      }
    }
    
    return await listWallets()
  } catch (error) {
    console.error('Wallet GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter required' },
        { status: 400 }
      )
    }
    
    const deleted = await deleteWalletData(address)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Wallet deleted successfully' })
  } catch (error) {
    console.error('Wallet DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function storeWalletData(address: string, data: WalletData): Promise<void> {
  // Implement your storage logic here (database, file system, etc.)
  // This is a placeholder implementation
  console.log('Storing wallet data for address:', address)
}

async function getWalletData(address: string): Promise<WalletData | null> {
  // Implement your retrieval logic here
  // This is a placeholder implementation
  console.log('Getting wallet data for address:', address)
  return null
}

async function getAllWallets(): Promise<WalletData[]> {
  // Implement your retrieval logic here
  // This is a placeholder implementation
  console.log('Getting all wallets')
  return []
}

async function deleteWalletData(address: string): Promise<boolean> {
  // Implement your deletion logic here
  // This is a placeholder implementation
  console.log('Deleting wallet data for address:', address)
  return true
}
```