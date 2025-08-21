import { Inter } from "next/font/google"
import { headers } from 'next/headers'
import { ContextProvider } from '@/context'
import Header from '@/components/Header'
import { Providers } from '@/components/providers'

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "SnapFAI - Your Smart, Easy, and Magical DeFi Experience",
  description:
    "SnapFAI is a revolutionary interaction layer that transforms how you engage with decentralized finance (DeFi). Powered by conversational AI and real-time data aggregation.",
  icons: {
    icon: '/images/SnapFAI_Logo.png',
    shortcut: '/images/SnapFAI_Logo.png',
    apple: '/images/SnapFAI_Logo.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ContextProvider cookies={cookies || undefined}>
          <Providers>
            <Header />
            <main className="min-h-[calc(100vh-64px)]">{children}</main>
          </Providers>
        </ContextProvider>
      </body>
    </html>
  )
}
