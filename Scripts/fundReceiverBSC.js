const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));

  const receiverAddress = addresses.receiver;
  const amount = ethers.parseEther("0.5"); //the amount to fund the EVCharger Contract

  const tx = await deployer.sendTransaction({
    to: receiverAddress,
    value: amount,
    maxFeePerGas: ethers.parseUnits("10", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("3", "gwei"),
  });
  await tx.wait();

  console.log(`Funded receiver with ${ethers.formatEther(amount)} BNB`);
}

main().catch(console.error);