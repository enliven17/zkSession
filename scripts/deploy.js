const hre = require("hardhat");

async function main() {
  console.log("Deploying XLayerSession contract...");

  const XLayerSession = await hre.ethers.getContractFactory("XLayerSession");
  const xlayerSession = await XLayerSession.deploy();

  await xlayerSession.waitForDeployment();

  const address = await xlayerSession.getAddress();
  console.log("XLayerSession deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 