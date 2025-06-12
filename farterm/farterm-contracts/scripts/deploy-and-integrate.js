#!/usr/bin/env node

// Complete Deployment and Integration Script for WebVM Session Auth
// This script handles the entire deployment pipeline and generates integration files

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

class WebVMDeploymentManager {
  constructor() {
    this.deploymentInfo = null;
    this.contractAddress = null;
    this.network = hre.network.name;
  }

  async deploy() {
    console.log("🚀 Starting WebVM Session Auth deployment pipeline...");
    console.log(`📡 Network: ${this.network}`);

    // Step 1: Validate environment
    await this.validateEnvironment();

    // Step 2: Deploy contracts
    await this.deployContracts();

    // Step 3: Export ABIs
    await this.exportABIs();

    // Step 4: Generate integration files
    await this.generateIntegrationFiles();

    // Step 5: Create deployment summary
    await this.createDeploymentSummary();

    console.log("🎉 Deployment pipeline completed successfully!");
    return this.deploymentInfo;
  }

  async validateEnvironment() {
    console.log("\n🔍 Validating environment...");

    // Check network
    if (!['base-sepolia', 'base', 'localhost'].includes(this.network)) {
      throw new Error(`Unsupported network: ${this.network}`);
    }

    // Check deployer balance
    const [deployer] = await hre.ethers.getSigners();
    const balance = await deployer.provider.getBalance(deployer.address);
    const minBalance = hre.ethers.parseEther("0.01");

    if (balance < minBalance) {
      console.warn(`⚠️  Low balance: ${hre.ethers.formatEther(balance)} ETH`);
      if (this.network === 'base-sepolia') {
        console.log("💰 Get Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
      }
    }

    console.log(`✅ Deployer: ${deployer.address}`);
    console.log(`✅ Balance: ${hre.ethers.formatEther(balance)} ETH`);
  }

  async deployContracts() {
    console.log("\n🔨 Deploying contracts...");

    const [deployer] = await hre.ethers.getSigners();
    const URI = "https://api.webvm.farterm.app/metadata/{id}.json";

    // Deploy WebVMSessionAuth
    const WebVMSessionAuth = await hre.ethers.getContractFactory("WebVMSessionAuth");
    const webvmSessionAuth = await WebVMSessionAuth.deploy(URI, deployer.address);
    
    await webvmSessionAuth.waitForDeployment();
    this.contractAddress = await webvmSessionAuth.getAddress();

    console.log(`✅ WebVMSessionAuth deployed: ${this.contractAddress}`);

    // Wait for confirmations
    const deployTx = webvmSessionAuth.deploymentTransaction();
    await deployTx.wait(3);

    // Verify deployment
    const hasAdminRole = await webvmSessionAuth.hasRole(
      await webvmSessionAuth.DEFAULT_ADMIN_ROLE(),
      deployer.address
    );

    if (!hasAdminRole) {
      throw new Error("Deployment verification failed: Admin role not assigned");
    }

    // Get token prices
    const tokenPrices = {
      owner: await webvmSessionAuth.getTokenPrice(1),
      admin: await webvmSessionAuth.getTokenPrice(2),
      user: await webvmSessionAuth.getTokenPrice(3),
      readonly: await webvmSessionAuth.getTokenPrice(4)
    };

    this.deploymentInfo = {
      network: this.network,
      chainId: hre.network.config.chainId,
      contractAddress: this.contractAddress,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      transactionHash: deployTx.hash,
      blockNumber: deployTx.blockNumber,
      gasUsed: deployTx.gasLimit?.toString(),
      gasPrice: deployTx.gasPrice?.toString(),
      parameters: {
        uri: URI,
        initialAdmin: deployer.address
      },
      tokenPrices: {
        owner: hre.ethers.formatEther(tokenPrices.owner),
        admin: hre.ethers.formatEther(tokenPrices.admin),
        user: hre.ethers.formatEther(tokenPrices.user),
        readonly: hre.ethers.formatEther(tokenPrices.readonly)
      },
      links: this.getExplorerLinks()
    };

    // Save deployment info
    this.saveDeploymentInfo();
  }

  async exportABIs() {
    console.log("\n📦 Exporting ABIs...");

    const { exportABI } = require('./export-abi');
    await exportABI();

    console.log("✅ ABIs exported successfully");
  }

  async generateIntegrationFiles() {
    console.log("\n🌐 Generating integration files...");

    // Update contract addresses in types.ts
    await this.updateContractAddresses();

    // Generate environment configuration
    await this.generateEnvironmentConfig();

    // Create frontend integration package
    await this.createFrontendPackage();

    // Generate deployment scripts
    await this.generateDeploymentScripts();

    console.log("✅ Integration files generated");
  }

  async updateContractAddresses() {
    const typesPath = './abi/types.ts';
    
    if (fs.existsSync(typesPath)) {
      let content = fs.readFileSync(typesPath, 'utf8');
      
      // Update contract addresses
      const addressKey = this.network === 'base' ? 'BASE_MAINNET' : 'BASE_SEPOLIA';
      content = content.replace(
        new RegExp(`${addressKey}: '',`),
        `${addressKey}: '${this.contractAddress}',`
      );

      fs.writeFileSync(typesPath, content);
      console.log(`✅ Updated contract address in types.ts: ${addressKey}`);
    }
  }

  async generateEnvironmentConfig() {
    const envConfig = `# WebVM Session Auth - Generated Environment Configuration
# Network: ${this.network}
# Deployed: ${this.deploymentInfo.deploymentTime}

# Contract Configuration
CONTRACT_ADDRESS=${this.contractAddress}
NETWORK=${this.network}
CHAIN_ID=${this.deploymentInfo.chainId}

# Token Prices (in ETH)
OWNER_TOKEN_PRICE=${this.deploymentInfo.tokenPrices.owner}
ADMIN_TOKEN_PRICE=${this.deploymentInfo.tokenPrices.admin}
USER_TOKEN_PRICE=${this.deploymentInfo.tokenPrices.user}
READONLY_TOKEN_PRICE=${this.deploymentInfo.tokenPrices.readonly}

# Explorer Links
EXPLORER_URL=${this.deploymentInfo.links.basescan}
TRANSACTION_URL=${this.deploymentInfo.links.transaction}

# Integration URLs
METADATA_BASE_URL=https://api.webvm.farterm.app/metadata
WEBSOCKET_URL=ws://localhost:8080
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
`;

    fs.writeFileSync('./deployments/integration.env', envConfig);
    console.log("✅ Generated integration environment configuration");
  }

  async createFrontendPackage() {
    const packageInfo = {
      name: "@webvm/session-auth",
      version: "1.0.0",
      description: "WebVM Session Auth contract integration",
      main: "index.js",
      types: "types.ts",
      files: [
        "*.json",
        "*.ts",
        "*.js"
      ],
      keywords: [
        "webvm",
        "session",
        "auth",
        "blockchain",
        "base",
        "evmauth"
      ],
      deployment: this.deploymentInfo,
      peerDependencies: {
        "wagmi": "^1.0.0",
        "viem": "^1.0.0"
      }
    };

    fs.writeFileSync('./abi/package.json', JSON.stringify(packageInfo, null, 2));
    console.log("✅ Created frontend integration package");
  }

  async generateDeploymentScripts() {
    // Generate verification script
    const verifyScript = `#!/bin/bash
# Auto-generated verification script
# Network: ${this.network}
# Contract: ${this.contractAddress}

echo "🔍 Verifying WebVMSessionAuth contract..."
npx hardhat verify --network ${this.network} \\
  ${this.contractAddress} \\
  "https://api.webvm.farterm.app/metadata/{id}.json" \\
  "${this.deploymentInfo.deployer}"

echo "✅ Verification completed!"
`;

    fs.writeFileSync('./scripts/verify-contract.sh', verifyScript);
    fs.chmodSync('./scripts/verify-contract.sh', '755');

    // Generate interaction script
    const interactionScript = `#!/usr/bin/env node
// Auto-generated contract interaction script
const hre = require("hardhat");

async function main() {
  const contract = await hre.ethers.getContractAt(
    "WebVMSessionAuth",
    "${this.contractAddress}"
  );

  console.log("📋 Contract Information:");
  console.log("Address:", contract.target);
  console.log("Network:", hre.network.name);
  
  // Get token prices
  const prices = {
    owner: await contract.getTokenPrice(1),
    admin: await contract.getTokenPrice(2),
    user: await contract.getTokenPrice(3),
    readonly: await contract.getTokenPrice(4)
  };
  
  console.log("\\n💰 Token Prices:");
  Object.entries(prices).forEach(([type, price]) => {
    console.log(\`- \${type}: \${hre.ethers.formatEther(price)} ETH\`);
  });
  
  // Get next token ID
  const nextTokenId = await contract.getNextTokenId();
  console.log("\\n🆔 Next Token ID:", nextTokenId.toString());
}

main().catch(console.error);
`;

    fs.writeFileSync('./scripts/interact-contract.js', interactionScript);
    console.log("✅ Generated deployment scripts");
  }

  async createDeploymentSummary() {
    console.log("\n📄 Creating deployment summary...");

    const summary = `# WebVM Session Auth Deployment Summary

## 🚀 Deployment Information

- **Network**: ${this.deploymentInfo.network}
- **Chain ID**: ${this.deploymentInfo.chainId}
- **Contract Address**: \`${this.deploymentInfo.contractAddress}\`
- **Deployer**: \`${this.deploymentInfo.deployer}\`
- **Deployment Time**: ${this.deploymentInfo.deploymentTime}
- **Transaction Hash**: \`${this.deploymentInfo.transactionHash}\`
- **Block Number**: ${this.deploymentInfo.blockNumber}

## 💰 Token Pricing

| Token Type | Price (ETH) | Duration | Permissions |
|------------|-------------|----------|-------------|
| Owner | ${this.deploymentInfo.tokenPrices.owner} | 30 days | Full control |
| Admin | ${this.deploymentInfo.tokenPrices.admin} | 7 days | Manage users |
| User | ${this.deploymentInfo.tokenPrices.user} | 24 hours | Read/write |
| Readonly | ${this.deploymentInfo.tokenPrices.readonly} | 1 hour | Read-only |

## 🔗 Links

- **Contract on Explorer**: ${this.deploymentInfo.links.basescan}
- **Deployment Transaction**: ${this.deploymentInfo.links.transaction}

## 🛠️ Next Steps

1. **Verify Contract** (optional):
   \`\`\`bash
   ./scripts/verify-contract.sh
   \`\`\`

2. **Test Contract**:
   \`\`\`bash
   node scripts/interact-contract.js
   \`\`\`

3. **Frontend Integration**:
   - Copy \`./abi/*\` files to your frontend
   - Update contract address in your app
   - Install dependencies: \`npm install wagmi viem\`

4. **Start Real-time Server**:
   \`\`\`bash
   node scripts/realtime-tracker.js
   \`\`\`

5. **Setup IPFS**:
   - Get Pinata API keys: https://app.pinata.cloud/
   - Add to your \`.env\` file

## 📊 Gas Usage

- **Deployment Gas**: ${this.deploymentInfo.gasUsed || 'N/A'}
- **Gas Price**: ${this.deploymentInfo.gasPrice ? hre.ethers.formatUnits(this.deploymentInfo.gasPrice, 'gwei') + ' gwei' : 'N/A'}

## 🎉 Success!

Your WebVM Session Auth system is now deployed and ready for integration!

For support and documentation, visit: https://docs.webvm.farterm.app
`;

    fs.writeFileSync('./DEPLOYMENT_SUMMARY.md', summary);
    console.log("✅ Deployment summary created");
  }

  getExplorerLinks() {
    const baseUrl = this.network === 'base' 
      ? 'https://basescan.org' 
      : 'https://sepolia.basescan.org';
    
    return {
      basescan: `${baseUrl}/address/${this.contractAddress}`,
      transaction: `${baseUrl}/tx/${this.deploymentInfo?.transactionHash}`
    };
  }

  saveDeploymentInfo() {
    const deploymentPath = `./deployments/${this.network}-deployment.json`;
    
    if (!fs.existsSync('./deployments')) {
      fs.mkdirSync('./deployments');
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(this.deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved: ${deploymentPath}`);
  }
}

// Main execution
async function main() {
  try {
    const manager = new WebVMDeploymentManager();
    const deploymentInfo = await manager.deploy();
    
    console.log("\n🎊 DEPLOYMENT COMPLETE! 🎊");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📍 Contract Address: ${deploymentInfo.contractAddress}`);
    console.log(`🌐 Network: ${deploymentInfo.network}`);
    console.log(`🔗 Explorer: ${deploymentInfo.links.basescan}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📚 Next steps:");
    console.log("1. Review DEPLOYMENT_SUMMARY.md");
    console.log("2. Copy ./abi/* to your frontend");
    console.log("3. Start real-time server: node scripts/realtime-tracker.js");
    console.log("4. Setup IPFS credentials in .env");
    console.log("\n🚀 Your WebVM sessions are now decentralized!");
    
    return deploymentInfo;
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("1. Check your .env configuration");
    console.error("2. Ensure sufficient ETH balance");
    console.error("3. Verify network connectivity");
    console.error("4. Review the full error above");
    process.exit(1);
  }
}

// Export for use as module
module.exports = { WebVMDeploymentManager };

// Run if called directly
if (require.main === module) {
  main();
} 