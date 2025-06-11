'use client';

import { useState } from 'react';
import Terminal from './Terminal';
import SideBar from './SideBar';
import CpuTab from './CpuTab';
import DiskTab from './DiskTab';
import AnthropicTab from './AnthropicTab';

export default function WebVM() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(activeTab === tab.toLowerCase() ? null : tab.toLowerCase());
  };

  return (
    <div className="flex h-screen bg-neutral-900 text-white">
      <SideBar onTabChange={handleTabChange} activeTab={activeTab || ''} />
      
      <div className="flex-1 flex">
        <Terminal />
        
        {/* Side panels */}
        {activeTab && (
          <div className="w-96 border-l border-neutral-700 overflow-hidden">
            {activeTab === 'cpu' && <CpuTab />}
            {activeTab === 'disk' && <DiskTab />}
            {activeTab === 'claudeai' && <AnthropicTab />}
          </div>
        )}
      </div>
    </div>
  );
} 