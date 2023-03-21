import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Token = await ethers.getContractFactory("ltyToken"); //Replace with name of your smart contract
  const token = await Token.deploy();
  console.log("Token address:", token.address);

  const Staking = await ethers.getContractFactory("ltyStaking"); //Replace with name of your smart contract
  const staking = await Staking.deploy(deployer.address, token.address, 1000);
  console.log("Staking address:", staking.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

