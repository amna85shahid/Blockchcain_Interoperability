const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {

    const addresses = JSON.parse(fs.readFileSync("addresses.json"));

    const tokenAddress = addresses.tokenBSC;
    const bridgeAddress = addresses.receiver;

    const token = await ethers.getContractAt("BridgeableToken", tokenAddress);
    const BRIDGE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_ROLE"));

    const hasRole = await token.hasRole(BRIDGE_ROLE, bridgeAddress);
    console.log(`${bridgeAddress} has BRIDGE_ROLE: ${hasRole}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});