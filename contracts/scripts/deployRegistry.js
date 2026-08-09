const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying KYCRegistry...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  const KYCRegistry = await ethers.getContractFactory("KYCRegistry");
  const kycRegistry = await KYCRegistry.deploy();
  await kycRegistry.waitForDeployment();

  const contractAddress = await kycRegistry.getAddress();
  console.log("✅ KYCRegistry deployed to:", contractAddress);
  
  console.log("──────────────────────────────────────────────");
  console.log("📋 Copy this address into backend/.env:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log("──────────────────────────────────────────────");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
