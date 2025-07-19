import React from 'react';

export interface ChainIconProps {
  chainId: number;
  className?: string;
  size?: number;
}

export const ChainIcon: React.FC<ChainIconProps> = ({ chainId, className = '', size = 20 }) => {
  const iconStyle = {
    width: size,
    height: size,
    flexShrink: 0,
  };

  switch (chainId) {
    case 1: // Ethereum
      return (
        <svg style={iconStyle} className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#627EEA"/>
          <path d="M16.498 4v8.87l7.497 3.35-7.497-12.22z" fill="#fff" fillOpacity="0.602"/>
          <path d="M16.498 4L9 16.22l7.498-3.35V4z" fill="#fff"/>
          <path d="M16.498 21.968v6.027L24 17.616l-7.502 4.352z" fill="#fff" fillOpacity="0.602"/>
          <path d="M16.498 27.995v-6.028L9 17.616l7.498 10.38z" fill="#fff"/>
          <path d="M16.498 20.573l7.497-4.353-7.497-3.348v7.701z" fill="#fff" fillOpacity="0.2"/>
          <path d="M9 16.22l7.498 4.353v-7.701L9 16.22z" fill="#fff" fillOpacity="0.602"/>
        </svg>
      );
    
    case 42161: // Arbitrum
      return (
        <svg style={iconStyle} className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#2D374B"/>
          <path d="M16.0001 6.40002L25.6001 22.4H6.40012L16.0001 6.40002Z" fill="#28A0F0"/>
          <path d="M14.9334 12.8L19.7334 20.8H10.1334L14.9334 12.8Z" fill="#96BEDC"/>
          <path d="M20.2667 12.8L25.0667 20.8H15.4667L20.2667 12.8Z" fill="#96BEDC"/>
        </svg>
      );
    
    case 8453: // Base
      return (
        <svg style={iconStyle} className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#0052FF"/>
          <path d="M16 24C20.4183 24 24 20.4183 24 16C24 11.5817 20.4183 8 16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24Z" fill="#0052FF"/>
          <path d="M15.9998 21.6C19.0927 21.6 21.5998 19.0928 21.5998 16C21.5998 12.9072 19.0927 10.4 15.9998 10.4C12.907 10.4 10.3998 12.9072 10.3998 16C10.3998 19.0928 12.907 21.6 15.9998 21.6Z" fill="white"/>
          <path d="M15.9998 19.2C17.7673 19.2 19.1998 17.7675 19.1998 16C19.1998 14.2325 17.7673 12.8 15.9998 12.8C14.2323 12.8 12.7998 14.2325 12.7998 16C12.7998 17.7675 14.2323 19.2 15.9998 19.2Z" fill="#0052FF"/>
        </svg>
      );
    
    case 10: // Optimism
      return (
        <svg style={iconStyle} className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#FF0420"/>
          <path d="M12.2 19.6C11.4 19.6 10.8 19.2 10.4 18.4C10 17.6 10 16.8 10.4 16C10.8 15.2 11.4 14.8 12.2 14.8C13 14.8 13.6 15.2 14 16C14.4 16.8 14.4 17.6 14 18.4C13.6 19.2 13 19.6 12.2 19.6Z" fill="white"/>
          <path d="M19.8 19.6C19 19.6 18.4 19.2 18 18.4C17.6 17.6 17.6 16.8 18 16C18.4 15.2 19 14.8 19.8 14.8C20.6 14.8 21.2 15.2 21.6 16C22 16.8 22 17.6 21.6 18.4C21.2 19.2 20.6 19.6 19.8 19.6Z" fill="white"/>
        </svg>
      );
    
    case 43114: // Avalanche
      return (
        <svg style={iconStyle} className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#E84142"/>
          <path d="M20.8 20.8L16 12L11.2 20.8H20.8Z" fill="white"/>
          <path d="M18.4 17.6L16 14L13.6 17.6H18.4Z" fill="#E84142"/>
        </svg>
      );
    
    case 137: // Polygon
      return (
        <svg style={iconStyle} className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#8247E5"/>
          <path d="M20.8 13.6L17.6 11.2C16.8 10.8 15.2 10.8 14.4 11.2L11.2 13.6C10.4 14 10.4 14.8 11.2 15.2L14.4 17.6C15.2 18 16.8 18 17.6 17.6L20.8 15.2C21.6 14.8 21.6 14 20.8 13.6Z" fill="white"/>
          <path d="M20.8 18.4L17.6 16C16.8 15.6 15.2 15.6 14.4 16L11.2 18.4C10.4 18.8 10.4 19.6 11.2 20L14.4 22.4C15.2 22.8 16.8 22.8 17.6 22.4L20.8 20C21.6 19.6 21.6 18.8 20.8 18.4Z" fill="white"/>
        </svg>
      );
    
    case 11155111: // Sepolia
      return (
        <svg style={iconStyle} className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#627EEA" fillOpacity="0.7"/>
          <path d="M16.498 4v8.87l7.497 3.35-7.497-12.22z" fill="#fff" fillOpacity="0.602"/>
          <path d="M16.498 4L9 16.22l7.498-3.35V4z" fill="#fff"/>
          <path d="M16.498 21.968v6.027L24 17.616l-7.502 4.352z" fill="#fff" fillOpacity="0.602"/>
          <path d="M16.498 27.995v-6.028L9 17.616l7.498 10.38z" fill="#fff"/>
          <path d="M16.498 20.573l7.497-4.353-7.497-3.348v7.701z" fill="#fff" fillOpacity="0.2"/>
          <path d="M9 16.22l7.498 4.353v-7.701L9 16.22z" fill="#fff" fillOpacity="0.602"/>
          <text x="16" y="27" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">T</text>
        </svg>
      );
    
    default:
      // Generic blockchain icon
      return (
        <svg style={iconStyle} className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#6B7280"/>
          <path d="M16 8L20 12L16 16L12 12L16 8Z" fill="white"/>
          <path d="M16 16L20 20L16 24L12 20L16 16Z" fill="white" fillOpacity="0.7"/>
        </svg>
      );
  }
};

export const getChainName = (chainId: number): string => {
  switch (chainId) {
    case 1: return 'Ethereum';
    case 42161: return 'Arbitrum';
    case 8453: return 'Base';
    case 10: return 'Optimism';
    case 43114: return 'Avalanche';
    case 137: return 'Polygon';
    case 11155111: return 'Sepolia';
    default: return 'Unknown';
  }
};

export const getChainShortName = (chainId: number): string => {
  switch (chainId) {
    case 1: return 'ETH';
    case 42161: return 'ARB';
    case 8453: return 'BASE';
    case 10: return 'OP';
    case 43114: return 'AVAX';
    case 137: return 'MATIC';
    case 11155111: return 'SEP';
    default: return '?';
  }
}; 