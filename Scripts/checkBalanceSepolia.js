const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));
  const tokenAddress = addresses.tokenSepolia;
  const senderAddress = addresses.user;

  if (!tokenAddress || !senderAddress) {
    throw new Error("'tokenSepolia' or 'sender' missing from addresses.json.");
  }

  const [signer] = await ethers.getSigners();
  const token = await ethers.getContractAt("BridgeableToken", tokenAddress);

  const userBalance = await token.balanceOf(signer.address);
  const senderBalance = await token.balanceOf(senderAddress);

  console.log("Network: Sepolia");
  console.log(`Wallet Address: ${signer.address}`);
  console.log(`Wallet Balance: ${ethers.formatEther(userBalance)} BRG`);
  console.log(`MessageSender Contract Balance: ${ethers.formatEther(senderBalance)} BRG`);
}

main().catch(console.error);