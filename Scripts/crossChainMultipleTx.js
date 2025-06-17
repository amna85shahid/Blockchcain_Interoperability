const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const { createObjectCsvWriter } = require("csv-writer");
require("dotenv").config();

const DST_CHAIN_ID = 10102;
const GAS_LIMIT_DST = 1_000_000;
const FEE_BUFFER_X = 2n;
const POLL_DELAY_MS = 10000;
const MAX_POLLS = 30;
const NUM_TRANSACTIONS = 1;
const Tokens = 5;

const OUTPUT_FILE = "cross_chain_metrics_50T.csv";
const csvWriter = createObjectCsvWriter({
  path: OUTPUT_FILE,
  header: [
    { id: "session", title: "Session" },
    { id: "station_id", title: "Station_ID" },
    { id: "start_time", title: "Start_Time" },
    { id: "burn_time", title: "Burn_Time" },
    { id: "mint_time", title: "Mint_Time" },
    { id: "mint_latency", title: "Mint_Latency(s)" },
    { id: "full_cycle_latency", title: "Full_Cycle_Latency(s)" },
    { id: "sep_gas_eth", title: "Sepolia_Gas_Cost_ETH" },
    { id: "bsc_gas_bnb", title: "BSC_Gas_Cost_BNB" },
    { id: "lz_fee_eth", title: "LZ_Fee_ETH" },
    { id: "lz_fee_bnb_ack", title: "Ack_Fee_BNB" },
    { id: "status", title: "Status" },
  ],
  append: fs.existsSync(OUTPUT_FILE),
});

async function main() {
  const [signer] = await ethers.getSigners();
  const addrs = JSON.parse(fs.readFileSync("addresses.json"));
  const token = await ethers.getContractAt("BridgeableToken", addrs.tokenSepolia, signer);
  const userWallet = await ethers.getContractAt("UserWallet", addrs.user, signer);
  const bscProvider = new ethers.JsonRpcProvider(process.env.BSC_TESTNET_RPC);
  const sepoliaProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_SEPOLIA_RPC);

  const receiver = new ethers.Contract(addrs.receiver, [
    "event MintSuccess(address indexed user, uint256 amount, uint256 indexed sessionId, bytes32 indexed stationId, uint256 time)",
    "event AckSent(address indexed user, uint256 amount, uint256 indexed sessionId, bytes32 indexed stationId, uint256 fee, uint256 timestamp)"
  ], bscProvider);

  const tokenReadOnly = new ethers.Contract(addrs.tokenSepolia, [
    "event TokensBurned(address indexed player, uint256 tokenAmount)"
  ], sepoliaProvider);

  const metrics = [];

  for (let i = 0; i < NUM_TRANSACTIONS; i++) {
    const tokens = Math.floor(Math.random() * 41) + 10;
    const amtWei = ethers.parseUnits(tokens.toString(), 18);
    const SESSION_ID = Math.floor(Date.now() / 1000);
    const STATION_ID = ethers.encodeBytes32String(`STATION${i + 1}`);
    const startTime = new Date().toISOString();

    console.log(`\n🔁 Tx ${i + 1}/${NUM_TRANSACTIONS} - Approving ${tokens} BRG`);
    try {
     await (await token.approve(addrs.user, amtWei)).wait();
     console.log("✓ Token approved");

      const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "bytes32"],
        [signer.address, amtWei, SESSION_ID, STATION_ID]
      );
      const adapterParams = ethers.solidityPacked(["uint16", "uint256"], [1, GAS_LIMIT_DST]);
      const lzEndpoint = new ethers.Contract(
        await userWallet.lzEndpoint(),
        ["function estimateFees(uint16,address,bytes,bool,bytes) view returns (uint256,uint256)"],
        signer
      );
      const [lzFee] = await lzEndpoint.estimateFees(DST_CHAIN_ID, userWallet.target, payload, false, adapterParams);
      const feePay = lzFee * FEE_BUFFER_X;

      const tx = await userWallet.sendCrossChainToken(
        DST_CHAIN_ID,
        ethers.getBytes(addrs.bscWallet),
        amtWei,
        SESSION_ID,
        STATION_ID,
        { value: feePay, gasLimit: GAS_LIMIT_DST }
      );
      const receipt = await tx.wait();
      const sepBlock = await signer.provider.getBlock(receipt.blockNumber);
      const sepGasCost = receipt.gasUsed * receipt.gasPrice;

      console.log("✓ Tx sent. Monitoring events...");

      let mintTime = 0, burnTime = 0;
      let mintGasCost = "0", ackFee = "0", status = "Failed";

      for (let poll = 0; poll < MAX_POLLS; poll++) {
        console.log(`   Poll ${poll + 1}/${MAX_POLLS}...`);

        const bscFrom = (await bscProvider.getBlockNumber()) - 300;

        // MintSuccess
        const mints = await receiver.queryFilter(receiver.filters.MintSuccess(signer.address, null, SESSION_ID, null), bscFrom);
        if (mints.length > 0 && !mintTime) {
          const mintBlock = await bscProvider.getBlock(mints[0].blockNumber);
          mintTime = mintBlock.timestamp;
          const mintTx = await bscProvider.getTransactionReceipt(mints[0].transactionHash);
          mintGasCost = mintTx.gasUsed * mintTx.gasPrice;
          console.log("✓ MintSuccess found");
        }

        // AckSent
        const acks = await receiver.queryFilter(receiver.filters.AckSent(signer.address, null, SESSION_ID, null), bscFrom);
        if (acks.length > 0) {
          ackFee = ethers.formatEther(acks[0].args.fee);
          console.log("✓ AckSent found");
        }

        // TokensBurned
        const sepFrom = Math.max(sepBlock.number - 20, 0);
        const burns = await tokenReadOnly.queryFilter(tokenReadOnly.filters.TokensBurned(addrs.user, null), sepFrom);
        const burn = burns.find(b => b.blockNumber > sepBlock.number);
        if (burn && !burnTime) {
          const burnBlock = await sepoliaProvider.getBlock(burn.blockNumber);
          burnTime = burnBlock.timestamp;
          console.log("TokensBurned found");
          status = "Success";
        }

        if (mintTime && burnTime) break;
        await new Promise(r => setTimeout(r, POLL_DELAY_MS));
      }

      metrics.push({
        session: SESSION_ID,
        station_id: ethers.decodeBytes32String(STATION_ID),
        start_time: startTime,
        burn_time: burnTime ? new Date(burnTime * 1000).toISOString() : "N/A",
        mint_time: mintTime ? new Date(mintTime * 1000).toISOString() : "N/A",
        mint_latency: mintTime ? mintTime - sepBlock.timestamp : 0,
        full_cycle_latency: burnTime ? burnTime - sepBlock.timestamp : 0,
        sep_gas_eth: ethers.formatEther(sepGasCost),
        bsc_gas_bnb: ethers.formatEther(mintGasCost),
        lz_fee_eth: ethers.formatEther(lzFee),
        ack_fee_bnb: ackFee,
        status
      });

      console.log(`Tx ${i + 1} (${SESSION_ID}) - ${status}`);
    } catch (err) {
      console.error(`Tx ${i + 1} failed: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  await csvWriter.writeRecords(metrics);
  console.log(`\n Data written to ${OUTPUT_FILE}`);
  fs.writeFileSync("cross_chain_metrics_50T.json", JSON.stringify(metrics, null, 2));
  console.log("JSON log written to cross_chain_metrics_50T.json");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});