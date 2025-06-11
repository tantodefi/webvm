'use client';

import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { useViewProfile } from '@coinbase/onchainkit/minikit';
import { Card, Button } from './DemoComponents';

interface ProfilePageProps {
  onClose?: () => void;
}

export default function ProfilePage({ onClose }: ProfilePageProps) {
  const { address, isConnected, connector } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const viewProfile = useViewProfile();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: any) => {
    if (!balance) return '0 ETH';
    const value = parseFloat(balance.formatted);
    return `${value.toFixed(4)} ${balance.symbol}`;
  };

  return (
    <div className="h-full flex flex-col space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--app-foreground)]">Profile</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-6">
          {/* Wallet Information */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--app-foreground)]">Smart Wallet</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--app-foreground)]">Address</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-[var(--app-gray)] px-2 py-1 rounded text-[var(--app-foreground)]">
                      {formatAddress(address!)}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(address!)}
                      className="text-xs text-[var(--app-accent)] hover:text-[var(--app-accent-hover)]"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--app-foreground)]">Balance</span>
                  <span className="text-sm font-mono text-[var(--app-foreground)]">
                    {formatBalance(balance)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--app-foreground)]">Connector</span>
                  <span className="text-sm text-[var(--app-foreground)]">
                    {connector?.name || 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--app-foreground)]">Network</span>
                  <span className="text-sm text-[var(--app-foreground)]">
                    Base Mainnet
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Wallet Actions */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--app-foreground)]">Wallet Actions</h3>
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => viewProfile()}
                  variant="outline"
                  className="w-full justify-start"
                >
                  👤 View Farcaster Profile
                </Button>
                
                <Button
                  onClick={() => window.open(`https://basescan.org/address/${address}`, '_blank')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  🔍 View on Basescan
                </Button>
                
                <Button
                  onClick={() => navigator.clipboard.writeText(address!)}
                  variant="outline"
                  className="w-full justify-start"
                >
                  📋 Copy Address
                </Button>
                
                <Button
                  onClick={() => disconnect()}
                  variant="outline"
                  className="w-full justify-start text-red-400 hover:text-red-300 border-red-400/30 hover:border-red-300/50"
                >
                  🚪 Disconnect Wallet
                </Button>
              </div>
            </div>
          </Card>

          {/* WebVM Session Info */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--app-foreground)]">Session Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--app-foreground)]">App Version</span>
                  <span className="text-sm text-[var(--app-foreground)]">v1.0.0</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--app-foreground)]">Platform</span>
                  <span className="text-sm text-[var(--app-foreground)]">Farcaster MiniKit</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--app-foreground)]">Runtime</span>
                  <span className="text-sm text-[var(--app-foreground)]">CheerpX WebVM</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--app-foreground)]">Session Started</span>
                  <span className="text-sm text-[var(--app-foreground)]">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="text-center py-8 space-y-4">
            <div className="text-4xl">🔌</div>
            <h3 className="text-lg font-semibold text-[var(--app-foreground)]">No Wallet Connected</h3>
            <p className="text-sm text-[var(--app-foreground-muted)]">
              Connect your smart wallet to view profile information and manage your account.
            </p>
            <Button
              onClick={onClose}
              variant="primary"
              className="mt-4"
            >
              Back to App
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
} 