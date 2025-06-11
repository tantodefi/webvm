'use client';

import { useEffect, useState } from 'react';
import { useActivityStore } from '../utils/activities';
import { useCheerpX } from '../utils/cheerpx-context';
import { Card } from './DemoComponents';

export default function CpuTab() {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const { setCpuActivity } = useActivityStore();
  const { isAvailable, isInitializing } = useCheerpX();

  useEffect(() => {
    // Simulate CPU monitoring - in real app, this would come from CheerpX
    const interval = setInterval(() => {
      const newCpuUsage = Math.random() * 100;
      const newMemoryUsage = Math.random() * 100;
      
      setCpuUsage(newCpuUsage);
      setMemoryUsage(newMemoryUsage);
      setCpuActivity(newCpuUsage > 20);
    }, 1000);

    return () => clearInterval(interval);
  }, [setCpuActivity]);

  return (
    <div className="space-y-6 h-full">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--app-foreground)]">System Monitor</h2>
        {!isInitializing && !isAvailable && (
          <p className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
            ⚠️ Simulated data - Real monitoring requires CheerpX integration
          </p>
        )}
      </div>
      
      <Card>
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-base font-medium text-[var(--app-foreground)]">CPU Usage</h3>
            <div className="h-4 bg-[var(--app-gray)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
            <p className="text-sm text-[var(--app-foreground-muted)]">{cpuUsage.toFixed(1)}%</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-medium text-[var(--app-foreground)]">Memory Usage</h3>
            <div className="h-4 bg-[var(--app-gray)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${memoryUsage}%` }}
              />
            </div>
            <p className="text-sm text-[var(--app-foreground-muted)]">{memoryUsage.toFixed(1)}%</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-medium text-[var(--app-foreground)]">System Information</h3>
            <div className="bg-[var(--app-gray)] rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--app-foreground)]">Architecture</span>
                <span className="text-sm font-mono text-[var(--app-foreground)]">x86_64</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--app-foreground)]">Cores</span>
                <span className="text-sm font-mono text-[var(--app-foreground)]">1 (Virtual)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--app-foreground)]">Memory</span>
                <span className="text-sm font-mono text-[var(--app-foreground)]">128MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--app-foreground)]">CheerpX Version</span>
                <span className="text-sm font-mono text-[var(--app-foreground)]">1.1.5</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 