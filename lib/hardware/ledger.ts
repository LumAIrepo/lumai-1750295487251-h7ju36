import React from "react"
```typescript
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export interface LedgerDevice {
  id: string;
  name: string;
  connected: boolean;
  publicKey?: PublicKey;
}

export interface LedgerTransportOptions {
  timeout?: number;
  scrambleKey?: string;
}

export interface LedgerSignatureResult {
  signature: Uint8Array;
  publicKey: PublicKey;
}

export interface LedgerError extends Error {
  code: number;
  statusCode?: number;
}

export class LedgerWalletError extends Error {
  public code: number;
  public statusCode?: number;

  constructor(message: string, code: number, statusCode?: number) {
    super(message);
    this.name = 'LedgerWalletError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const LEDGER_ERROR_CODES = {
  DEVICE_NOT_FOUND: 0x6985,
  USER_REJECTED: 0x6986,
  APP_NOT_OPEN: 0x6e00,
  DEVICE_LOCKED: 0x5515,
  TRANSPORT_ERROR: 0x6f00,
  INVALID_DATA: 0x6a80,
  CONDITIONS_NOT_SATISFIED: 0x6985,
} as const;

export const LEDGER_DERIVATION_PATHS = {
  DEFAULT: "44'/501'/0'/0'",
  ACCOUNT_0: "44'/501'/0'/0'",
  ACCOUNT_1: "44'/501'/1'/0'",
  ACCOUNT_2: "44'/501'/2'/0'",
} as const;

let transport: any = null;
let solanaApp: any = null;

export async function initializeLedgerTransport(): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      throw new LedgerWalletError('Ledger not supported in server environment', LEDGER_ERROR_CODES.TRANSPORT_ERROR);
    }

    const TransportWebHID = (await import('@ledgerhq/hw-transport-webhid')).default;
    transport = await TransportWebHID.create();
    
    const SolanaApp = (await import('@ledgerhq/hw-app-solana')).default;
    solanaApp = new SolanaApp(transport);
  } catch (error) {
    throw new LedgerWalletError(
      `Failed to initialize Ledger transport: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LEDGER_ERROR_CODES.TRANSPORT_ERROR
    );
  }
}

export async function disconnectLedger(): Promise<void> {
  try {
    if (transport) {
      await transport.close();
      transport = null;
      solanaApp = null;
    }
  } catch (error) {
    console.warn('Error disconnecting Ledger:', error);
  }
}

export async function isLedgerSupported(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    return 'hid' in navigator && typeof navigator.hid.requestDevice === 'function';
  } catch {
    return false;
  }
}

export async function detectLedgerDevices(): Promise<LedgerDevice[]> {
  try {
    if (!await isLedgerSupported()) {
      return [];
    }

    const devices = await navigator.hid.getDevices();
    const ledgerDevices = devices.filter(device => 
      device.vendorId === 0x2c97 || device.productName?.toLowerCase().includes('ledger')
    );

    return ledgerDevices.map((device, index) => ({
      id: device.productId?.toString() || `ledger-${index}`,
      name: device.productName || 'Ledger Device',
      connected: device.opened || false,
    }));
  } catch (error) {
    throw new LedgerWalletError(
      `Failed to detect Ledger devices: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LEDGER_ERROR_CODES.DEVICE_NOT_FOUND
    );
  }
}

export async function connectLedger(): Promise<LedgerDevice> {
  try {
    await initializeLedgerTransport();
    
    const publicKey = await getLedgerPublicKey();
    
    return {
      id: 'ledger-main',
      name: 'Ledger Nano',
      connected: true,
      publicKey,
    };
  } catch (error) {
    if (error instanceof LedgerWalletError) {
      throw error;
    }
    throw new LedgerWalletError(
      `Failed to connect to Ledger: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LEDGER_ERROR_CODES.DEVICE_NOT_FOUND
    );
  }
}

export async function getLedgerPublicKey(derivationPath: string = LEDGER_DERIVATION_PATHS.DEFAULT): Promise<PublicKey> {
  try {
    if (!solanaApp) {
      await initializeLedgerTransport();
    }

    const result = await solanaApp.getAddress(derivationPath);
    return new PublicKey(result.address);
  } catch (error) {
    if (error instanceof Error && error.message.includes('0x6e00')) {
      throw new LedgerWalletError(
        'Solana app is not open on Ledger device',
        LEDGER_ERROR_CODES.APP_NOT_OPEN
      );
    }
    if (error instanceof Error && error.message.includes('0x5515')) {
      throw new LedgerWalletError(
        'Ledger device is locked',
        LEDGER_ERROR_CODES.DEVICE_LOCKED
      );
    }
    throw new LedgerWalletError(
      `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LEDGER_ERROR_CODES.TRANSPORT_ERROR
    );
  }
}

export async function signTransactionWithLedger(
  transaction: Transaction | VersionedTransaction,
  derivationPath: string = LEDGER_DERIVATION_PATHS.DEFAULT
): Promise<LedgerSignatureResult> {
  try {
    if (!solanaApp) {
      await initializeLedgerTransport();
    }

    let serializedTransaction: Buffer;
    
    if (transaction instanceof VersionedTransaction) {
      serializedTransaction = Buffer.from(transaction.serialize());
    } else {
      serializedTransaction = transaction.serializeMessage();
    }

    const result = await solanaApp.signTransaction(derivationPath, serializedTransaction);
    const publicKey = await getLedgerPublicKey(derivationPath);

    return {
      signature: result.signature,
      publicKey,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('0x6986')) {
      throw new LedgerWalletError(
        'Transaction rejected by user',
        LEDGER_ERROR_CODES.USER_REJECTED
      );
    }
    if (error instanceof Error && error.message.includes('0x6e00')) {
      throw new LedgerWalletError(
        'Solana app is not open on Ledger device',
        LEDGER_ERROR_CODES.APP_NOT_OPEN
      );
    }
    if (error instanceof Error && error.message.includes('0x5515')) {
      throw new LedgerWalletError(
        'Ledger device is locked',
        LEDGER_ERROR_CODES.DEVICE_LOCKED
      );
    }
    throw new LedgerWalletError(
      `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LEDGER_ERROR_CODES.TRANSPORT_ERROR
    );
  }
}

export async function signMessageWithLedger(
  message: Uint8Array,
  derivationPath: string = LEDGER_DERIVATION_PATHS.DEFAULT
): Promise<LedgerSignatureResult> {
  try {
    if (!solanaApp) {
      await initializeLedgerTransport();
    }

    const result = await solanaApp.signOffchainMessage(derivationPath, message);
    const publicKey = await getLedgerPublicKey(derivationPath);

    return {
      signature: result.signature,
      publicKey,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('0x6986')) {
      throw new LedgerWalletError(
        'Message signing rejected by user',
        LEDGER_ERROR_CODES.USER_REJECTED
      );
    }
    if (error instanceof Error && error.message.includes('0x6e00')) {
      throw new LedgerWalletError(
        'Solana app is not open on Ledger device',
        LEDGER_ERROR_CODES.APP_NOT_OPEN
      );
    }
    throw new LedgerWalletError(
      `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LEDGER_ERROR_CODES.TRANSPORT_ERROR
    );
  }
}

export async function getLedgerAppVersion(): Promise<{ version: string; flags: number }> {
  try {
    if (!solanaApp) {
      await initializeLedgerTransport();
    }

    return await solanaApp.getAppConfiguration();
  } catch (error) {
    throw new LedgerWalletError(
      `Failed to get app version: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LEDGER_ERROR_CODES.TRANSPORT_ERROR
    );
  }
}

export function parseLedgerError(error: any): LedgerWalletError {
  if (error instanceof LedgerWalletError) {
    return error;
  }

  const statusCode = error?.statusCode || error?.returnCode;
  
  switch (statusCode) {
    case LEDGER_ERROR_CODES.USER_REJECTED:
      return new LedgerWalletError('User rejected the request', LEDGER_ERROR_CODES.USER_REJECTED, statusCode);
    case LEDGER_ERROR_CODES.APP_NOT_OPEN:
      return new LedgerWalletError('Solana app is not open on Ledger device', LEDGER_ERROR_CODES.APP_NOT_OPEN, statusCode);
    case LEDGER_ERROR_CODES.DEVICE_LOCKED:
      return new LedgerWalletError('Ledger device is locked', LEDGER_ERROR_CODES.DEVICE_LOCKED, statusCode);
    case LEDGER_ERROR_CODES.CONDITIONS_NOT_SATISFIED:
      return new LedgerWalletError('Conditions not satisfied', LEDGER_ERROR_CODES.CONDITIONS_NOT_SATISFIED, statusCode);
    case LEDGER_ERROR_CODES.INVALID_DATA:
      return new LedgerWalletError('Invalid data provided', LEDGER_ERROR_CODES.INVALID_DATA, statusCode);
    default:
      return new LedgerWalletError(
        error?.message || 'Unknown Ledger error',
        LEDGER_ERROR_CODES.TRANSPORT_ERROR,
        statusCode
      );
  }
}

export const ledgerUtils = {
  initializeLedgerTransport,
  disconnectLedger,
  isLedgerSupported,
  detectLedgerDevices,
  connectLedger,
  getLedgerPublicKey,
  signTransactionWithLedger,
  signMessageWithLedger,
  getLedgerAppVersion,
  parseLedgerError,
};

export default ledgerUtils;
```