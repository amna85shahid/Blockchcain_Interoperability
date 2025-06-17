const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = JSON.parse(fs.readFileSync("addresses.json"));

  const endpoint = addresses.endpointSepolia;
  const token = addresses.tokenSepolia;

  const User = await ethers.getContractFactory("UserWallet");
  const user = await User.deploy(endpoint, token);
  await user.waitForDeployment();

  addresses.user = await user.getAddress();
  fs.writeFileSync("addresses.json", JSON.stringify(addresses, null, 2));

  console.log("User deployed at:", user.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});