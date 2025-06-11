'use client';

import { useState } from 'react';
import { useActivityStore } from '../utils/activities';
import SmallButton from './SmallButton';

interface SideBarProps {
  children?: React.ReactNode;
  onTabChange: (tab: string) => void;
  activeTab: string;
  handleTool?: (tool: any) => Promise<any>;
}

export default function SideBar({ children, onTabChange, activeTab, handleTool }: SideBarProps) {
  const [sideBarPinned, setSideBarPinned] = useState(false);
  const [activeInfo, setActiveInfo] = useState<string | null>(null);
  const { cpuActivity, diskActivity, aiActivity } = useActivityStore();

  const icons = [
    { icon: 'fas fa-info-circle', info: 'Information', activity: null },
    { icon: 'fas fa-wifi', info: 'Networking', activity: null },
    { icon: 'fas fa-microchip', info: 'CPU', activity: cpuActivity },
    { icon: 'fas fa-compact-disc', info: 'Disk', activity: diskActivity },
    { icon: 'fas fa-robot', info: 'ClaudeAI', activity: aiActivity },
    null, // Separator
    { icon: 'fas fa-book-open', info: 'Docs', activity: null },
    { icon: 'fab fa-discord', info: 'Community', activity: null },
    { icon: 'fab fa-github', info: 'GitHub', activity: null },
  ];

  const handleMouseEnter = (info: string) => {
    if (!sideBarPinned) {
      setActiveInfo(info);
    }
  };

  const handleMouseLeave = () => {
    if (!sideBarPinned) {
      setActiveInfo(null);
    }
  };

  const handleIconClick = (info: string) => {
    if (sideBarPinned) {
      setActiveInfo(activeInfo === info ? null : info);
    } else {
      setActiveInfo(info);
    }
    onTabChange(info.toLowerCase());
  };

  const toggleSidebarPin = () => {
    setSideBarPinned(!sideBarPinned);
  };

  return (
    <div className="fixed inset-y-0 left-0 flex">
      {/* Icons sidebar */}
      <div className="w-16 bg-neutral-800 flex flex-col items-center py-4 gap-4">
        {icons.map((item, index) => 
          item === null ? (
            <hr key={index} className="w-8 border-t border-neutral-600" />
          ) : (
            <button
              key={index}
              className={`w-12 h-12 rounded-lg flex items-center justify-center relative
                ${activeInfo === item.info ? 'bg-neutral-700' : 'hover:bg-neutral-700'}
                ${item.activity ? 'text-green-500' : 'text-white'}`}
              onMouseEnter={() => handleMouseEnter(item.info)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleIconClick(item.info)}
              title={item.info}
            >
              <i className={`${item.icon} text-xl`}></i>
              {item.activity && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </button>
          )
        )}

        {/* Social links */}
        <div className="mt-auto space-y-4">
          <a
            href="https://github.com/yourusername/farterm"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-neutral-700"
          >
            <i className="fab fa-github text-xl"></i>
          </a>
          <a
            href="https://x.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-neutral-700"
          >
            <i className="fab fa-x-twitter text-xl"></i>
          </a>
          <a
            href="https://web3vm.network"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-neutral-700"
          >
            <i className="fas fa-network-wired text-xl"></i>
          </a>
        </div>
      </div>

      {/* Info panel */}
      <div 
        className={`w-80 bg-neutral-800 p-4 flex flex-col transition-transform duration-200 ${
          activeInfo || sideBarPinned ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute right-2 top-2">
          <SmallButton
            icon="fa-thumbtack"
            onClick={toggleSidebarPin}
            tooltip={sideBarPinned ? "Unpin Sidebar" : "Pin Sidebar"}
            className={sideBarPinned ? "bg-neutral-500" : "bg-neutral-700"}
          />
        </div>

        {activeInfo === 'Information' && (
          <div className="space-y-4">
            <h1 className="text-lg font-bold">FarTerm</h1>
            <p>A social Linux terminal environment running in your browser via WebAssembly</p>
            <p>Built with:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <a href="https://cheerpx.io" target="_blank" rel="noopener noreferrer" className="underline">
                  CheerpX
                </a>
                : x86 virtualization in Wasm
              </li>
              <li>
                <a href="https://xtermjs.org" target="_blank" rel="noopener noreferrer" className="underline">
                  Xterm.js
                </a>
                : terminal emulation
              </li>
              <li>Persistent storage with IndexedDB</li>
              <li>
                <a href="https://tailscale.com" target="_blank" rel="noopener noreferrer" className="underline">
                  Tailscale
                </a>
                : secure networking
              </li>
              <li>
                <a href="https://farcaster.xyz" target="_blank" rel="noopener noreferrer" className="underline">
                  Farcaster
                </a>
                : social features
              </li>
            </ul>
          </div>
        )}

        {activeInfo === 'Networking' && (
          <div className="space-y-4">
            <h1 className="text-lg font-bold">Networking</h1>
            <p>FarTerm uses Tailscale for secure networking between instances</p>
            <p>Connect to share your terminal and collaborate with others</p>
          </div>
        )}

        {activeInfo === 'CPU' && (
          <div className="space-y-4">
            <h1 className="text-lg font-bold">CPU Activity</h1>
            <p>Monitor virtual CPU usage and performance</p>
            <p>Powered by CheerpX x86 virtualization</p>
          </div>
        )}

        {activeInfo === 'Disk' && (
          <div className="space-y-4">
            <h1 className="text-lg font-bold">Storage</h1>
            <p>Persistent storage using IndexedDB</p>
            <p>Your files and settings are saved locally</p>
          </div>
        )}

        {activeInfo === 'ClaudeAI' && (
          <div className="space-y-4">
            <h1 className="text-lg font-bold">AI Assistant</h1>
            <p>Control your terminal using natural language</p>
            <p>Powered by Anthropic's Claude AI</p>
          </div>
        )}

        {activeInfo === 'Docs' && (
          <div className="space-y-4">
            <h1 className="text-lg font-bold">Documentation</h1>
            <p>Learn how to use FarTerm and explore its features</p>
            <a href="https://docs.farterm.network" target="_blank" rel="noopener noreferrer" className="underline">
              Read the docs →
            </a>
          </div>
        )}

        {activeInfo === 'Community' && (
          <div className="space-y-4">
            <h1 className="text-lg font-bold">Community</h1>
            <p>Join our Discord community to connect with other users</p>
            <a href="https://discord.gg/farterm" target="_blank" rel="noopener noreferrer" className="underline">
              Join Discord →
            </a>
          </div>
        )}

        {activeInfo === 'GitHub' && (
          <div className="space-y-4">
            <h1 className="text-lg font-bold">Open Source</h1>
            <p>FarTerm is open source and welcomes contributions</p>
            <a href="https://github.com/yourusername/farterm" target="_blank" rel="noopener noreferrer" className="underline">
              View source →
            </a>
          </div>
        )}

        <div className="mt-auto text-sm text-gray-300">
          <div className="pt-1 pb-1">
            <a href="https://web3vm.network" target="_blank" rel="noopener noreferrer">
              <span>Powered by Web3VM</span>
            </a>
          </div>
          <hr className="border-t border-solid border-gray-600" />
          <div className="pt-1 pb-1">
            <a href="https://farterm.network" target="_blank" rel="noopener noreferrer">
              © 2024 FarTerm Network
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 