const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));

  const sender = await ethers.getContractAt("UserWallet", addresses.user);

  const dstChainId = 10102; // BSC
  const trustedRemoteRaw = await sender.trustedRemoteLookup(dstChainId);

  console.log("trustedRemote (Sepolia → BSC):");
  console.log("→ Receiver on BSC (expected):", trustedRemoteRaw);
  console.log("→ Should match:", addresses.receiver);
  console.log("Length:", trustedRemoteRaw.length);
}

main().catch(console.error);