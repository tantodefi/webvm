"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
  useClose,
  useViewProfile,
  useNotification,
} from "@coinbase/onchainkit/minikit";
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from "@coinbase/onchainkit/wallet";
import { Button, Card, Icon } from "./components/DemoComponents";
import Terminal from "./components/Terminal";
import MemoryTab from "./components/MemoryTab";
import AnthropicTab from "./components/AnthropicTab";
import ProfilePage from "./components/ProfilePage";
import { useNetworkStore, createNetworkInterface } from "./utils/network";

type TabType = 'terminal' | 'memory' | 'claude' | 'network';

export default function Page() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const { address } = useAccount();
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();
  const close = useClose();
  const viewProfile = useViewProfile();
  const sendNotification = useNotification();
  
  const [activeTab, setActiveTab] = useState<TabType>('terminal');
  const [showProfile, setShowProfile] = useState(false);
  const networkStore = useNetworkStore();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = async () => {
    try {
      const result = await addFrame();
      if (result) {
        console.log('Frame added:', result.url, result.token);
        await sendNotification({
          title: 'WebVM Mini App Added! 🚀',
          body: 'Access your Linux terminal anytime from Farcaster!'
        });
      }
    } catch (error) {
      console.error('Failed to add frame:', error);
    }
  };

  const handleNetworkConnect = async () => {
    try {
      await createNetworkInterface();
    } catch (error) {
      console.error('Network connection failed:', error);
    }
  };

  const saveFrameButton = context?.client.added ? (
    <span className="text-green-400 text-xs font-medium">SAVED</span>
  ) : (
    <button
      type="button"
      className="cursor-pointer bg-transparent font-semibold text-xs text-[var(--app-accent)] hover:text-[var(--app-accent-hover)]"
      onClick={handleAddFrame}
    >
      + SAVE
    </button>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'memory':
        return <MemoryTab />;
      case 'claude':
        return <AnthropicTab />;
      case 'network':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--app-foreground)]">Network Status</h2>
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--app-foreground)]">Connection Status:</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    networkStore.connectionState === 'CONNECTED' 
                      ? 'bg-green-500/20 text-green-400' 
                      : networkStore.connectionState === 'ERROR'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {networkStore.connectionState}
                  </span>
                </div>
                
                {networkStore.currentIp && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--app-foreground)]">IP Address:</span>
                    <code className="text-xs bg-[var(--app-gray)] px-2 py-1 rounded text-[var(--app-foreground)]">{networkStore.currentIp}</code>
                  </div>
                )}

                <Button
                  variant={networkStore.connectionState === 'CONNECTED' ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleNetworkConnect}
                  disabled={networkStore.connectionState === 'CONNECTING' || networkStore.connectionState === 'DOWNLOADING'}
                  className="w-full"
                >
                  {networkStore.connectionState === 'DISCONNECTED' && 'Connect to Network'}
                  {networkStore.connectionState === 'DOWNLOADING' && 'Downloading...'}
                  {networkStore.connectionState === 'CONNECTING' && 'Connecting...'}
                  {networkStore.connectionState === 'CONNECTED' && 'Reconnect'}
                  {networkStore.connectionState === 'ERROR' && 'Retry Connection'}
                </Button>

                {networkStore.dashboardUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUrl(networkStore.dashboardUrl!)}
                    className="w-full"
                  >
                    Open Dashboard
                  </Button>
                )}
              </div>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--app-background)] text-[var(--app-foreground)] max-w-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[var(--app-card-bg)] border-b border-[var(--app-card-border)] backdrop-blur-md shrink-0">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-bold text-[var(--app-foreground)]">FarTerm</h1>
          <span className="text-xs text-[var(--app-foreground-muted)] bg-[var(--app-accent-light)] px-2 py-1 rounded-full">
            v1.0
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {address ? (
            <Wallet>
              <WalletDropdown>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          ) : (
            <ConnectWallet className="text-xs px-2 py-1 bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[var(--app-background)] rounded-lg font-medium transition-colors" />
          )}
          {saveFrameButton}
          <button
            type="button"
            className="cursor-pointer bg-transparent font-semibold text-xs text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]"
            onClick={() => setShowProfile(true)}
          >
            PROFILE
          </button>
          <button
            type="button"
            className="cursor-pointer bg-transparent font-semibold text-xs text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]"
            onClick={close}
          >
            ✕
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="flex px-2 py-2 bg-[var(--app-card-bg)] border-b border-[var(--app-card-border)] overflow-x-auto shrink-0">
        {[
          { id: 'terminal', label: 'Terminal', icon: '🖥️' },
          { id: 'memory', label: 'Memory', icon: '💾' },
          { id: 'claude', label: 'Claude', icon: '🤖' },
          { id: 'network', label: 'Network', icon: '🌐' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center space-x-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[var(--app-accent)] text-[var(--app-background)]'
                : 'text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] hover:bg-[var(--app-accent-light)]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content Area - Full Screen */}
      <main className="flex-1 overflow-hidden relative">
        {/* Terminal - Always mounted, show/hide with CSS */}
        <div className={`absolute inset-0 p-4 ${activeTab === 'terminal' ? 'block' : 'hidden'}`}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--app-foreground)]">Linux Terminal</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-[var(--app-foreground-muted)]">Ready</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <Terminal className="h-full" />
            </div>
          </div>
        </div>

        {/* Other tabs - rendered only when active */}
        {activeTab !== 'terminal' && (
          <div className="absolute inset-0 p-4">
            {renderTabContent()}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-2 bg-[var(--app-card-bg)] border-t border-[var(--app-card-border)] backdrop-blur-md shrink-0">
        <div className="flex items-center justify-center">
          <button
            type="button"
            className="text-xs text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)] transition-colors font-medium"
            onClick={() => openUrl('https://base.org/builders/minikit')}
          >
            BUILT WITH MINIKIT
          </button>
        </div>
      </footer>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--app-background)] border border-[var(--app-card-border)] rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ProfilePage onClose={() => setShowProfile(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
