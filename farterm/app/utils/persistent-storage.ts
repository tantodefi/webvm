import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSession {
  address: string;
  fid?: number;
  username?: string;
  displayName?: string;
  ensName?: string;
  avatar?: string;
  lastActive: number;
  filesystemSnapshot?: string; // Base64 encoded filesystem state
  privileges: UserPrivilege[];
  balances?: Record<string, string>; // tokenAddress -> balance
}

export interface UserPrivilege {
  type: 'admin' | 'poweruser' | 'basic' | 'readonly';
  granted: boolean;
  source: 'token' | 'allowlist' | 'farcaster' | 'default';
  tokenAddress?: string;
  minimumBalance?: string;
}

interface PersistentStorageState {
  currentUser: UserSession | null;
  sessions: Record<string, UserSession>; // keyed by address
  setCurrentUser: (user: UserSession | null) => void;
  updateUserSession: (address: string, updates: Partial<UserSession>) => void;
  getUserSession: (address: string) => UserSession | null;
  saveFilesystemSnapshot: (address: string, snapshot: string) => void;
  loadFilesystemSnapshot: (address: string) => string | null;
  clearCurrentUser: () => void;
}

export const usePersistentStorage = create<PersistentStorageState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      sessions: {},
      
      setCurrentUser: (user) => set({ currentUser: user }),
      
      clearCurrentUser: () => set({ currentUser: null }),
      
      updateUserSession: (address, updates) => set((state) => ({
        sessions: {
          ...state.sessions,
          [address]: {
            ...state.sessions[address],
            ...updates,
            lastActive: Date.now()
          }
        }
      })),
      
      getUserSession: (address) => {
        const sessions = get().sessions;
        return sessions[address] || null;
      },
      
      saveFilesystemSnapshot: (address, snapshot) => {
        if (!address) return;
        get().updateUserSession(address, { 
          filesystemSnapshot: snapshot,
          lastActive: Date.now()
        });
      },
      
      loadFilesystemSnapshot: (address) => {
        if (!address) return null;
        const session = get().getUserSession(address);
        return session?.filesystemSnapshot || null;
      }
    }),
    {
      name: 'farterm-storage',
      version: 1,
    }
  )
);
