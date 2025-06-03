import SwapInterface from "@/components/SwapInterface";

export default function SwapPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Token Swap</h1>
          <p className="text-muted-foreground">
            Swap tokens at the best rates across multiple DEXs
          </p>
        </div>
        
        <SwapInterface />
      </div>
    </div>
  );
} 