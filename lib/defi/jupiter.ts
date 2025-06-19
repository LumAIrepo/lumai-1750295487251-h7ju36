import React from "react"
```typescript
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot: number;
  timeTaken: number;
}

export interface JupiterSwapRequest {
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  useSharedAccounts?: boolean;
  feeAccount?: string;
  trackingAccount?: string;
  computeUnitPriceMicroLamports?: number;
  prioritizationFeeLamports?: number;
  asLegacyTransaction?: boolean;
  useTokenLedger?: boolean;
  destinationTokenAccount?: string;
}

export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
  computeUnitLimit: number;
  prioritizationType: {
    computeBudget: {
      microLamports: number;
      estimatedFeeInSOL: number;
    };
  };
  dynamicSlippageReport?: {
    slippageBps: number;
    otherAmountThreshold: string;
  };
  simulationError?: {
    error: string;
    logs: string[];
  };
}

export interface TokenInfo {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags?: string[];
  extensions?: {
    coingeckoId?: string;
  };
}

export interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
  userPublicKey: string;
  connection: Connection;
}

export interface SwapResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
}

export class JupiterService {
  private static readonly BASE_URL = 'https://quote-api.jup.ag/v6';
  private static readonly PRICE_API_URL = 'https://price.jup.ag/v4';
  
  static async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50
  ): Promise<JupiterQuoteResponse> {
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        slippageBps: slippageBps.toString(),
        onlyDirectRoutes: 'false',
        asLegacyTransaction: 'false'
      });

      const response = await fetch(`${this.BASE_URL}/quote?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Quote request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return data as JupiterQuoteResponse;
    } catch (error) {
      console.error('Error fetching Jupiter quote:', error);
      throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getSwapTransaction(
    quoteResponse: JupiterQuoteResponse,
    userPublicKey: string,
    options: Partial<JupiterSwapRequest> = {}
  ): Promise<JupiterSwapResponse> {
    try {
      const swapRequest: JupiterSwapRequest = {
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        useSharedAccounts: true,
        computeUnitPriceMicroLamports: 1000000,
        asLegacyTransaction: false,
        ...options
      };

      const response = await fetch(`${this.BASE_URL}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swapRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Swap request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return data as JupiterSwapResponse;
    } catch (error) {
      console.error('Error getting swap transaction:', error);
      throw new Error(`Failed to get swap transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async executeSwap(params: SwapParams): Promise<SwapResult> {
    try {
      const { inputMint, outputMint, amount, slippageBps = 50, userPublicKey, connection } = params;

      // Get quote
      const quote = await this.getQuote(inputMint, outputMint, amount, slippageBps);

      // Get swap transaction
      const swapResponse = await this.getSwapTransaction(quote, userPublicKey);

      // Deserialize transaction
      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // Send transaction
      const signature = await connection.sendTransaction(transaction, {
        maxRetries: 3,
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      // Confirm transaction
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: transaction.message.recentBlockhash || '',
        lastValidBlockHeight: swapResponse.lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      return {
        signature,
        inputAmount: parseInt(quote.inAmount),
        outputAmount: parseInt(quote.outAmount),
        priceImpact: parseFloat(quote.priceImpactPct)
      };
    } catch (error) {
      console.error('Error executing swap:', error);
      throw new Error(`Swap execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getTokenPrice(tokenMint: string): Promise<number> {
    try {
      const response = await fetch(`${this.PRICE_API_URL}/price?ids=${tokenMint}`);
      
      if (!response.ok) {
        throw new Error(`Price request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data[tokenMint]?.price || 0;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return 0;
    }
  }

  static async getTokenList(): Promise<TokenInfo[]> {
    try {
      const response = await fetch('https://token.jup.ag/all');
      
      if (!response.ok) {
        throw new Error(`Token list request failed: ${response.status}`);
      }

      const tokens = await response.json();
      return tokens as TokenInfo[];
    } catch (error) {
      console.error('Error fetching token list:', error);
      return [];
    }
  }

  static async getTokenInfo(mint: string): Promise<TokenInfo | null> {
    try {
      const tokens = await this.getTokenList();
      return tokens.find(token => token.address === mint) || null;
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  static calculatePriceImpact(inputAmount: number, outputAmount: number, inputPrice: number, outputPrice: number): number {
    if (inputPrice === 0 || outputPrice === 0) return 0;
    
    const expectedOutputAmount = (inputAmount * inputPrice) / outputPrice;
    const priceImpact = ((expectedOutputAmount - outputAmount) / expectedOutputAmount) * 100;
    
    return Math.max(0, priceImpact);
  }

  static formatTokenAmount(amount: number, decimals: number): string {
    return (amount / Math.pow(10, decimals)).toFixed(decimals > 6 ? 6 : decimals);
  }

  static parseTokenAmount(amount: string, decimals: number): number {
    return Math.floor(parseFloat(amount) * Math.pow(10, decimals));
  }

  static isValidMint(mint: string): boolean {
    try {
      new PublicKey(mint);
      return true;
    } catch {
      return false;
    }
  }

  static getMinimumAmountOut(quote: JupiterQuoteResponse): number {
    return parseInt(quote.otherAmountThreshold);
  }

  static estimateGasFee(quote: JupiterQuoteResponse): number {
    // Estimate based on route complexity
    const routeComplexity = quote.routePlan.length;
    const baseGas = 5000; // Base lamports
    const complexityMultiplier = routeComplexity * 1000;
    
    return baseGas + complexityMultiplier;
  }
}

export default JupiterService;
```