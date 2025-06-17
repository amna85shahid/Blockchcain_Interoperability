const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));
  const receiver = await ethers.getContractAt("EVCharger", addresses.receiver);

  const remoteChainId = 10161; // Sepolia LayerZero chain ID
  const remoteSender = addresses.user;

  const remotePath = ethers.solidityPacked(["address", "address"], [remoteSender, addresses.receiver]);

  const tx = await receiver.setTrustedRemote(remoteChainId, remotePath, {
    maxFeePerGas: ethers.parseUnits("10", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("3", "gwei"),
  });
  await tx.wait();

  console.log(`Trusted remote set on BSC EVCharger for Sepolia user`);
}

main().catch(console.error);