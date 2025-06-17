const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));
  const tokenAddress = addresses.tokenBSC;
  const receiverAddress = addresses.receiver;

  if (!tokenAddress || !receiverAddress) {
    throw new Error("'tokenBSC' or 'receiver' missing from addresses.json.");
  }

  const [signer] = await ethers.getSigners();
  const token = await ethers.getContractAt("BridgeableToken", tokenAddress);

  const walletAddress = signer.address;
  const contractAddress = addresses.receiver;

  const walletBalance = await token.balanceOf(walletAddress);
  const contractBalance = await token.balanceOf(contractAddress);

  console.log("Network: BSC Testnet");
  console.log(`Wallet Address: `, walletAddress);
  console.log(`Wallet Balance: `, ethers.formatUnits(walletBalance, 18), "BRG");
  console.log(`MessageReceiver Contract Balance: `, ethers.formatUnits(contractBalance, 18), "BRG");
}

main().catch(console.error);