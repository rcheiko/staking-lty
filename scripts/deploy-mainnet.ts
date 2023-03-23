import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
console.log("Deploying contracts with the account:", deployer.address);

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Staking = await ethers.getContractFactory("ltyStaking");
  const staking = await Staking.deploy('0x3f323fDd90e1ede388A8472785Fb67e70eA25b02', '0x0cBE5C4F318035b866AAcFaf7D018FB4C5F920F3', 200);
  console.log("Staking address:", staking.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

