const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));
  const user = await ethers.getContractAt("UserWallet", addresses.user);

  const remoteChainId = 10102; // LayerZero chain ID for BSC Testnet
  const remoteReceiver = addresses.receiver;

  const remotePath = ethers.solidityPacked(
    ["address", "address"],
    [remoteReceiver, addresses.user]
  );

  const tx = await user.setTrustedRemote(remoteChainId, remotePath);
  await tx.wait();

  console.log(`Trusted remote set on Sepolia user for BSC receiver EVCharger`);
}

main().catch(console.error);