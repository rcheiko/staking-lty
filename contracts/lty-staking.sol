// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract stakingLTY is Ownable {
    address private reserve; // the reserve address
    IERC20 private immutable lty; // the lty token

    mapping(address => uint256) private staked; // how much the user staked
    mapping(address => uint256) public timeStaked; // when the user staked

    uint256 public totalStaked; // the total staked

    uint public APY; // APY based on the total staked with 3 decimals (ex: 100 = 0.1 = 10%)

    constructor(address _reserve, address _lty, uint _APY) {
        reserve = _reserve;
        lty = IERC20(_lty);
        APY = _APY;
    }

    /*
     * @dev function to set the APY with 3 decimals (ex: 100 = 0.1 = 10%)
     * @param _APY the APY
     */
    function setAPY(uint _APY) external onlyOwner {
        APY = _APY;
    }

    /*
     * @dev function to stake the tokens
     * @param _amount the amount of tokens to stake
     */
    function stake(uint256 _amount) external {
        require(_amount > 0, "You must stake more than 0");
        require(
            lty.balanceOf(msg.sender) >= _amount,
            "You don't have enough LTY"
        );
        require(
            lty.allowance(msg.sender, address(this)) >= _amount,
            "You must approve the contract to spend your LTY"
        );

        // add function who check if he has already staked tokens and add the reward to the new amount

        lty.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        timeStaked[msg.sender] = block.timestamp;
        totalStaked += _amount;
    }

    /*
     * @dev function to unstake the tokens and get the reward
     */
    function unstake(uint256 _amount) external {
        require(
            staked[msg.sender] >= _amount,
            "You don't have enough staked LTY"
        );
        claim();

        uint256 reward = rewardByUser(msg.sender);

        timeStaked[msg.sender] = block.timestamp;
        staked[msg.sender] -= _amount;

        totalStaked -= _amount;

        lty.transfer(msg.sender, _amount);
    }

    function claim() public {
        require(staked[msg.sender] > 0, "You don't have any staked LTY");
        require(
            timeStaked[msg.sender] < block.timestamp,
            "You can't claim yet"
        );

        uint256 reward = rewardByUser(msg.sender);

        timeStaked[msg.sender] = block.timestamp;
        staked[msg.sender] -= reward;
        totalStaked -= reward;

        lty.transferFrom(reserve, msg.sender, reward);
    }

    /*
     * @dev function to calculate the reward
     * @param _user the user address
     * @return the reward of the user in LTY
     */
    function rewardByUser(address _user) public view returns (uint256) {
        uint256 _amountStaked = staked[_user];
        uint256 _timeStaked = timeStaked[_user];
        uint256 timeDiff = block.timestamp - _timeStaked;
        uint256 rewardInterval = 365 days;
        return
            ((_amountStaked * APY) / (10 ** 3)) * (timeDiff / rewardInterval);
    }
}
