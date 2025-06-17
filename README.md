# Blockchain Interoperability: Seamless Transactions Across Multiple Blockchain Networks

This project implements a LayerZero-based cross-chain payment system enabling seamless and secure transactions between Ethereum and Binance Smart Chain (BSC). It simulates an electric vehicle (EV) charging use case to demonstrate the practical applications of blockchain interoperability.

---

## 📁 Project Structure

- `contracts/` – Solidity smart contracts for cross-chain messaging
- `scripts/` – Deployment and testing scripts (Python/JS)
- `README.md` – Project overview and instructions
- `Evaluation/` - Log files of the transactions

---

## 🚀 Features

- Cross-chain messaging between Ethereum Sepolia and BSC testnet
- Uses LayerZero protocol
- Simulates EV charging payments using smart contracts

---

## 🛠️ Installation

### Prerequisites:
- Node.js & npm
- Hardhat
- Python 3.x (for analysis scripts)
- Metamask 
- Testnet ETH/BNB RPCs

```bash
git clone https://github.com/your-username/blockchain-interoperability
cd blockchain-interoperability
npm install
```

---

## 📦 Deployment

1. Compile contracts:
   ```bash
   npx hardhat compile
   ```

2. Deploy token to Ethereum Sepolia:
   ```bash
   npx hardhat run scripts/deployTokenSepolia.js --network sepolia
   ```

3. Deploy token to BSC testnet:
   ```bash
   npx hardhat run scripts/deployTokenBSC.js --network bsctestnet
   ```

4. Deploy UserWallet to Ethereum Sepolia:
   ```bash
   npx hardhat run scripts/deployUserWallet.js --network sepolia
   ```

5. Deploy EVCharger to BSC testnet:
   ```bash
   npx hardhat run scripts/deployEVCharger.js --network bsctestnet
   ```

6. Transfer Token Ownership to Bridge Contract on Sepolia:
   ```bash
   npx hardhat run scripts/grantBridgeRoleSepolia.js --network sepolia
   ```

7. Transfer Token Ownership to Bridge Contract on BSC:
   ```bash
   npx hardhat run scripts/grantBridgeRoleBSC.js --network bsctestnet
   ```

8. Set Trusted Remote on Sepolia:
   ```bash
   npx hardhat run scripts/setTrustedRemoteSepolia.js --network sepolia
   ```

9. Set Trusted Remote on BSC:
   ```bash
   npx hardhat run scripts/setTrustedRemoteBSC.js --network bsctestnet
   ```

10. Fund EvCharger on BSC:
   ```bash
   npx hardhat run scripts/fundReceiverBSC.js --network bsctestnet
   ```

10. Send Cross chain Tokens:
   ```bash
   npx hardhat run scripts/crossChainMultipleTx.js --network sepolia
   ```

---

## 📦 Deployment (Optional if needed)

1. Verify Trusted Remote on Sepolia:
   ```bash
   npx hardhat run scripts/verifyTrustedRemoteSepolia.js --network sepolia
   ```

2. Verify Trusted Remote on BSC:
   ```bash
   npx hardhat run scripts/verifyTrustedRemoteBSC.js --network bsctestnet
   ```

3. check balance on sender chain (Sepolia):
  ```bash
  npx hardhat run scripts/checkBalanceSepolia.js --network sepolia
  ```

4. Check balance on receiver chain (BSC):
  ```bash
  npx hardhat run scripts/checkBalanceBSC.js --network bsctestnet
  ```

5. check bridge role on sender chain (Sepolia):
  ```bash
  npx hardhat run scripts/checkBridgeRoleSepolia.js --network sepolia
  ```

6. Check bridge role on receiver chain (BSC):
  ```bash
  npx hardhat run scripts/checkBridgeRoleBSC.js --network bsctestnet
  ```


## 📊 Evaluation

- Metrics collected: transaction latency, gas cost, success rate
- See `/evaluation/results.csv` and `/evaluation/graphs/` for analysis

---

## 📚 References

- [LayerZero Docs](https://docs.layerzero.network)
- Thesis Report: *Blockchain Interoperability* (Stockholm University)
---

## 📄 License

This project is part of an academic thesis and is for educational use only.
