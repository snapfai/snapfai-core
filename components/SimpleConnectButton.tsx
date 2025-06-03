'use client'

// Declare the custom elements for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        balance?: 'show' | 'hide';
        size?: 'md' | 'sm';
        label?: string;
        loadingLabel?: string;
        namespace?: 'eip155' | 'solana' | 'bip122';
      }, HTMLElement>;
    }
  }
}

export default function SimpleConnectButton() {
  return (
    <appkit-button 
      balance="show" 
      label="Connect" 
      loadingLabel="Connecting..." 
      namespace="eip155"
    />
  )
} 