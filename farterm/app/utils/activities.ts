import { create } from 'zustand';

interface ActivityState {
  cpuActivity: boolean;
  diskActivity: boolean;
  aiActivity: boolean;
  setCpuActivity: (active: boolean) => void;
  setDiskActivity: (active: boolean) => void;
  setAiActivity: (active: boolean) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  cpuActivity: false,
  diskActivity: false,
  aiActivity: false,
  setCpuActivity: (active) => set({ cpuActivity: active }),
  setDiskActivity: (active) => set({ diskActivity: active }),
  setAiActivity: (active) => set({ aiActivity: active }),
}));

export const computeCpuActivity = (events: Array<{t: number, state: string}>, curTime: number, limitTime: number) => {
  let totalActiveTime = 0;
  let lastActiveTime = limitTime;
  let lastWasActive = false;

  for (const e of events) {
    let eTime = e.t;
    if (eTime < limitTime) eTime = limitTime;
    
    if (e.state === "ready") {
      totalActiveTime += (eTime - lastActiveTime);
      lastWasActive = false;
    } else {
      lastActiveTime = eTime;
      lastWasActive = true;
    }
  }

  if (lastWasActive) {
    totalActiveTime += (curTime - lastActiveTime);
  }

  return Math.ceil((totalActiveTime / 10000) * 100);
}; 