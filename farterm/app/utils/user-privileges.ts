import { useAccount, useBalance, useEnsName, useEnsAvatar } from 'wagmi';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { usePersistentStorage, type UserSession, type UserPrivilege } from './persistent-storage';
import { useEffect, useState } from 'react';

interface UserInfo {
  address: string;
  fid?: number;
  username?: string;
  displayName?: string;
  ensName?: string;
  avatar?: string;
  balance?: string;
  privileges: UserPrivilege[];
}

// Configuration for user privileges
const PRIVILEGE_CONFIG = {
  admin: {
    allowlist: [] as string[], // Explicitly type as string array
    farcasterCriteria: {
      powerBadge: true,
      minFollowers: 1000,
    },
  },
  poweruser: {
    allowlist: [] as string[], // Explicitly type as string array
    farcasterCriteria: {
      minFollowers: 100,
    },
  },
  // TODO: Add token-based privileges later
  // tokens: {
  //   admin: [
  //     { address: '0x...', minBalance: '1000000000000000000000' }, // 1000 tokens
  //   ],
  //   poweruser: [
  //     { address: '0x...', minBalance: '100000000000000000000' }, // 100 tokens
  //   ],
  // },
};

export const useUserPrivileges = () => {
  const { address } = useAccount();
  const { context } = useMiniKit();
  const { data: balance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName || undefined });
  const { setCurrentUser, clearCurrentUser } = usePersistentStorage();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const checkFarcasterCriteria = (criteria: any) => {
    const farcasterUser = context?.user;
    if (!farcasterUser) return false;
    
    // For now, just check if user exists
    // TODO: Implement proper power badge and follower checks when Farcaster data is available
    return true;
  };

  const getUserPrivileges = async (userAddress: string): Promise<UserPrivilege[]> => {
    const privileges: UserPrivilege[] = [];

    // Check admin privileges
    if (PRIVILEGE_CONFIG.admin.allowlist.includes(userAddress)) {
      privileges.push({
        type: 'admin',
        granted: true,
        source: 'allowlist',
      });
    }

    // Check Farcaster criteria for admin
    if (checkFarcasterCriteria(PRIVILEGE_CONFIG.admin.farcasterCriteria)) {
      privileges.push({
        type: 'admin',
        granted: true,
        source: 'farcaster',
      });
    }

    // Check poweruser privileges
    if (PRIVILEGE_CONFIG.poweruser.allowlist.includes(userAddress)) {
      privileges.push({
        type: 'poweruser',
        granted: true,
        source: 'allowlist',
      });
    }

    // Check Farcaster criteria for poweruser
    if (checkFarcasterCriteria(PRIVILEGE_CONFIG.poweruser.farcasterCriteria)) {
      privileges.push({
        type: 'poweruser',
        granted: true,
        source: 'farcaster',
      });
    }

    // Default basic access
    if (privileges.length === 0) {
      privileges.push({
        type: 'basic',
        granted: true,
        source: 'default',
      });
    }

    return privileges;
  };

  const buildUserInfo = async (): Promise<UserInfo | null> => {
    if (!address) return null;

    const farcasterUser = context?.user;
    const privileges = await getUserPrivileges(address);

    const info: UserInfo = {
      address,
      fid: farcasterUser?.fid,
      username: farcasterUser?.username || ensName || `user_${address.slice(-6)}`,
      displayName: farcasterUser?.displayName || ensName || undefined,
      ensName: ensName || undefined,
      avatar: farcasterUser?.pfpUrl || ensAvatar || undefined,
      balance: balance?.formatted,
      privileges,
    };

    return info;
  };

  const updateCurrentUser = async () => {
    if (!address) {
      setUserInfo(null);
      clearCurrentUser();
      return;
    }

    const info = await buildUserInfo();
    if (info) {
      setUserInfo(info);
      
      // Update persistent storage
      const userSession: UserSession = {
        address: info.address,
        fid: info.fid,
        username: info.username,
        displayName: info.displayName,
        ensName: info.ensName,
        avatar: info.avatar,
        lastActive: Date.now(),
        privileges: info.privileges,
        balances: balance ? { ETH: balance.formatted } : {},
      };
      
      setCurrentUser(userSession);
    }
  };

  // Update user info when wallet or context changes
  useEffect(() => {
    updateCurrentUser();
  }, [address, context, balance, ensName, ensAvatar]);

  return {
    userInfo,
    updateCurrentUser,
    getUserPrivileges,
    buildUserInfo,
  };
};
