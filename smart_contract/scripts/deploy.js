// Temos duas opcoes para correr o deploy:
// 1. Fazendo require do Hardhat Runtime Environment (hre) podemos correr a script fazendo: `node <script>`.
// 2. Também podemos correr a script com: `npx hardhat run <script>` 
//    - o hardhat compila os contratos e executa a script

const hre = require("hardhat");

async function main() {

  const Transactions = await hre.ethers.getContractFactory("Transactions");
  const transactions = await Transactions.deploy();

  await transactions.deployed();

  console.log("Transactions deployed to: ", transactions.address);
}


const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

runMain();
