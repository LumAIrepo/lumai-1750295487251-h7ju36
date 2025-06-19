import React from "react"
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/wallet-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PhantomSecure - Decentralized Prediction Markets',
  description: 'Secure and transparent prediction markets on Solana',
  keywords: ['prediction markets', 'solana', 'defi', 'blockchain', 'betting'],
  authors: [{ name: 'PhantomSecure Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#9945FF',
  openGraph: {
    title: 'PhantomSecure - Decentralized Prediction Markets',
    description: 'Secure and transparent prediction markets on Solana',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PhantomSecure - Decentralized Prediction Markets',
    description: 'Secure and transparent prediction markets on Solana',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} antialiased bg-[#0F0F23] text-white min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <WalletProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">
                {children}
              </div>
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a1a2e',
                  border: '1px solid #9945FF',
                  color: '#ffffff',
                },
              }}
            />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```