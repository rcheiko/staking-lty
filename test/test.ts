import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Test", function () {
  async function deployLtyStakingAndToken() {
    const [owner, reserveAddress] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", owner.address);
    console.log("reserveAddress:", reserveAddress.address);

    const lty = await ethers.getContractFactory("ltyToken");
    const ltyToken = await lty.deploy();
    console.log("ltyToken deployed to:", ltyToken.address);

    const staking = await ethers.getContractFactory("ltyStaking");
    const ltyStaking = await staking.deploy(
      reserveAddress.address,
      ltyToken.address,
      1000
    );
    console.log("ltyStaking deployed to:", ltyStaking.address);

    await ltyToken.mint(reserveAddress.address, 1000);
    await ltyToken
      .connect(reserveAddress)
      .approve(ltyStaking.address, ethers.utils.parseUnits("999", 18));

    return { ltyStaking, ltyToken, owner, reserveAddress };
  }

  describe("Basic Testing", function () {
    it("Check if the total is 0 and apy is good", async function () {
      const { ltyStaking } = await loadFixture(deployLtyStakingAndToken);

      const totalStaked = JSON.parse(await ltyStaking.totalStaked());
      expect(totalStaked).to.equal(0);

      const APY = JSON.parse(await ltyStaking.APY());
      expect(APY).to.equal(1000);
    });

    it("Try to Stake / Unstake 1 lty", async function () {
      const { ltyStaking, ltyToken, owner } = await loadFixture(
        deployLtyStakingAndToken
      );

      await ltyToken.approve(
        ltyStaking.address,
        ethers.utils.parseUnits("1000", 18)
      );
      await ltyToken.mint(owner.address, 1000);

      await ltyStaking.stake(ethers.utils.parseUnits("1", 18));

      const bal = JSON.parse(await ltyToken.balanceOf(owner.address));
      expect(bal).to.equal(999 * 10 ** 18);

      const totalStaked = JSON.parse(await ltyStaking.totalStaked());
      expect(totalStaked).to.equal(1 * 10 ** 18);

      await ltyStaking.unstake(ethers.utils.parseUnits("1", 18));
      const bal2 = JSON.parse(await ltyToken.balanceOf(owner.address));
      expect(bal2)
        .to.above(1000 * 10 ** 18)
        .to.below(1001 * 10 ** 18);
    });

    it("Stake 1 LTY wait 1 year and try to withdraw check the reward", async function () {
      const { ltyStaking, ltyToken, owner } = await loadFixture(
        deployLtyStakingAndToken
      );

      await ltyToken.approve(
        ltyStaking.address,
        ethers.utils.parseUnits("1", 18)
      );
      await ltyToken.mint(owner.address, 1);

      const OldBal = JSON.parse(await ltyToken.balanceOf(owner.address));

      await ltyStaking.stake(ethers.utils.parseUnits("1", 18));

      await time.increase(365 * 24 * 60 * 60); // 1 year

      await ltyStaking.unstake(ethers.utils.parseUnits("1", 18));
      const NewBal = JSON.parse(await ltyToken.balanceOf(owner.address));

      expect(NewBal)
        .to.above(OldBal * 2)
        .to.below(OldBal * 2.01);
    });

    it("No money try to stake/unstake/claim", async function () {
      const { ltyStaking } = await loadFixture(deployLtyStakingAndToken);

      await expect(
        ltyStaking.stake(ethers.utils.parseUnits("1", 18))
      ).to.be.revertedWith("You don't have enough LTY");
      await expect(
        ltyStaking.unstake(ethers.utils.parseUnits("1", 18))
      ).to.be.revertedWith("You don't have enough staked LTY");
      await expect(ltyStaking.claim()).to.be.revertedWith(
        "You don't have any staked LTY"
      );
    });

    it("Mint 1 LTY - Pause the contract and try to stake/unstake/claim", async function () {
      const { ltyStaking, ltyToken, owner } = await loadFixture(
        deployLtyStakingAndToken
      );

      await ltyToken.approve(
        ltyStaking.address,
        ethers.utils.parseUnits("1", 18)
      );
      await ltyToken.mint(owner.address, 1);

      await ltyStaking.pause();

      await expect(
        ltyStaking.stake(ethers.utils.parseUnits("1", 18))
      ).to.be.revertedWith("Pausable: paused");
      await expect(
        ltyStaking.unstake(ethers.utils.parseUnits("1", 18))
      ).to.be.revertedWith("Pausable: paused");
      await expect(ltyStaking.claim()).to.be.revertedWith("Pausable: paused");
    });

    it("Mint 1 LTY and try to just claim or unstake without staking", async function () {
      const { ltyStaking, ltyToken, owner } = await loadFixture(
        deployLtyStakingAndToken
      );

      await ltyToken.approve(
        ltyStaking.address,
        ethers.utils.parseUnits("1", 18)
      );
      await ltyToken.mint(owner.address, 1);

      await expect(ltyStaking.claim()).to.be.revertedWith(
        "You don't have any staked LTY"
      );
      await expect(
        ltyStaking.unstake(ethers.utils.parseUnits("1", 18))
      ).to.be.revertedWith("You don't have enough staked LTY");
    });

    it("Mint 1 LTY and try to unstake more than staked", async function () {
      const { ltyStaking, ltyToken, owner } = await loadFixture(
        deployLtyStakingAndToken
      );

      await ltyToken.approve(
        ltyStaking.address,
        ethers.utils.parseUnits("1", 18)
      );
      await ltyToken.mint(owner.address, 1);

      await ltyStaking.stake(ethers.utils.parseUnits("1", 18));

      await expect(
        ltyStaking.unstake(ethers.utils.parseUnits("2", 18))
      ).to.be.revertedWith("You don't have enough staked LTY");
    });

    it("Mint 10 LTY wait 1 year unstake 10 LTY and wait another 1 year check the reward", async function () {
      const { ltyStaking, ltyToken, owner } = await loadFixture(
        deployLtyStakingAndToken
      );

      await ltyToken.approve(
        ltyStaking.address,
        ethers.utils.parseUnits("10", 18)
      );
      await ltyToken.mint(owner.address, 10);

      await ltyStaking.stake(ethers.utils.parseUnits("10", 18));

      await time.increase(365 * 24 * 60 * 60); // 1 year

      let reward = await ltyStaking.rewardByUser(owner.address);
      expect(JSON.parse(reward)).to.equal(10 * 10 ** 18);

      await ltyStaking.unstake(ethers.utils.parseUnits("9", 18));
      expect(JSON.parse(await ltyStaking.staked(owner.address))).to.equal(
        1 * 10 ** 18
      );

      await time.increase(365 * 24 * 60 * 60); // 1 year

      reward = await ltyStaking.rewardByUser(owner.address);
      expect(JSON.parse(reward)).to.equal(1 * 10 ** 18);

      await ltyStaking.unstake(ethers.utils.parseUnits("1", 18));
      expect(JSON.parse(await ltyStaking.staked(owner.address))).to.equal(0);

      expect(JSON.parse(await ltyToken.balanceOf(owner.address)))
        .to.above(21 * 10 ** 18)
        .to.below(21.1 * 10 ** 18);
    });

    it("Mint 1000 LTY wait 1 year unstake 1000 LTY and check if the reward it will be reverted", async function () {
      const { ltyStaking, ltyToken, owner, reserveAddress } = await loadFixture(
        deployLtyStakingAndToken
      );

      await ltyToken.approve(
        ltyStaking.address,
        ethers.utils.parseUnits("1000", 18)
      );
      await ltyToken.mint(owner.address, 1000);

      await ltyStaking.stake(ethers.utils.parseUnits("1000", 18));

      expect(await ltyStaking.userStaked(0)).to.equal(
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      );

      await time.increase(365 * 24 * 60 * 60); // 1 year

      await expect(
        ltyStaking.unstake(ethers.utils.parseUnits("1000", 18))
      ).to.be.revertedWith("ERC20: insufficient allowance");

      await ltyToken
        .connect(reserveAddress)
        .approve(ltyStaking.address, ethers.utils.parseUnits("1001", 18));

      await expect(
        ltyStaking.unstake(ethers.utils.parseUnits("1000", 18))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      await ltyToken.mint(reserveAddress.address, 1);

      await ltyStaking.unstake(ethers.utils.parseUnits("1000", 18));

      expect(await ltyStaking.staked(owner.address)).to.equal(0);
      expect(await ltyToken.balanceOf(owner.address))
        .to.above(2000n * 10n ** 18n)
        .to.below(2001n * 10n ** 18n);
    });

    it("Mint and stake 10 LTY wait 1 year setAPY to 1000, unstake 10 LTY", async function () {
      const { ltyStaking, ltyToken, owner } = await loadFixture(
        deployLtyStakingAndToken
      );

      await ltyToken.approve(
        ltyStaking.address,
        ethers.utils.parseUnits("10", 18)
      );
      await ltyToken.mint(owner.address, 10);
      await ltyStaking.stake(ethers.utils.parseUnits("10", 18));

      await time.increase(365 * 24 * 60 * 60); // 1 year
      await ltyStaking.setAPY(1000);

      expect(await ltyStaking.staked(owner.address))
        .to.above(20n * 10n ** 18n)
        .to.below(21n * 10n ** 18n);

      expect(await ltyStaking.userStaked(0)).to.equal(
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
      );

      await ltyStaking.unstake(await ltyStaking.staked(owner.address));

      expect(await ltyToken.balanceOf(owner.address))
        .to.above(20n * 10n ** 18n)
        .to.below(21n * 10n ** 18n);

      expect(await ltyStaking.staked(owner.address)).to.equal(0);
    });

    it("Mint and stake 10 LTY wait 1 year, claim and withdraw my 10 LTY", async function () {
      const { ltyStaking, ltyToken, owner } = await loadFixture(
        deployLtyStakingAndToken
      );

      await ltyToken.approve(
        ltyStaking.address,
        ethers.utils.parseUnits("10", 18)
      );
      await ltyToken.mint(owner.address, 10);
      await ltyStaking.stake(ethers.utils.parseUnits("10", 18));

      await time.increase(300 * 24 * 60 * 60); // 300 days
      await ltyStaking.claim();

      expect(await ltyToken.balanceOf(owner.address))
        .to.above(8n * 10n ** 18n)
        .to.below(9n * 10n ** 18n);

      expect(await ltyStaking.staked(owner.address)).to.equal(10n * 10n ** 18n);

      expect(await ltyStaking.totalStaked()).to.equal(10n * 10n ** 18n);

      expect(await ltyStaking.rewardByUser(owner.address)).to.equal(0);

      await ltyStaking.unstake(await ltyStaking.staked(owner.address));

      expect(await ltyStaking.staked(owner.address)).to.equal(0);
      expect(await ltyStaking.totalStaked()).to.equal(0);
      expect(await ltyStaking.rewardByUser(owner.address)).to.equal(0);
      expect(await ltyToken.balanceOf(owner.address))
        .to.above(18n * 10n ** 18n)
        .to.below(19n * 10n ** 18n);
    });
  });
});
