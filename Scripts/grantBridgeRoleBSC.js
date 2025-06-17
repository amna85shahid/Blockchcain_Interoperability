const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));
  const token = await ethers.getContractAt("BridgeableToken", addresses.tokenBSC);

  const BRIDGE_ROLE = await token.BRIDGE_ROLE();
  const receiverAddress = addresses.receiver;

  const tx = await token.grantRole(BRIDGE_ROLE, receiverAddress, {
        maxFeePerGas: ethers.parseUnits("10", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("3", "gwei"),});
  await tx.wait();

  console.log(`Granted BRIDGE_ROLE to EVStation on BSC: ${receiverAddress}`);
}

main().catch(console.error);