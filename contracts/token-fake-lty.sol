// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract lty is ERC20, Ownable {

    constructor() ERC20("lty", "LTY") {}

    function mint(address _to, uint _amount) external {
        _mint(_to, _amount * 10 ** 18);
    }

    function withdraw(uint _amount) external {
        _burn(msg.sender, _amount * 10 ** 18);
    }
}
