// IPFS Utilities for WebVM Session Persistence
// This module provides functions to store and retrieve session data from IPFS

const fs = require('fs');
const path = require('path');

/**
 * IPFS Configuration
 * You can use any IPFS provider - Pinata, Infura, or local IPFS node
 */
const IPFS_CONFIG = {
  // Pinata (recommended for production)
  pinata: {
    apiKey: process.env.PINATA_API_KEY,
    secretKey: process.env.PINATA_SECRET_KEY,
    baseUrl: 'https://api.pinata.cloud'
  },
  
  // Infura IPFS
  infura: {
    projectId: process.env.INFURA_PROJECT_ID,
    projectSecret: process.env.INFURA_PROJECT_SECRET,
    baseUrl: 'https://ipfs.infura.io:5001'
  },
  
  // Local IPFS node
  local: {
    baseUrl: 'http://localhost:5001'
  }
};

/**
 * Session data structure for IPFS storage
 */
class SessionData {
  constructor(sessionId, metadata = {}) {
    this.sessionId = sessionId;
    this.version = '1.0.0';
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.metadata = {
      sessionName: metadata.sessionName || '',
      description: metadata.description || '',
      creator: metadata.creator || '',
      maxUsers: metadata.maxUsers || 10,
      isPublic: metadata.isPublic || false,
      ...metadata
    };
    this.filesystem = {
      files: {},
      directories: {},
      permissions: {}
    };
    this.terminal = {
      history: [],
      environment: {},
      workingDirectory: '/home/user'
    };
    this.users = [];
    this.events = [];
  }

  addUser(userAddress, role, joinedAt) {
    this.users.push({
      address: userAddress,
      role: role,
      joinedAt: joinedAt,
      lastActive: new Date().toISOString()
    });
    this.updatedAt = new Date().toISOString();
  }

  removeUser(userAddress) {
    this.users = this.users.filter(user => user.address !== userAddress);
    this.updatedAt = new Date().toISOString();
  }

  addEvent(eventType, data) {
    this.events.push({
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    });
    this.updatedAt = new Date().toISOString();
  }

  updateFilesystem(files, directories) {
    this.filesystem.files = { ...this.filesystem.files, ...files };
    this.filesystem.directories = { ...this.filesystem.directories, ...directories };
    this.updatedAt = new Date().toISOString();
  }

  addTerminalHistory(command, output, user) {
    this.terminal.history.push({
      command: command,
      output: output,
      user: user,
      timestamp: new Date().toISOString()
    });
    this.updatedAt = new Date().toISOString();
  }
}

/**
 * Upload session data to IPFS using Pinata
 */
async function uploadToPinata(sessionData) {
  const { pinata } = IPFS_CONFIG;
  
  if (!pinata.apiKey || !pinata.secretKey) {
    throw new Error('Pinata API credentials not configured');
  }

  const data = JSON.stringify(sessionData, null, 2);
  
  const formData = new FormData();
  formData.append('file', new Blob([data], { type: 'application/json' }), 'session.json');
  formData.append('pinataMetadata', JSON.stringify({
    name: `WebVM Session ${sessionData.sessionId}`,
    keyvalues: {
      sessionId: sessionData.sessionId.toString(),
      creator: sessionData.metadata.creator,
      version: sessionData.version
    }
  }));

  const response = await fetch(`${pinata.baseUrl}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      'pinata_api_key': pinata.apiKey,
      'pinata_secret_api_key': pinata.secretKey
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.IpfsHash;
}

/**
 * Retrieve session data from IPFS
 */
async function retrieveFromIPFS(ipfsHash, provider = 'pinata') {
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    `https://ipfs.io/ipfs/${ipfsHash}`,
    `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
    `https://dweb.link/ipfs/${ipfsHash}`
  ];

  for (const gateway of gateways) {
    try {
      const response = await fetch(gateway, {
        timeout: 10000 // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${gateway}:`, error.message);
    }
  }

  throw new Error(`Failed to retrieve data from IPFS hash: ${ipfsHash}`);
}

/**
 * Create a new session and upload to IPFS
 */
async function createSession(sessionId, metadata) {
  console.log(`📦 Creating session ${sessionId} on IPFS...`);
  
  const sessionData = new SessionData(sessionId, metadata);
  
  try {
    const ipfsHash = await uploadToPinata(sessionData);
    console.log(`✅ Session uploaded to IPFS: ${ipfsHash}`);
    
    return {
      sessionData,
      ipfsHash,
      gateways: [
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        `https://ipfs.io/ipfs/${ipfsHash}`
      ]
    };
  } catch (error) {
    console.error(`❌ Failed to create session on IPFS:`, error);
    throw error;
  }
}

/**
 * Update existing session data
 */
async function updateSession(ipfsHash, updateFunction) {
  console.log(`📝 Updating session from IPFS: ${ipfsHash}`);
  
  try {
    // Retrieve current data
    const currentData = await retrieveFromIPFS(ipfsHash);
    
    // Apply updates
    const updatedData = updateFunction(currentData);
    updatedData.updatedAt = new Date().toISOString();
    
    // Upload updated data
    const newIpfsHash = await uploadToPinata(updatedData);
    console.log(`✅ Session updated on IPFS: ${newIpfsHash}`);
    
    return {
      sessionData: updatedData,
      ipfsHash: newIpfsHash,
      previousHash: ipfsHash
    };
  } catch (error) {
    console.error(`❌ Failed to update session on IPFS:`, error);
    throw error;
  }
}

/**
 * Generate environment configuration for session
 */
function generateEnvironmentConfig() {
  return `# IPFS Configuration for WebVM Sessions
# Copy this to your .env file and fill in your credentials

# Pinata (Recommended for production)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# Infura IPFS (Alternative)
INFURA_PROJECT_ID=your_infura_project_id_here
INFURA_PROJECT_SECRET=your_infura_project_secret_here

# Usage Examples:
# 1. Get Pinata credentials: https://app.pinata.cloud/
# 2. Get Infura credentials: https://infura.io/
`;
}

/**
 * Example usage and testing
 */
async function example() {
  try {
    // Create a new session
    const sessionMetadata = {
      sessionName: "Test WebVM Session",
      description: "A test session for development",
      creator: "0x1234567890123456789012345678901234567890",
      maxUsers: 5,
      isPublic: true
    };

    const { sessionData, ipfsHash } = await createSession(1, sessionMetadata);
    console.log("Created session:", sessionData);
    console.log("IPFS Hash:", ipfsHash);

    // Update the session
    const updated = await updateSession(ipfsHash, (data) => {
      data.addUser("0xabcdef1234567890", "user", Date.now());
      data.addEvent("user_joined", { user: "0xabcdef1234567890" });
      return data;
    });

    console.log("Updated session:", updated.sessionData);
    console.log("New IPFS Hash:", updated.ipfsHash);

  } catch (error) {
    console.error("Example failed:", error);
  }
}

module.exports = {
  SessionData,
  createSession,
  updateSession,
  retrieveFromIPFS,
  uploadToPinata,
  generateEnvironmentConfig,
  example
};

// If run directly, show example
if (require.main === module) {
  console.log("🌐 IPFS Utilities for WebVM Sessions");
  console.log("\n📋 Environment Configuration:");
  console.log(generateEnvironmentConfig());
  
  // Uncomment to run example (requires API keys)
  // example();
} 