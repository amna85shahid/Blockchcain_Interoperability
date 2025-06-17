const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));
  const token = await ethers.getContractAt("BridgeableToken", addresses.tokenSepolia);

  const BRIDGE_ROLE = await token.BRIDGE_ROLE();
  const senderAddress = addresses.user;

  const tx = await token.grantRole(BRIDGE_ROLE, senderAddress);
  await tx.wait();

  console.log(`Granted BRIDGE_ROLE to user on Sepolia: ${senderAddress}`);
}

main().catch(console.error);