"use client"

import { TokenHolding, formatCurrency } from '@/hooks/usePortfolio'

interface PortfolioAnalysisProps {
  holdings: TokenHolding[]
  minValue?: number
}

export function PortfolioAnalysis({ holdings, minValue = 1 }: PortfolioAnalysisProps) {
  // Filter tokens with value over the minimum threshold
  const highValueTokens = holdings.filter(holding => holding.valueUSD >= minValue)
  
  // Sort by value descending
  const sortedTokens = highValueTokens.sort((a, b) => b.valueUSD - a.valueUSD)
  
  const totalValue = highValueTokens.reduce((sum, token) => sum + token.valueUSD, 0)
  
  if (sortedTokens.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">
          No tokens found with value over ${minValue}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
        <h3 className="font-semibold mb-2">
          🏆 High Value Assets (${minValue}+)
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Count:</span>
            <span className="ml-1 font-medium">{sortedTokens.length} tokens</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
            <span className="ml-1 font-medium text-green-600 dark:text-green-400">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {sortedTokens.map((holding, index) => (
          <div key={`${holding.token.address}-${holding.chainId}`} 
               className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold text-gray-500 dark:text-gray-400 w-6">
                #{index + 1}
              </span>
              <div>
                <div className="font-medium">{holding.token.symbol}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {holding.token.name} • {holding.chain}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(holding.valueUSD)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {holding.balance} {holding.token.symbol}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Utility function for programmatic analysis
export function analyzePortfolio(holdings: TokenHolding[], minValue: number = 1) {
  const highValueTokens = holdings
    .filter(holding => holding.valueUSD >= minValue)
    .sort((a, b) => b.valueUSD - a.valueUSD)
  
  const totalValue = highValueTokens.reduce((sum, token) => sum + token.valueUSD, 0)
  const totalHoldings = holdings.length
  const percentage = totalHoldings > 0 ? (highValueTokens.length / totalHoldings) * 100 : 0
  
  return {
    tokens: highValueTokens,
    count: highValueTokens.length,
    totalValue,
    percentage: Math.round(percentage),
    summary: `${highValueTokens.length} of ${totalHoldings} tokens (${Math.round(percentage)}%) have value ≥ $${minValue}`
  }
} 