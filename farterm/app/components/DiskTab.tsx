'use client';

import { useEffect, useState } from 'react';
import { useActivityStore } from '../utils/activities';
import { useCheerpX } from '../utils/cheerpx-context';
import { Card, Button } from './DemoComponents';

export default function DiskTab() {
  const [diskUsage, setDiskUsage] = useState(0);
  const [readLatency, setReadLatency] = useState(0);
  const [writeLatency, setWriteLatency] = useState(0);
  const { setDiskActivity } = useActivityStore();
  const { isAvailable, isInitializing } = useCheerpX();

  useEffect(() => {
    // Simulate disk monitoring
    const interval = setInterval(() => {
      const newDiskUsage = Math.random() * 100;
      const newReadLatency = Math.random() * 50;
      const newWriteLatency = Math.random() * 50;
      
      setDiskUsage(newDiskUsage);
      setReadLatency(newReadLatency);
      setWriteLatency(newWriteLatency);
      setDiskActivity(newDiskUsage > 30);
    }, 1000);

    return () => clearInterval(interval);
  }, [setDiskActivity]);

  const handleReset = () => {
    setDiskUsage(0);
    setReadLatency(0);
    setWriteLatency(0);
  };

  return (
    <div className="space-y-6 h-full">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--app-foreground)]">Storage & Memory</h2>
        {!isInitializing && !isAvailable && (
          <p className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
            ⚠️ Simulated data - Real monitoring requires CheerpX integration
          </p>
        )}
      </div>
      
      <Card>
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-base font-medium text-[var(--app-foreground)]">Disk Usage</h3>
            <div className="h-4 bg-[var(--app-gray)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${diskUsage}%` }}
              />
            </div>
            <p className="text-sm text-[var(--app-foreground-muted)]">{diskUsage.toFixed(1)}%</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[var(--app-foreground)]">Read Latency</h4>
              <div className="bg-[var(--app-gray)] p-3 rounded-lg">
                <div className="text-lg font-mono text-[var(--app-foreground)]">{readLatency.toFixed(1)}ms</div>
                <div className="text-xs text-[var(--app-foreground-muted)]">Average</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[var(--app-foreground)]">Write Latency</h4>
              <div className="bg-[var(--app-gray)] p-3 rounded-lg">
                <div className="text-lg font-mono text-[var(--app-foreground)]">{writeLatency.toFixed(1)}ms</div>
                <div className="text-xs text-[var(--app-foreground-muted)]">Average</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-medium text-[var(--app-foreground)]">Storage Information</h3>
            <div className="bg-[var(--app-gray)] rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--app-foreground)]">Total Capacity</span>
                <span className="text-sm font-mono text-[var(--app-foreground)]">1.0 GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--app-foreground)]">Available</span>
                <span className="text-sm font-mono text-[var(--app-foreground)]">768 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--app-foreground)]">Cache Size</span>
                <span className="text-sm font-mono text-[var(--app-foreground)]">64 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--app-foreground)]">File System</span>
                <span className="text-sm font-mono text-[var(--app-foreground)]">ext2</span>
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
    </div>
  );
} 