import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { getTokensForChain, TokenConfig } from '@/lib/tokens';
import { getChainById } from '@/lib/chains';

interface SwapSupportedTokensModalProps {
  open: boolean;
  onClose: () => void;
  chainId: number;
  onSelect?: (token: TokenConfig) => void;
}

// Hardcoded popular tokens per chain (by symbol)
const POPULAR_TOKENS: Record<number, string[]> = {
  1: ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'WETH', 'APE', 'LINK', 'ARB', 'UNI', 'MKR', 'AAVE', 'LDO', 'CRV', 'FRAX', 'SUSHI', 'COMP', 'SNX', 'GRT', '1INCH', 'TUSD'],
  56: ['BNB', 'WBNB', 'USDC', 'USDT', 'DAI', 'BUSD', 'CAKE', 'ADA', 'DOT', 'LINK', 'UNI', 'AAVE', 'SUSHI', 'CRV', 'FRAX', 'COMP', 'SNX', 'GRT', '1INCH', 'TUSD', 'BETH', 'BTCB'],
  42161: ['ETH', 'USDC', 'USDT', 'ARB', 'DAI', 'WETH', 'LINK', 'RDNT', 'MAGIC', 'GMX', 'UNI', 'AAVE', 'FRAX', 'LDO', 'CRV', 'SUSHI'],
  8453: ['ETH', 'USDC', 'USDbC', 'DAI', 'WETH', 'cbETH', 'rETH', 'UNI', 'AAVE', 'CRV', 'LDO', 'FRAX'],
  137: ['MATIC', 'USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'AAVE', 'QUICK', 'SUSHI', 'CRV', 'FRAX', 'UNI', 'LINK'],
  43114: ['AVAX', 'USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'JOE', 'QI', 'SUSHI', 'CRV', 'FRAX', 'UNI', 'LINK'],
  10: ['ETH', 'USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'OP', 'VELO', 'SNX', 'AAVE', 'CRV', 'FRAX', 'UNI', 'LDO'],
};

export default function SwapSupportedTokensModal({ open, onClose, chainId, onSelect }: SwapSupportedTokensModalProps) {
  const [search, setSearch] = useState('');
  const tokens = useMemo(() => getTokensForChain(chainId), [chainId]);
  const popularSymbols = POPULAR_TOKENS[chainId] || [];
  const popularTokens = tokens.filter(t => popularSymbols.includes(t.symbol));
  const [showAllPopular, setShowAllPopular] = useState(false);

  // Reset showAllPopular to false whenever the modal is opened
  useEffect(() => {
    if (open) setShowAllPopular(false);
  }, [open]);

  const filteredTokens = useMemo(() => {
    if (!search) return tokens;
    const s = search.toLowerCase();
    return tokens.filter(t => t.symbol.toLowerCase().includes(s) || t.name.toLowerCase().includes(s));
  }, [tokens, search]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supported Tokens on {getChainById(chainId)?.name || chainId}</DialogTitle>
        </DialogHeader>
        <div className="mb-2">
          <Input
            placeholder="Search token by symbol or name"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="mb-4">
          <div className="font-semibold mb-1">Popular Tokens</div>
          {showAllPopular ? (
            <div className="max-h-[30vh] overflow-y-auto grid grid-cols-2 gap-2 mb-2">
              {tokens.map(token => (
                <TokenRow key={token.address} token={token} onSelect={onSelect} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {popularTokens.slice(0, 10).map(token => (
                <TokenRow key={token.address} token={token} onSelect={onSelect} />
              ))}
            </div>
          )}
          {tokens.length > 10 && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs px-2 py-1"
              onClick={() => setShowAllPopular(v => !v)}
            >
              {showAllPopular ? 'Show less' : 'See all'}
            </Button>
          )}
        </div>
        {search && (
          <>
            <div className="font-semibold mb-1">Search Results</div>
            <div className="max-h-[40vh] overflow-y-auto border rounded p-2 bg-muted">
              {filteredTokens.length === 0 ? (
                <div className="text-muted-foreground text-sm">No tokens found.</div>
              ) : (
                filteredTokens.slice(0, 100).map(token => (
                  <TokenRow key={token.address} token={token} onSelect={onSelect} />
                ))
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Showing {filteredTokens.length > 100 ? 100 : filteredTokens.length} of {filteredTokens.length} tokens.</div>
          </>
        )}
        <Button className="mt-4 w-full" variant="outline" onClick={onClose}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}

function TokenRow({ token, onSelect }: { token: TokenConfig, onSelect?: (token: TokenConfig) => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(token.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };
  return (
    <div className="flex items-center gap-2 p-1 hover:bg-accent rounded cursor-pointer group" onClick={() => onSelect?.(token)}>
      {token.logoURI && <img src={token.logoURI} alt={token.symbol} className="w-5 h-5 rounded" />}
      <div className="flex-1">
        <span className="font-medium">{token.symbol}</span>
        <span className="ml-1 text-xs text-muted-foreground">{token.name}</span>
      </div>
      <button
        className="text-xs text-muted-foreground px-1 py-0.5 border rounded hover:bg-muted"
        onClick={e => { e.stopPropagation(); handleCopy(); }}
        title="Copy address"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
} 