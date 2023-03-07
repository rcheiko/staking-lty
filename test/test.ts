import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Test 1", function () {
  async function deployLtyStakingAndToken() {
    
    const [owner, reserveAddress] = await ethers.getSigners();

    const lty = await ethers.getContractFactory("ltyToken");
    const ltyToken = await lty.deploy();
    console.log("ltyToken deployed to:", ltyToken.address);

    const staking = await ethers.getContractFactory("stakingLTY");
    const ltyStaking = await staking.deploy(
      reserveAddress.address,
      ltyToken.address,
      1000
    );
    console.log("ltyStaking deployed to:", ltyStaking.address);

    await ltyToken.mint(reserveAddress.address, 1000);
    await ltyToken.connect(reserveAddress).approve(ltyStaking.address, ethers.utils.parseUnits("1000", 18));

    return { ltyStaking, ltyToken, owner, reserveAddress };
  }

  describe("Basic Testing", function () {
    it("Check if the total is 0 and apy is good", async function () {
      const { ltyStaking, ltyToken, owner, reserveAddress } = await loadFixture(deployLtyStakingAndToken);

      const totalStaked = JSON.parse(await ltyStaking.totalStaked());
      expect(totalStaked).to.equal(0);
      
      const APY = JSON.parse(await ltyStaking.APY());
      expect(APY).to.equal(1000);
    });

    it("Try to deposit 1 lty", async function () {
      const { ltyStaking, ltyToken, owner } = await loadFixture(deployLtyStakingAndToken);

      await ltyToken.approve(ltyStaking.address, ethers.utils.parseUnits("1000", 18));
      await ltyToken.mint(owner.address, 1000);
  
      await ltyStaking.stake(ethers.utils.parseUnits("1", 18));
      
      const bal = JSON.parse(await ltyToken.balanceOf(owner.address));
      console.log("bal", bal);

      const totalStaked = JSON.parse(await ltyStaking.totalStaked());
      expect(totalStaked).to.equal(1 * 10 ** 18);
      expect(bal).to.equal(999 * 10 ** 18);
    })
  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
