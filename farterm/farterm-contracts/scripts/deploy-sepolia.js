const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Deploying WebVM Session Auth to Base Sepolia...");

  // Verify we're on the correct network
  if (hre.network.name !== "base-sepolia") {
    throw new Error(`❌ Wrong network! Expected base-sepolia, got ${hre.network.name}`);
  }

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance < hre.ethers.parseEther("0.01")) {
    console.warn("⚠️  Low balance! You may need more ETH for deployment and testing.");
    console.log("💰 Get Base Sepolia ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
  }

  // Contract parameters
  const URI = "https://api.webvm.farterm.app/metadata/{id}.json";
  const INITIAL_ADMIN = deployer.address;

  console.log("\n📋 Deployment Parameters:");
  console.log("- Network:", hre.network.name);
  console.log("- Chain ID:", hre.network.config.chainId);
  console.log("- URI:", URI);
  console.log("- Initial Admin:", INITIAL_ADMIN);

  // Deploy WebVMSessionAuth contract
  console.log("\n🔨 Deploying WebVMSessionAuth...");
  const WebVMSessionAuth = await hre.ethers.getContractFactory("WebVMSessionAuth");
  
  // Estimate gas
  const deploymentData = WebVMSessionAuth.interface.encodeDeploy([URI, INITIAL_ADMIN]);
  const estimatedGas = await deployer.estimateGas({
    data: deploymentData
  });
  console.log("Estimated gas:", estimatedGas.toString());

  const webvmSessionAuth = await WebVMSessionAuth.deploy(
    URI,
    INITIAL_ADMIN,
    {
      gasLimit: estimatedGas * 120n / 100n // Add 20% buffer
    }
  );

  console.log("⏳ Waiting for deployment transaction...");
  await webvmSessionAuth.waitForDeployment();
  const contractAddress = await webvmSessionAuth.getAddress();

  console.log("✅ WebVMSessionAuth deployed to:", contractAddress);
  console.log("🔗 View on BaseScan:", `https://sepolia.basescan.org/address/${contractAddress}`);

  // Wait for a few confirmations before verification
  console.log("\n⏳ Waiting for confirmations...");
  const deployTx = webvmSessionAuth.deploymentTransaction();
  await deployTx.wait(3); // Wait for 3 confirmations

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  try {
    const hasAdminRole = await webvmSessionAuth.hasRole(
      await webvmSessionAuth.DEFAULT_ADMIN_ROLE(),
      deployer.address
    );
    console.log("✅ Deployer has admin role:", hasAdminRole);
    
    const nextTokenId = await webvmSessionAuth.getNextTokenId();
    console.log("✅ Next token ID:", nextTokenId.toString());

    // Check token metadata for session tokens
    const ownerTokenPrice = await webvmSessionAuth.getTokenPrice(1);
    const adminTokenPrice = await webvmSessionAuth.getTokenPrice(2);
    const userTokenPrice = await webvmSessionAuth.getTokenPrice(3);
    const readonlyTokenPrice = await webvmSessionAuth.getTokenPrice(4);

    console.log("\n💰 Token Prices:");
    console.log("- Owner Token:", hre.ethers.formatEther(ownerTokenPrice), "ETH");
    console.log("- Admin Token:", hre.ethers.formatEther(adminTokenPrice), "ETH");
    console.log("- User Token:", hre.ethers.formatEther(userTokenPrice), "ETH");
    console.log("- Readonly Token:", hre.ethers.formatEther(readonlyTokenPrice), "ETH");

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: deployTx.hash,
    blockNumber: deployTx.blockNumber,
    gasUsed: deployTx.gasLimit?.toString(),
    gasPrice: deployTx.gasPrice?.toString(),
    parameters: {
      uri: URI,
      initialAdmin: INITIAL_ADMIN
    },
    tokenPrices: {
      owner: hre.ethers.formatEther(await webvmSessionAuth.getTokenPrice(1)),
      admin: hre.ethers.formatEther(await webvmSessionAuth.getTokenPrice(2)),
      user: hre.ethers.formatEther(await webvmSessionAuth.getTokenPrice(3)),
      readonly: hre.ethers.formatEther(await webvmSessionAuth.getTokenPrice(4))
    },
    links: {
      basescan: `https://sepolia.basescan.org/address/${contractAddress}`,
      transaction: `https://sepolia.basescan.org/tx/${deployTx.hash}`
    }
  };

  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const deploymentPath = `./deployments/${hre.network.name}-deployment.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments');
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);

  // Contract verification instructions
  console.log("\n🔍 To verify on BaseScan, run:");
  console.log(`npx hardhat verify --network base-sepolia ${contractAddress} "${URI}" "${INITIAL_ADMIN}"`);

  // Frontend integration info
  console.log("\n🌐 Frontend Integration:");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", "Base Sepolia (Chain ID: 84532)");
  console.log("ABI Location:", "./artifacts/contracts/WebVMSessionAuth.sol/WebVMSessionAuth.json");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("🔗 BaseScan:", `https://sepolia.basescan.org/address/${contractAddress}`);
  
  return {
    contractAddress,
    deploymentInfo
  };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(({ contractAddress, deploymentInfo }) => {
    console.log(`\n✨ Contract deployed at: ${contractAddress}`);
    console.log(`🌐 Ready for frontend integration!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 