const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));

  const receiver = await ethers.getContractAt("EVCharger", addresses.receiver);
  const sender = addresses.user;

  const srcChainId = 10161; // Sepolia

  const trustedRemoteRaw = await receiver.trustedRemoteLookup(srcChainId);

  console.log("trustedRemote (BSC → Sepolia):");
  console.log("→ Stored (last 20 bytes):", trustedRemoteRaw);
  console.log("→ Should match sender:", addresses.user.toLowerCase());
  console.log("Length:", trustedRemoteRaw.length);
}

main().catch(console.error);