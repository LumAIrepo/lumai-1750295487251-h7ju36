import React from "react"
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token'

interface DeFiProtocol {
  id: string;
  name: string;
  tvl: number;
  apy: number;
  category: 'lending' | 'dex' | 'yield' | 'derivatives';
  address: string;
}

interface StakeRequest {
  protocol: string;
  amount: number;
  walletAddress: string;
  tokenMint?: string;
}

interface UnstakeRequest {
  protocol: string;
  amount: number;
  walletAddress: string;
  tokenMint?: string;
}

interface YieldRequest {
  protocol: string;
  walletAddress: string;
}

const DEFI_PROTOCOLS: DeFiProtocol[] = [
  {
    id: 'marinade',
    name: 'Marinade Finance',
    tvl: 1200000000,
    apy: 6.8,
    category: 'yield',
    address: '8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC'
  },
  {
    id: 'raydium',
    name: 'Raydium',
    tvl: 800000000,
    apy: 12.5,
    category: 'dex',
    address: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
  },
  {
    id: 'solend',
    name: 'Solend',
    tvl: 600000000,
    apy: 8.2,
    category: 'lending',
    address: 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo'
  },
  {
    id: 'mango',
    name: 'Mango Markets',
    tvl: 400000000,
    apy: 15.3,
    category: 'derivatives',
    address: 'mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68'
  }
];

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const protocol = searchParams.get('protocol');
    const walletAddress = searchParams.get('wallet');

    switch (action) {
      case 'protocols':
        return NextResponse.json({
          success: true,
          data: DEFI_PROTOCOLS
        });

      case 'protocol':
        if (!protocol) {
          return NextResponse.json({
            success: false,
            error: 'Protocol ID required'
          }, { status: 400 });
        }

        const protocolData = DEFI_PROTOCOLS.find(p => p.id === protocol);
        if (!protocolData) {
          return NextResponse.json({
            success: false,
            error: 'Protocol not found'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: protocolData
        });

      case 'balance':
        if (!walletAddress || !protocol) {
          return NextResponse.json({
            success: false,
            error: 'Wallet address and protocol required'
          }, { status: 400 });
        }

        try {
          const publicKey = new PublicKey(walletAddress);
          const balance = await connection.getBalance(publicKey);
          
          return NextResponse.json({
            success: true,
            data: {
              protocol,
              balance: balance / LAMPORTS_PER_SOL,
              staked: Math.random() * 100, // Mock staked amount
              rewards: Math.random() * 10   // Mock rewards
            }
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Invalid wallet address'
          }, { status: 400 });
        }

      case 'yields':
        if (!walletAddress) {
          return NextResponse.json({
            success: false,
            error: 'Wallet address required'
          }, { status: 400 });
        }

        const yields = DEFI_PROTOCOLS.map(p => ({
          protocol: p.id,
          name: p.name,
          earned: Math.random() * 50,
          pending: Math.random() * 10,
          apy: p.apy
        }));

        return NextResponse.json({
          success: true,
          data: yields
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('DeFi API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'stake':
        return await handleStake(body as StakeRequest);
      
      case 'unstake':
        return await handleUnstake(body as UnstakeRequest);
      
      case 'claim':
        return await handleClaim(body as YieldRequest);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('DeFi API POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

async function handleStake(request: StakeRequest): Promise<NextResponse> {
  try {
    const { protocol, amount, walletAddress, tokenMint } = request;

    if (!protocol || !amount || !walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const protocolData = DEFI_PROTOCOLS.find(p => p.id === protocol);
    if (!protocolData) {
      return NextResponse.json({
        success: false,
        error: 'Protocol not found'
      }, { status: 404 });
    }

    const userPublicKey = new PublicKey(walletAddress);
    const protocolPublicKey = new PublicKey(protocolData.address);

    const transaction = new Transaction();

    if (tokenMint) {
      // Token transfer
      const tokenMintPublicKey = new PublicKey(tokenMint);
      const userTokenAccount = await getAssociatedTokenAddress(tokenMintPublicKey, userPublicKey);
      const protocolTokenAccount = await getAssociatedTokenAddress(tokenMintPublicKey, protocolPublicKey);

      transaction.add(
        createTransferInstruction(
          userTokenAccount,
          protocolTokenAccount,
          userPublicKey,
          amount * Math.pow(10, 6) // Assuming 6 decimals
        )
      );
    } else {
      // SOL transfer
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: userPublicKey,
          toPubkey: protocolPublicKey,
          lamports: amount * LAMPORTS_PER_SOL
        })
      );
    }

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: serializedTransaction.toString('base64'),
        message: `Staking ${amount} tokens to ${protocolData.name}`
      }
    });
  } catch (error) {
    console.error('Stake Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create stake transaction'
    }, { status: 500 });
  }
}

async function handleUnstake(request: UnstakeRequest): Promise<NextResponse> {
  try {
    const { protocol, amount, walletAddress, tokenMint } = request;

    if (!protocol || !amount || !walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const protocolData = DEFI_PROTOCOLS.find(p => p.id === protocol);
    if (!protocolData) {
      return NextResponse.json({
        success: false,
        error: 'Protocol not found'
      }, { status: 404 });
    }

    const userPublicKey = new PublicKey(walletAddress);
    const protocolPublicKey = new PublicKey(protocolData.address);

    const transaction = new Transaction();

    if (tokenMint) {
      // Token transfer back to user
      const tokenMintPublicKey = new PublicKey(tokenMint);
      const userTokenAccount = await getAssociatedTokenAddress(tokenMintPublicKey, userPublicKey);
      const protocolTokenAccount = await getAssociatedTokenAddress(tokenMintPublicKey, protocolPublicKey);

      transaction.add(
        createTransferInstruction(
          protocolTokenAccount,
          userTokenAccount,
          protocolPublicKey,
          amount * Math.pow(10, 6) // Assuming 6 decimals
        )
      );
    } else {
      // SOL transfer back to user
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: protocolPublicKey,
          toPubkey: userPublicKey,
          lamports: amount * LAMPORTS_PER_SOL
        })
      );
    }

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: serializedTransaction.toString('base64'),
        message: `Unstaking ${amount} tokens from ${protocolData.name}`
      }
    });
  } catch (error) {
    console.error('Unstake Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create unstake transaction'
    }, { status: 500 });
  }
}

async function handleClaim(request: YieldRequest): Promise<NextResponse> {
  try {
    const { protocol, walletAddress } = request;

    if (!protocol || !walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const protocolData = DEFI_PROTOCOLS.find(p => p.id === protocol);
    if (!protocolData) {
      return NextResponse.json({
        success: false,
        error: 'Protocol not found'
      }, { status: 404 });
    }

    const userPublicKey = new PublicKey(walletAddress);
    const protocolPublicKey = new PublicKey(protocolData.address);

    const transaction = new Transaction();
    const rewardAmount = Math.random() * 10; // Mock reward amount

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: protocolPublicKey,
        toPubkey: userPublicKey,
        lamports: rewardAmount * LAMPORTS_PER_SOL
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPublicKey;

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: serializedTransaction.toString('base64'),
        amount: rewardAmount,
        message: `Claiming ${rewardAmount.toFixed(4)} SOL rewards from ${protocolData.name}`
      }
    });
  } catch (error) {
    console.error('Claim Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create claim transaction'
    }, { status: 500 });
  }
}
```