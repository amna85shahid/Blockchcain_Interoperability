const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));

  const endpoint = addresses.endpointBSC;
  const token = addresses.tokenBSC;

  const Receiver = await ethers.getContractFactory("EVCharger");
  const receiver = await Receiver.deploy(endpoint, token, {
        maxFeePerGas: ethers.parseUnits("10", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("3", "gwei"),});
  await receiver.waitForDeployment();

  addresses.receiver = await receiver.getAddress();
  fs.writeFileSync("addresses.json", JSON.stringify(addresses, null, 2));

  console.log("EVCharger deployed at:", receiver.target);
}

main().catch(console.error);