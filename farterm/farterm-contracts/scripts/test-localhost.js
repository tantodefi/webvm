const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing localhost deployment...");
  
  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  // Get the contract instance
  const WebVMSessionAuth = await hre.ethers.getContractFactory("WebVMSessionAuth");
  const contract = await WebVMSessionAuth.attach(contractAddress);
  
  console.log("📍 Contract Address:", contractAddress);
  console.log("🌐 Network:", hre.network.name);
  
  try {
    // Test basic contract functions
    console.log("\n🔍 Testing contract functions...");
    
    // Get next token ID
    const nextTokenId = await contract.getNextTokenId();
    console.log("✅ Next Token ID:", nextTokenId.toString());
    
    // Get token prices
    const ownerPrice = await contract.getTokenPrice(1);
    const adminPrice = await contract.getTokenPrice(2);
    const userPrice = await contract.getTokenPrice(3);
    const readonlyPrice = await contract.getTokenPrice(4);
    
    console.log("\n💰 Token Prices:");
    console.log("- Owner:", hre.ethers.formatEther(ownerPrice), "ETH");
    console.log("- Admin:", hre.ethers.formatEther(adminPrice), "ETH");
    console.log("- User:", hre.ethers.formatEther(userPrice), "ETH");
    console.log("- Readonly:", hre.ethers.formatEther(readonlyPrice), "ETH");
    
    // Check admin role
    const [deployer] = await hre.ethers.getSigners();
    const hasAdminRole = await contract.hasRole(
      await contract.DEFAULT_ADMIN_ROLE(),
      deployer.address
    );
    console.log("\n👤 Admin Status:");
    console.log("- Deployer has admin role:", hasAdminRole);
    console.log("- Deployer address:", deployer.address);
    
    console.log("\n🎉 Contract is working correctly!");
    
    return {
      contractAddress,
      network: hre.network.name,
      nextTokenId: nextTokenId.toString(),
      tokenPrices: {
        owner: hre.ethers.formatEther(ownerPrice),
        admin: hre.ethers.formatEther(adminPrice),
        user: hre.ethers.formatEther(userPrice),
        readonly: hre.ethers.formatEther(readonlyPrice)
      },
      adminAddress: deployer.address,
      hasAdminRole
    };
    
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
    throw error;
  }
}

main()
  .then((result) => {
    console.log("\n📊 Test Results:");
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 