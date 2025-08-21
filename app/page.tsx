"use client";

import Link from "next/link"
import { ArrowRight, MessageSquare, Layers, Coins, Clock, BarChart3, Zap, Brain, Sparkles, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import HomeClientWrapper from "@/components/HomeClientWrapper"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeClientWrapper>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-snapfai-white via-snapfai-sand to-snapfai-lightyellow dark:from-snapfai-navy dark:via-gray-900 dark:to-black" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-snapfai-amber/10 dark:bg-snapfai-amber/20 rounded-full mb-4">
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-snapfai-amber" />
                <span className="text-xs md:text-sm font-medium">Powered by AI and blockchain intelligence</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 md:mb-6 dark:text-white">
                Your Smart, Easy, and Magical DeFi Experience
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-200 mb-6 md:mb-8">
                Interact with DeFi through natural language. Swap tokens, lend assets, and explore yield farming with a
                simple chat interface.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Link href="/snap" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-snapfai-black hover:bg-snapfai-black/90 text-white dark:bg-snapfai-amber dark:hover:bg-snapfai-amber/90 dark:text-snapfai-black">
                    Start Using SnapFAI <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                {/* Portfolio button hidden per requirements */}
                <Link href="https://docs.snapfai.com" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto dark:border-gray-700 dark:text-gray-200">
                    Read Docs
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative mx-auto max-w-4xl rounded-xl border shadow-lg bg-white dark:bg-gray-800 dark:border-gray-700">
              <div className="p-3 md:p-4 border-b bg-snapfai-sand/50 dark:bg-gray-700 dark:border-gray-600 rounded-t-xl flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-red-500" />
                  <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-yellow-500" />
                  <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-green-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-snapfai-amber/20 text-snapfai-black dark:text-snapfai-amber px-2 py-0.5 rounded-full">SnapFAI</span>
                </div>
              </div>
              <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="flex gap-3 md:gap-4">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-snapfai-amber flex items-center justify-center flex-shrink-0">
                    <Zap className="h-3 w-3 md:h-4 md:w-4 text-snapfai-black" />
                  </div>
                  <div className="bg-snapfai-sand dark:bg-gray-700 rounded-lg p-2.5 md:p-3 max-w-[85%] shadow-sm">
                    <p className="text-xs md:text-sm dark:text-gray-200">How can I help you with DeFi today?</p>
                  </div>
                </div>
                <div className="flex gap-3 md:gap-4 justify-end">
                  <div className="bg-snapfai-lightyellow dark:bg-snapfai-amber/20 rounded-lg p-2.5 md:p-3 max-w-[85%] shadow-sm">
                    <p className="text-xs md:text-sm dark:text-gray-200">I want to swap 500 USDT to ETH on Arbitrum</p>
                  </div>
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-snapfai-silver dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs md:text-sm font-medium dark:text-white">U</span>
                  </div>
                </div>
                <div className="flex gap-3 md:gap-4">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-snapfai-amber flex items-center justify-center flex-shrink-0">
                    <Zap className="h-3 w-3 md:h-4 md:w-4 text-snapfai-black" />
                  </div>
                  <div className="bg-snapfai-sand dark:bg-gray-700 rounded-lg p-2.5 md:p-3 max-w-[85%] shadow-sm">
                    <p className="text-xs md:text-sm dark:text-gray-200">
                      I found the best rate on 1inch: 500 USDT ≈ 0.1243 ETH. Would you like to proceed with this swap?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Badges Section */}
        <section className="py-8 md:py-12 bg-white dark:bg-gray-900">
          <div className="container">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl lg:text-xl font-bold mb-4 dark:text-white">Supported by</h2>
            </div>
            <div className="flex overflow-x-auto gap-6 md:gap-8 pb-4 md:pb-0 scrollbar-hide justify-center">
              <div className="flex-none flex justify-center">
                {/* Google for Startups Badge */}
                <div className="bg-white rounded-lg shadow-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <img 
                    src="/images/startups_gpxYjQP.max-2500x2500.jpg" 
                    alt="Google for Startups" 
                    className="h-16 md:h-20 object-contain"
                  />
                </div>
              </div>

              <div className="flex-none flex justify-center">
                {/* NVIDIA Inception Program Badge */}
                <div className="bg-white rounded-lg shadow-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <img 
                    src="/images/nvidia-inception-logo.png" 
                    alt="NVIDIA Inception Program" 
                    className="h-16 md:h-20 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Slogan Section */}
        <section className="py-8 md:py-12 bg-snapfai-black text-white dark:bg-snapfai-amber dark:text-snapfai-black">
          <div className="container text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">Doing DeFi like a Snap</h2>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-20">
          <div className="container">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 dark:text-white">Powerful Features</h2>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                SnapFAI transforms how you engage with decentralized finance through these key capabilities
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <FeatureCard
                icon={<Layers className="h-6 w-6 text-snapfai-amber" />}
                title="Cross-Chain Interactions"
                description="Effortlessly connect and transact across multiple blockchains with seamless integrations like LayerZero and deBridge."
              />
              <FeatureCard
                icon={<Coins className="h-6 w-6 text-snapfai-amber" />}
                title="Borrow & Earn"
                description="Maximize your DeFi returns with smart borrowing and earning tools across Aave, Compound, SparkFi, and more."
              />
              <FeatureCard
                icon={<MessageSquare className="h-6 w-6 text-snapfai-amber" />}
                title="Smart Swaps"
                description="Get the best rates with swap aggregators like 0x, 1inch, and ParaSwap, all through a magical chat interface."
              />
              <FeatureCard
                icon={<Clock className="h-6 w-6 text-snapfai-amber" />}
                title="Automation & Triggers"
                description="Set up time-based, gas-based, and price-based triggers to automate your DeFi activities."
              />
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6 text-snapfai-amber" />}
                title="Real-Time Insights"
                description="Make smarter decisions with actionable insights from price tracking and sentiment analysis."
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6 text-snapfai-amber" />}
                title="Multi-Source Data"
                description="Stay informed with comprehensive data aggregated from social channels, documentation, and development sources."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-20 bg-snapfai-sand/50 dark:bg-gray-900">
          <div className="container">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 dark:text-white">How SnapFAI Works</h2>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Experience the simplicity of DeFi through natural language interaction
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-snapfai-amber/80 dark:bg-snapfai-amber flex items-center justify-center mb-4 shadow-md">
                  <span className="text-xl md:text-2xl font-bold text-snapfai-black">1</span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 dark:text-white">Ask SnapFAI</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">Simply type what you want to do in natural language</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-snapfai-amber/80 dark:bg-snapfai-amber flex items-center justify-center mb-4 shadow-md">
                  <span className="text-xl md:text-2xl font-bold text-snapfai-black">2</span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 dark:text-white">Get Smart Recommendations</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                  SnapFAI analyzes multiple protocols to find the best options
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-snapfai-amber/80 dark:bg-snapfai-amber flex items-center justify-center mb-4 shadow-md">
                  <span className="text-xl md:text-2xl font-bold text-snapfai-black">3</span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 dark:text-white">Execute Seamlessly</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">Confirm and execute transactions with minimal effort</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 dark:text-white">Ready to Experience DeFi Like Magic?</h2>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 md:mb-8">
                Join SnapFAI today and transform how you interact with decentralized finance.
              </p>
              <Link href="/snap">
                <Button size="lg" className="bg-snapfai-black hover:bg-snapfai-black/90 text-white dark:bg-snapfai-amber dark:hover:bg-snapfai-amber/90 dark:text-snapfai-black">
                  Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12 bg-snapfai-sand/30 dark:bg-gray-900 dark:border-gray-800">
        <div className="container">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="h-6 w-6 text-snapfai-black dark:text-snapfai-amber" />
              <span className="text-lg md:text-xl font-bold dark:text-white">SnapFAI</span>
            </div>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4">AI-powered DeFi for the future of finance</p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} SnapFAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </HomeClientWrapper>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <div className="mb-3 md:mb-4">{icon}</div>
        <CardTitle className="text-lg md:text-xl dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm md:text-base dark:text-gray-300">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
