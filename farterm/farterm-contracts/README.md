# WebVM Session Auth Contracts

Smart contracts for WebVM session management using the EVMAuth pattern, deployed on Base blockchain.

> **Inspired by [EVMAuth](https://evmauth.io/#overview)** - An open protocol for secure EVM-based authorization. Our implementation adapts the EVMAuth architecture for WebVM session management with custom features for multi-user collaborative environments.

## 🏗️ Architecture

### Contract Hierarchy
```
EVMAuthAccessControl (Base access control with roles & blacklisting)
    ↓
EVMAuthBaseERC1155 (ERC1155 with token metadata management)
    ↓
EVMAuthPurchasableERC1155 (Direct token purchasing with ETH)
    ↓
WebVMSessionAuth (Main session management contract)
```

**Based on the [EVMAuth Core Architecture](https://github.com/evmauth/evmauth-core)** with adaptations for WebVM-specific use cases.

### Key Features

- **🔐 Role-based Access Control**: Admin, Finance, Token Manager, Minter, Burner roles
- **🚫 Blacklisting System**: Prevent malicious users from accessing sessions
- **💰 Direct Token Purchasing**: Buy session access tokens with ETH
- **⏰ Time-limited Access**: Tokens expire automatically
- **🔄 Session Management**: Create, join, leave, and manage WebVM sessions
- **💾 Persistent Storage**: IPFS integration for session data

## 🔗 **EVMAuth Integration & Adaptations**

This project is heavily inspired by the [EVMAuth protocol](https://evmauth.io/#overview) and follows its core architectural patterns. We've adapted the [EVMAuth core contracts](https://github.com/evmauth/evmauth-core) for WebVM-specific session management.

### **EVMAuth Core Concepts We Adopted:**
- **EVM-Based Access Control** - Token ownership determines permissions
- **Time-Limited Access** - Automatic token expiration for security
- **Role-Based Permissions** - Granular access control with multiple roles
- **Direct Token Purchasing** - ETH-based access token sales
- **Blacklisting Capabilities** - Security against malicious actors

### **WebVM-Specific Adaptations:**
- **Session Management** - Create, join, and manage collaborative sessions
- **Multi-User Support** - Real-time tracking of session participants
- **IPFS Integration** - Persistent storage for session data
- **Custom Token Types** - Owner, Admin, User, Readonly access levels
- **Session Lifecycle** - Creation, expiration, and cleanup mechanisms

### **Why We Adapted Instead of Direct Integration:**
While EVMAuth provides excellent general-purpose authentication, our WebVM use case required:
- Session-specific token management
- Multi-user collaborative features  
- Real-time user tracking
- Custom permission hierarchies
- Integrated session persistence

**Learn more about EVMAuth:**
- 📖 [EVMAuth Documentation](https://evmauth.io/#overview)
- 💻 [EVMAuth Core Repository](https://github.com/evmauth/evmauth-core)

## 📋 Token Types & Pricing

| Token Type | Price | Duration | Permissions |
|------------|-------|----------|-------------|
| Owner | 0.01 ETH | 30 days | Full session control |
| Admin | 0.005 ETH | 7 days | Manage users |
| User | 0.001 ETH | 24 hours | Read/write access |
| Readonly | 0.0001 ETH | 1 hour | Read-only access |

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm or yarn
- Hardhat

### Installation
```bash
cd farterm-contracts
npm install
```

### Environment Setup
```bash
cp env.example .env
# Edit .env with your private key and API keys
```

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm run test
```

### Deploy to Base Sepolia (Testnet)
```bash
npm run deploy:base-sepolia
```

### Deploy to Base Mainnet
```bash
npm run deploy:base
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
npm run test
```

Generate coverage report:
```bash
npm run test:coverage
```

Generate gas usage report:
```bash
npm run gas-report
```

## 📡 Deployment

### Local Development
```bash
# Start local Hardhat node
npm run node

# Deploy to local network
npm run deploy:local
```

### Base Sepolia Testnet
```bash
npm run deploy:base-sepolia
```

### Base Mainnet
```bash
npm run deploy:base
```

## 🔍 Contract Verification

After deployment, verify contracts on Basescan:

```bash
# For Base Sepolia
npm run verify:base-sepolia <CONTRACT_ADDRESS> "<URI>" <INITIAL_DELAY> "<ADMIN_ADDRESS>"

# For Base Mainnet
npm run verify:base <CONTRACT_ADDRESS> "<URI>" <INITIAL_DELAY> "<ADMIN_ADDRESS>"
```

## 📖 Usage Examples

### Creating a Session
```javascript
const sessionTx = await webvmSessionAuth.createSession(
  "My WebVM Session",
  "A collaborative coding session",
  10, // max users
  true, // public
  "QmIPFSHash", // IPFS hash for session data
  24 * 60 * 60 // 24 hours duration
);
```

### Joining a Session
```javascript
const tokenPrice = await webvmSessionAuth.getTokenPrice(3); // User token
const joinTx = await webvmSessionAuth.joinSession(
  sessionId,
  3, // User token type
  { value: tokenPrice }
);
```

### Checking Access
```javascript
const hasAccess = await webvmSessionAuth.hasSessionAccess(sessionId, userAddress);
const userRole = await webvmSessionAuth.getUserRole(sessionId, userAddress);
```

## 🔧 Contract Functions

### Session Management
- `createSession()` - Create a new WebVM session
- `joinSession()` - Join a session by purchasing access token
- `leaveSession()` - Leave a session
- `updateSession()` - Update session metadata (owner only)
- `extendSession()` - Extend session duration (owner only)

### Access Control
- `hasSessionAccess()` - Check if user has access to session
- `getUserRole()` - Get user's role in session
- `blacklistAccount()` - Blacklist a user (admin only)
- `unblacklistAccount()` - Remove user from blacklist (admin only)

### Financial
- `purchaseToken()` - Purchase single access token
- `purchaseTokens()` - Purchase multiple access tokens
- `withdrawFunds()` - Withdraw contract funds (finance role)
- `getTotalFunds()` - Get total funds in contract

### Token Management
- `setTokenMetadata()` - Set token properties (token manager role)
- `mint()` - Mint tokens (minter role)
- `burn()` - Burn tokens (burner role)

## 🌐 Integration with MiniApp

The contracts integrate with the FarTerm MiniApp through:

1. **Session Creation**: Users create sessions via the MiniApp UI
2. **Access Control**: Smart contract validates user permissions
3. **Payment Processing**: ETH payments for session access
4. **Real-time Updates**: Events emitted for UI updates
5. **IPFS Storage**: Session data stored on IPFS

### Frontend Integration Example
```typescript
import { useContract } from 'wagmi';
import WebVMSessionAuthABI from './abi/WebVMSessionAuth.json';

const contract = useContract({
  address: '0x...', // Deployed contract address
  abi: WebVMSessionAuthABI,
});

// Create session
const createSession = async () => {
  const tx = await contract.write.createSession([
    sessionName,
    description,
    maxUsers,
    isPublic,
    ipfsHash,
    duration
  ]);
  await tx.wait();
};
```

## 🔒 Security Features

- **Reentrancy Protection**: All financial functions protected
- **Access Control**: Role-based permissions with time delays
- **Blacklisting**: Prevent malicious users from participating
- **Input Validation**: Comprehensive parameter validation
- **Emergency Functions**: Admin emergency withdrawal capabilities

## 📊 Gas Optimization

- **Batch Operations**: Mint/burn multiple tokens in single transaction
- **Efficient Storage**: Optimized struct packing
- **Event Indexing**: Proper event indexing for efficient queries
- **Minimal Proxy Pattern**: Ready for factory deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

### Attribution

This project is inspired by and adapts concepts from:
- **[EVMAuth](https://evmauth.io/#overview)** - An open protocol for secure EVM-based authorization
- **[EVMAuth Core](https://github.com/evmauth/evmauth-core)** - The foundational smart contracts (MIT License)

We extend our gratitude to the EVMAuth team for pioneering EVM-based authentication patterns that made this implementation possible.

## 🆘 Support

For support and questions:
- GitHub Issues: [Create an issue](https://github.com/farterm/webvm/issues)
- Discord: [Join our Discord](https://discord.gg/farterm)
- Documentation: [Full docs](https://docs.farterm.app)

---

Built with ❤️ by the FarTerm team for the decentralized web. 