import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/Header"
import { Toaster } from "@/components/ui/toaster"
import { headers } from 'next/headers'
import ContextProvider from '@/context'

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "SnapFAI - Your Smart, Easy, and Magical DeFi Experience",
  description:
    "SnapFAI is a revolutionary interaction layer that transforms how you engage with decentralized finance (DeFi). Powered by conversational AI and real-time data aggregation."
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ContextProvider cookies={cookies}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Header />
            <main className="min-h-[calc(100vh-64px)]">{children}</main>
            <Toaster />
          </ThemeProvider>
        </ContextProvider>
      </body>
    </html>
  )
}
