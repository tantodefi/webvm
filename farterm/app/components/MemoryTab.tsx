'use client';

import { useEffect, useState } from 'react';
import { useActivityStore } from '../utils/activities';
import { useCheerpX } from '../utils/cheerpx-context';
import { Card, Button } from './DemoComponents';

export default function MemoryTab() {
  // CPU state
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  
  // Storage state
  const [diskUsage, setDiskUsage] = useState(0);
  const [readLatency, setReadLatency] = useState(0);
  const [writeLatency, setWriteLatency] = useState(0);
  
  const { setCpuActivity, setDiskActivity } = useActivityStore();
  const { isAvailable, isInitializing } = useCheerpX();

  useEffect(() => {
    // Simulate monitoring - in real app, this would come from CheerpX
    const interval = setInterval(() => {
      const newCpuUsage = Math.random() * 100;
      const newMemoryUsage = Math.random() * 100;
      const newDiskUsage = Math.random() * 100;
      const newReadLatency = Math.random() * 50;
      const newWriteLatency = Math.random() * 50;
      
      setCpuUsage(newCpuUsage);
      setMemoryUsage(newMemoryUsage);
      setDiskUsage(newDiskUsage);
      setReadLatency(newReadLatency);
      setWriteLatency(newWriteLatency);
      
      setCpuActivity(newCpuUsage > 20);
      setDiskActivity(newDiskUsage > 30);
    }, 1000);

    return () => clearInterval(interval);
  }, [setCpuActivity, setDiskActivity]);

  const handleReset = () => {
    setCpuUsage(0);
    setMemoryUsage(0);
    setDiskUsage(0);
    setReadLatency(0);
    setWriteLatency(0);
  };

  return (
    <div className="space-y-6 h-full">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--app-foreground)]">System Memory & Storage</h2>
        {!isInitializing && !isAvailable && (
          <p className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
            ⚠️ Simulated data - Real monitoring requires CheerpX integration
          </p>
        )}
      </div>

      {/* CPU & Memory Section */}
      <Card>
        <div className="space-y-6">
          <h3 className="text-base font-medium text-[var(--app-foreground)]">CPU & Memory</h3>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[var(--app-foreground)]">CPU Usage</h4>
            <div className="h-3 bg-[var(--app-gray)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
            <p className="text-xs text-[var(--app-foreground-muted)]">{cpuUsage.toFixed(1)}%</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[var(--app-foreground)]">Memory Usage</h4>
            <div className="h-3 bg-[var(--app-gray)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${memoryUsage}%` }}
              />
            </div>
            <p className="text-xs text-[var(--app-foreground-muted)]">{memoryUsage.toFixed(1)}%</p>
          </div>
        </div>
      </Card>

      {/* Storage Section */}
      <Card>
        <div className="space-y-6">
          <h3 className="text-base font-medium text-[var(--app-foreground)]">Storage</h3>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[var(--app-foreground)]">Disk Usage</h4>
            <div className="h-3 bg-[var(--app-gray)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${diskUsage}%` }}
              />
            </div>
            <p className="text-xs text-[var(--app-foreground-muted)]">{diskUsage.toFixed(1)}%</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[var(--app-foreground)]">Read Latency</h4>
              <div className="bg-[var(--app-gray)] p-2 rounded-lg">
                <div className="text-sm font-mono text-[var(--app-foreground)]">{readLatency.toFixed(1)}ms</div>
                <div className="text-xs text-[var(--app-foreground-muted)]">Avg</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-[var(--app-foreground)]">Write Latency</h4>
              <div className="bg-[var(--app-gray)] p-2 rounded-lg">
                <div className="text-sm font-mono text-[var(--app-foreground)]">{writeLatency.toFixed(1)}ms</div>
                <div className="text-xs text-[var(--app-foreground-muted)]">Avg</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[var(--app-foreground)]">Storage Information</h4>
            <div className="bg-[var(--app-gray)] rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--app-foreground)]">Total Capacity</span>
                <span className="font-mono text-[var(--app-foreground)]">1.0 GB</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--app-foreground)]">Available</span>
                <span className="font-mono text-[var(--app-foreground)]">768 MB</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--app-foreground)]">Cache Size</span>
                <span className="font-mono text-[var(--app-foreground)]">64 MB</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--app-foreground)]">File System</span>
                <span className="font-mono text-[var(--app-foreground)]">ext2</span>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="w-full"
          >
            Reset Statistics
          </Button>
        </div>
      </Card>

      {/* System Information */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-base font-medium text-[var(--app-foreground)]">System Information</h3>
          <div className="bg-[var(--app-gray)] rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--app-foreground)]">Architecture</span>
              <span className="font-mono text-[var(--app-foreground)]">x86_64</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--app-foreground)]">Cores</span>
              <span className="font-mono text-[var(--app-foreground)]">1 (Virtual)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--app-foreground)]">RAM</span>
              <span className="font-mono text-[var(--app-foreground)]">128MB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--app-foreground)]">CheerpX Version</span>
              <span className="font-mono text-[var(--app-foreground)]">1.1.5</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 