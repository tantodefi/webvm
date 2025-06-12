const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying WebVM Session Auth contracts...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Contract parameters
  const URI = "https://api.webvm.farterm.app/metadata/{id}.json";
  const INITIAL_ADMIN = deployer.address;

  console.log("\n📋 Deployment Parameters:");
  console.log("- URI:", URI);
  console.log("- Initial Admin:", INITIAL_ADMIN);

  // Deploy WebVMSessionAuth contract
  console.log("\n🔨 Deploying WebVMSessionAuth...");
  const WebVMSessionAuth = await hre.ethers.getContractFactory("WebVMSessionAuth");
  const webvmSessionAuth = await WebVMSessionAuth.deploy(
    URI,
    INITIAL_ADMIN
  );

  await webvmSessionAuth.waitForDeployment();
  const contractAddress = await webvmSessionAuth.getAddress();

  console.log("✅ WebVMSessionAuth deployed to:", contractAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  try {
    const hasAdminRole = await webvmSessionAuth.hasRole(
      await webvmSessionAuth.DEFAULT_ADMIN_ROLE(),
      deployer.address
    );
    console.log("Deployer has admin role:", hasAdminRole);
    
    const nextTokenId = await webvmSessionAuth.getNextTokenId();
    console.log("Next token ID:", nextTokenId.toString());

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
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: webvmSessionAuth.deploymentTransaction().hash,
    blockNumber: webvmSessionAuth.deploymentTransaction().blockNumber,
    gasUsed: webvmSessionAuth.deploymentTransaction().gasLimit?.toString(),
    parameters: {
      uri: URI,
      initialAdmin: INITIAL_ADMIN
    },
    tokenPrices: {
      owner: hre.ethers.formatEther(await webvmSessionAuth.getTokenPrice(1)),
      admin: hre.ethers.formatEther(await webvmSessionAuth.getTokenPrice(2)),
      user: hre.ethers.formatEther(await webvmSessionAuth.getTokenPrice(3)),
      readonly: hre.ethers.formatEther(await webvmSessionAuth.getTokenPrice(4))
    }
  };

  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require('fs');
  const deploymentPath = `./deployments/${hre.network.name}-deployment.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments');
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);

  // Instructions for verification on Etherscan
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 To verify on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} "${URI}"`);
  }

  console.log("\n🎉 Deployment completed successfully!");
  return contractAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((contractAddress) => {
    console.log(`\n✨ Contract deployed at: ${contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 