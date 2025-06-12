# 🚀 WebVM Session Auth - Deployment & Integration Guide

Complete guide for deploying the EVMAuth-inspired WebVM Session Auth system to Base Sepolia and integrating with your MiniApp frontend.

## 📋 Prerequisites

### 1. Environment Setup
```bash
# Node.js v18+
node --version

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Required API Keys & Credentials

#### Base Sepolia Deployment
```bash
# .env file
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key_here
```

#### IPFS Storage (Choose one)
```bash
# Pinata (Recommended)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# OR Infura IPFS
INFURA_PROJECT_ID=your_infura_project_id_here
INFURA_PROJECT_SECRET=your_infura_project_secret_here
```

### 3. Get Test ETH
- **Base Sepolia Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Minimum Required**: 0.01 ETH for deployment + testing

## 🔨 Step 1: Deploy to Base Sepolia

### Compile Contracts
```bash
npm run compile
```

### Run Tests (Optional but Recommended)
```bash
npm run test
```

### Deploy to Base Sepolia
```bash
npm run deploy:base-sepolia
```

**Expected Output:**
```
🚀 Deploying WebVM Session Auth to Base Sepolia...
Deploying contracts with account: 0x...
Account balance: 0.05 ETH
✅ WebVMSessionAuth deployed to: 0x1234567890123456789012345678901234567890
🔗 View on BaseScan: https://sepolia.basescan.org/address/0x...
💾 Deployment info saved to: ./deployments/base-sepolia-deployment.json
```

### Verify Contract (Optional)
```bash
# Replace with your actual contract address
npx hardhat verify --network base-sepolia 0x1234567890123456789012345678901234567890 "https://api.webvm.farterm.app/metadata/{id}.json" "0xYourAddress"
```

## 📦 Step 2: Export ABIs for Frontend

```bash
npm run export-abi
```

This creates:
- `./abi/WebVMSessionAuth.json` - Main contract ABI
- `./abi/types.ts` - TypeScript definitions
- `./abi/integration-example.ts` - Frontend integration example

## 🌐 Step 3: Frontend Integration

### Install Frontend Dependencies
```bash
# In your frontend project
npm install wagmi viem @wagmi/core
```

### Copy Contract Files
```bash
# Copy ABI files to your frontend
cp farterm-contracts/abi/* your-frontend/src/contracts/
```

### Update Contract Address
```typescript
// In your frontend: src/contracts/types.ts
export const CONTRACT_ADDRESSES = {
  BASE_SEPOLIA: '0x1234567890123456789012345678901234567890', // Your deployed address
  BASE_MAINNET: '', // Fill after mainnet deployment
} as const;
```

### Basic Integration Example
```typescript
// src/hooks/useWebVMSession.ts
import { useContractRead, useContractWrite } from 'wagmi';
import { CONTRACT_ADDRESSES, CONTRACTS, TOKEN_TYPES } from '../contracts/types';

const CONTRACT_CONFIG = {
  address: CONTRACT_ADDRESSES.BASE_SEPOLIA,
  abi: CONTRACTS.WebVMSessionAuth.abi,
};

export function useCreateSession() {
  const { write: createSession, isLoading } = useContractWrite({
    ...CONTRACT_CONFIG,
    functionName: 'createSession',
  });

  const handleCreateSession = (
    sessionName: string,
    description: string,
    maxUsers: number,
    isPublic: boolean,
    ipfsHash: string,
    duration: number
  ) => {
    createSession({
      args: [sessionName, description, maxUsers, isPublic, ipfsHash, duration],
    });
  };

  return { createSession: handleCreateSession, isLoading };
}

export function useJoinSession() {
  const { write: joinSession, isLoading } = useContractWrite({
    ...CONTRACT_CONFIG,
    functionName: 'joinSession',
  });

  const handleJoinSession = (sessionId: number, tokenType: number, price: string) => {
    joinSession({
      args: [sessionId, tokenType],
      value: parseEther(price),
    });
  };

  return { joinSession: handleJoinSession, isLoading };
}
```

## 🗄️ Step 4: IPFS Integration

### Setup Pinata Account
1. Go to https://app.pinata.cloud/
2. Create account and get API keys
3. Add to `.env` file

### Initialize IPFS Utils
```javascript
// In your backend/server
const { createSession, updateSession } = require('./scripts/ipfs-utils');

// Create session with IPFS storage
const sessionMetadata = {
  sessionName: "My WebVM Session",
  description: "Collaborative coding session",
  creator: userAddress,
  maxUsers: 10,
  isPublic: true
};

const { sessionData, ipfsHash } = await createSession(sessionId, sessionMetadata);
console.log('IPFS Hash:', ipfsHash);
```

## 🔄 Step 5: Real-time User Tracking

### Start WebSocket Server
```bash
# In a separate terminal
node scripts/realtime-tracker.js
```

### Frontend WebSocket Integration
```typescript
// src/services/realtimeClient.ts
class WebVMRealtimeClient {
  constructor(wsUrl = 'ws://localhost:8080') {
    this.wsUrl = wsUrl;
    this.ws = null;
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }

  joinSession(sessionId: number, userAddress: string, role: string) {
    this.send({
      type: 'join_session',
      data: { sessionId, userAddress, role }
    });
  }

  executeCommand(userAddress: string, command: string, output: string) {
    this.send({
      type: 'execute_command',
      data: { userAddress, command, output }
    });
  }
}

// Usage in React component
const realtimeClient = new WebVMRealtimeClient();
await realtimeClient.connect();
```

## 🧪 Step 6: Testing the Complete System

### 1. Test Contract Functions
```bash
# Run contract tests
npm run test

# Test specific functionality
npx hardhat console --network base-sepolia
```

### 2. Test Session Creation
```javascript
// In Hardhat console
const WebVMSessionAuth = await ethers.getContractFactory("WebVMSessionAuth");
const contract = await WebVMSessionAuth.attach("0xYourContractAddress");

// Create a test session
const tx = await contract.createSession(
  "Test Session",
  "A test session",
  5,
  true,
  "QmTestHash",
  24 * 60 * 60, // 24 hours
  { value: ethers.parseEther("0.01") }
);
await tx.wait();
```

### 3. Test Token Purchase
```javascript
// Join session as user
const joinTx = await contract.joinSession(
  1, // sessionId
  3, // USER_TOKEN
  { value: ethers.parseEther("0.001") }
);
await tx.wait();
```

## 🔍 Step 7: Monitoring & Analytics

### Contract Events
```typescript
// Listen to contract events
const contract = new ethers.Contract(contractAddress, abi, provider);

contract.on('SessionCreated', (sessionId, creator, sessionName, isPublic, maxUsers) => {
  console.log('New session created:', {
    sessionId: sessionId.toString(),
    creator,
    sessionName,
    isPublic,
    maxUsers: maxUsers.toString()
  });
});

contract.on('UserJoinedSession', (sessionId, user, role, expiresAt) => {
  console.log('User joined session:', {
    sessionId: sessionId.toString(),
    user,
    role,
    expiresAt: new Date(expiresAt.toNumber() * 1000)
  });
});
```

### Real-time Statistics
```javascript
// Get real-time stats from WebSocket server
const stats = realtimeServer.getStats();
console.log('Server Stats:', {
  activeSessions: stats.activeSessions,
  activeUsers: stats.activeUsers,
  totalConnections: stats.totalConnections
});
```

## 🚀 Step 8: Production Deployment

### Deploy to Base Mainnet
```bash
# Update .env with mainnet RPC
BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Deploy to mainnet
npm run deploy:base
```

### Production Checklist
- [ ] Contract verified on BaseScan
- [ ] IPFS credentials configured
- [ ] WebSocket server deployed
- [ ] Frontend updated with mainnet addresses
- [ ] Monitoring and alerts set up
- [ ] Gas optimization reviewed
- [ ] Security audit completed (recommended)

## 🔧 Troubleshooting

### Common Issues

#### 1. Deployment Fails
```bash
# Check account balance
npx hardhat console --network base-sepolia
const balance = await ethers.provider.getBalance("0xYourAddress");
console.log("Balance:", ethers.formatEther(balance));
```

#### 2. Contract Verification Fails
```bash
# Flatten contract for manual verification
npx hardhat flatten contracts/WebVMSessionAuth.sol > flattened.sol
```

#### 3. IPFS Upload Fails
```bash
# Test IPFS connection
node -e "
const { generateEnvironmentConfig } = require('./scripts/ipfs-utils');
console.log(generateEnvironmentConfig());
"
```

#### 4. WebSocket Connection Issues
```bash
# Test WebSocket server
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');
ws.on('open', () => console.log('Connected'));
ws.on('error', (err) => console.error('Error:', err));
"
```

## 📊 Gas Costs (Base Sepolia)

| Operation | Estimated Gas | Cost (0.001 gwei) |
|-----------|---------------|-------------------|
| Deploy Contract | ~3,500,000 | ~0.0035 ETH |
| Create Session | ~200,000 | ~0.0002 ETH |
| Join Session | ~150,000 | ~0.00015 ETH |
| Leave Session | ~100,000 | ~0.0001 ETH |

## 🔗 Useful Links

- **Base Sepolia Explorer**: https://sepolia.basescan.org/
- **Base Sepolia Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Pinata IPFS**: https://app.pinata.cloud/
- **EVMAuth Documentation**: https://evmauth.io/#overview
- **Base Documentation**: https://docs.base.org/

## 🆘 Support

If you encounter issues:

1. **Check the logs** in `./deployments/base-sepolia-deployment.json`
2. **Review contract events** on BaseScan
3. **Test individual components** using the provided scripts
4. **Join our Discord** for community support

---

🎉 **Congratulations!** You now have a fully deployed EVMAuth-inspired WebVM Session Auth system with:
- ✅ Smart contracts on Base Sepolia
- ✅ IPFS session persistence
- ✅ Real-time user tracking
- ✅ Frontend integration ready
- ✅ Token-gated access control

Your WebVM sessions are now decentralized, shareable, and monetizable! 🚀 