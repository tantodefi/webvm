const fs = require('fs');
const path = require('path');

async function exportABI() {
  console.log("📦 Exporting contract ABIs for frontend integration...");

  // Paths
  const artifactsPath = './artifacts/contracts';
  const outputPath = './abi';

  // Create output directory
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Contract files to export
  const contracts = [
    {
      name: 'WebVMSessionAuth',
      path: 'WebVMSessionAuth.sol/WebVMSessionAuth.json'
    },
    {
      name: 'EVMAuthAccessControl',
      path: 'EVMAuthAccessControl.sol/EVMAuthAccessControl.json'
    },
    {
      name: 'EVMAuthBaseERC1155',
      path: 'EVMAuthBaseERC1155.sol/EVMAuthBaseERC1155.json'
    },
    {
      name: 'EVMAuthPurchasableERC1155',
      path: 'EVMAuthPurchasableERC1155.sol/EVMAuthPurchasableERC1155.json'
    }
  ];

  const exportedContracts = {};

  for (const contract of contracts) {
    try {
      const artifactPath = path.join(artifactsPath, contract.path);
      
      if (!fs.existsSync(artifactPath)) {
        console.warn(`⚠️  Artifact not found: ${artifactPath}`);
        continue;
      }

      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      
      // Extract ABI and bytecode
      const contractData = {
        contractName: contract.name,
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode,
        linkReferences: artifact.linkReferences,
        deployedLinkReferences: artifact.deployedLinkReferences
      };

      // Save individual ABI file
      const abiPath = path.join(outputPath, `${contract.name}.json`);
      fs.writeFileSync(abiPath, JSON.stringify(contractData, null, 2));
      
      // Add to combined export
      exportedContracts[contract.name] = contractData;
      
      console.log(`✅ Exported ${contract.name} ABI`);
    } catch (error) {
      console.error(`❌ Failed to export ${contract.name}:`, error.message);
    }
  }

  // Create combined ABI file
  const combinedPath = path.join(outputPath, 'index.json');
  fs.writeFileSync(combinedPath, JSON.stringify(exportedContracts, null, 2));

  // Create TypeScript definitions
  const tsDefinitions = generateTypeScriptDefinitions(exportedContracts);
  const tsPath = path.join(outputPath, 'types.ts');
  fs.writeFileSync(tsPath, tsDefinitions);

  // Create frontend integration example
  const integrationExample = generateIntegrationExample();
  const examplePath = path.join(outputPath, 'integration-example.ts');
  fs.writeFileSync(examplePath, integrationExample);

  console.log(`\n📁 ABI files exported to: ${outputPath}/`);
  console.log("📄 Files created:");
  console.log("  - WebVMSessionAuth.json (Main contract ABI)");
  console.log("  - index.json (Combined ABIs)");
  console.log("  - types.ts (TypeScript definitions)");
  console.log("  - integration-example.ts (Frontend integration example)");
  
  return outputPath;
}

function generateTypeScriptDefinitions(contracts) {
  return `// Auto-generated TypeScript definitions for WebVM Session Auth contracts
// Generated on: ${new Date().toISOString()}

export interface ContractABI {
  contractName: string;
  abi: any[];
  bytecode: string;
  deployedBytecode: string;
}

export interface DeploymentInfo {
  network: string;
  chainId: number;
  contractAddress: string;
  deployer: string;
  deploymentTime: string;
  transactionHash: string;
  blockNumber: number;
  tokenPrices: {
    owner: string;
    admin: string;
    user: string;
    readonly: string;
  };
  links: {
    basescan: string;
    transaction: string;
  };
}

export interface SessionMetadata {
  sessionName: string;
  description: string;
  creator: string;
  maxUsers: number;
  isPublic: boolean;
  ipfsHash: string;
  createdAt: number;
  expiresAt: number;
  active: boolean;
}

export interface UserSession {
  sessionId: number;
  user: string;
  joinedAt: number;
  expiresAt: number;
  active: boolean;
  role: 'owner' | 'admin' | 'user' | 'readonly';
}

export const CONTRACT_ADDRESSES = {
  BASE_SEPOLIA: '', // Fill in after deployment
  BASE_MAINNET: '', // Fill in after deployment
} as const;

export const TOKEN_TYPES = {
  SESSION_OWNER_TOKEN: 1,
  SESSION_ADMIN_TOKEN: 2,
  SESSION_USER_TOKEN: 3,
  SESSION_READONLY_TOKEN: 4,
} as const;

export const CONTRACTS: Record<string, ContractABI> = ${JSON.stringify(contracts, null, 2)};
`;
}

function generateIntegrationExample() {
  return `// Frontend Integration Example for WebVM Session Auth
// This example shows how to integrate the contracts with a React/Next.js app using wagmi

import { useContract, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS, CONTRACT_ADDRESSES, TOKEN_TYPES } from './types';

// Contract configuration
const CONTRACT_CONFIG = {
  address: CONTRACT_ADDRESSES.BASE_SEPOLIA, // or BASE_MAINNET
  abi: CONTRACTS.WebVMSessionAuth.abi,
};

// Hook for reading session data
export function useSession(sessionId: number) {
  const { data: session } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getSession',
    args: [sessionId],
  });

  const { data: users } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getSessionUsers',
    args: [sessionId],
  });

  return { session, users };
}

// Hook for creating a session
export function useCreateSession() {
  const { config } = usePrepareContractWrite({
    ...CONTRACT_CONFIG,
    functionName: 'createSession',
  });

  const { write: createSession, isLoading } = useContractWrite(config);

  const handleCreateSession = (
    sessionName: string,
    description: string,
    maxUsers: number,
    isPublic: boolean,
    ipfsHash: string,
    duration: number
  ) => {
    createSession?.({
      args: [sessionName, description, maxUsers, isPublic, ipfsHash, duration],
    });
  };

  return { createSession: handleCreateSession, isLoading };
}

// Hook for joining a session
export function useJoinSession() {
  const { config } = usePrepareContractWrite({
    ...CONTRACT_CONFIG,
    functionName: 'joinSession',
  });

  const { write: joinSession, isLoading } = useContractWrite(config);

  const handleJoinSession = async (sessionId: number, tokenType: number, price: string) => {
    joinSession?.({
      args: [sessionId, tokenType],
      value: parseEther(price),
    });
  };

  return { joinSession: handleJoinSession, isLoading };
}

// Hook for checking user access
export function useUserAccess(sessionId: number, userAddress: string) {
  const { data: hasAccess } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'hasSessionAccess',
    args: [sessionId, userAddress],
    enabled: !!userAddress,
  });

  const { data: userRole } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getUserRole',
    args: [sessionId, userAddress],
    enabled: !!userAddress,
  });

  return { hasAccess, userRole };
}

// Hook for token prices
export function useTokenPrices() {
  const { data: ownerPrice } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getTokenPrice',
    args: [TOKEN_TYPES.SESSION_OWNER_TOKEN],
  });

  const { data: adminPrice } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getTokenPrice',
    args: [TOKEN_TYPES.SESSION_ADMIN_TOKEN],
  });

  const { data: userPrice } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getTokenPrice',
    args: [TOKEN_TYPES.SESSION_USER_TOKEN],
  });

  const { data: readonlyPrice } = useContractRead({
    ...CONTRACT_CONFIG,
    functionName: 'getTokenPrice',
    args: [TOKEN_TYPES.SESSION_READONLY_TOKEN],
  });

  return {
    owner: ownerPrice,
    admin: adminPrice,
    user: userPrice,
    readonly: readonlyPrice,
  };
}

// Example React component
export function SessionManager({ sessionId }: { sessionId: number }) {
  const { session, users } = useSession(sessionId);
  const { createSession, isLoading: isCreating } = useCreateSession();
  const { joinSession, isLoading: isJoining } = useJoinSession();
  const tokenPrices = useTokenPrices();

  const handleCreateSession = () => {
    createSession(
      "My WebVM Session",
      "Collaborative coding session",
      10, // max users
      true, // public
      "QmIPFSHash", // IPFS hash
      24 * 60 * 60 // 24 hours
    );
  };

  const handleJoinAsUser = () => {
    if (tokenPrices.user) {
      joinSession(sessionId, TOKEN_TYPES.SESSION_USER_TOKEN, tokenPrices.user.toString());
    }
  };

  return (
    <div>
      <h2>Session Management</h2>
      
      <button onClick={handleCreateSession} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create Session'}
      </button>
      
      <button onClick={handleJoinAsUser} disabled={isJoining}>
        {isJoining ? 'Joining...' : 'Join as User'}
      </button>
      
      {session && (
        <div>
          <h3>{session.sessionName}</h3>
          <p>{session.description}</p>
          <p>Users: {users?.length || 0}/{session.maxUsers}</p>
        </div>
      )}
    </div>
  );
}
`;
}

// Run the export
exportABI()
  .then((outputPath) => {
    console.log(`\n🎉 ABI export completed! Files saved to: ${outputPath}`);
  })
  .catch((error) => {
    console.error("❌ ABI export failed:", error);
    process.exit(1);
  }); 