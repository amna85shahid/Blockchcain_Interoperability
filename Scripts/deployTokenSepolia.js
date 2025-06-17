const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = fs.existsSync("addresses.json")
    ? JSON.parse(fs.readFileSync("addresses.json"))
    : {};

  const Token = await ethers.getContractFactory("BridgeableToken");
  const name = "EVToken";
  const symbol = "EVT";
  const supply = ethers.parseEther("1000");
  const deployer = (await ethers.getSigners())[0];

  // TEMPORARY: deploy with deployer as bridge address
  const token = await Token.deploy(name, symbol, supply, deployer.address);
  await token.waitForDeployment();

  addresses.tokenSepolia = await token.getAddress();
  fs.writeFileSync("addresses.json", JSON.stringify(addresses, null, 2));

  console.log("Sepolia Token Deployed at: ", addresses.tokenSepolia);
}

main().catch((error) => {
     console.error(error);
  process.exitCode = 1;
});