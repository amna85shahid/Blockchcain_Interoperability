const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));

  const receiverAddress = addresses.receiver;
  const balance = await ethers.provider.getBalance(receiverAddress);

  console.log(`Network: ${network.name}`);
  console.log(`Receiver Contract: ${receiverAddress}`);
  console.log(`BNB Balance: ${ethers.formatEther(balance)} BNB`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
