const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const addresses = fs.existsSync("addresses.json")
    ? JSON.parse(fs.readFileSync("addresses.json"))
    : {};

  const name = "EVToken";
  const symbol = "EVT";
  const supply = ethers.parseEther("1000");
  const deployer = (await ethers.getSigners())[0];

  const Token = await ethers.getContractFactory("BridgeableToken");
  const token = await Token.deploy(name, symbol, supply, deployer.address, {
    maxFeePerGas: ethers.parseUnits("10", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("3", "gwei"),
  });
  await token.waitForDeployment();

  addresses.tokenBSC = await token.getAddress();
  fs.writeFileSync("addresses.json", JSON.stringify(addresses, null, 2));
  console.log("BSC token deployed at:", token.target);
}

main().catch(console.error);