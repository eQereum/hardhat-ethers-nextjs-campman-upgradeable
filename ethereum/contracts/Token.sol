// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Token is ERC20 {
    address public immutable manager;
    address payable public campaignAddress;
    bool internal locked;

    constructor(
        string memory _name,
        string memory _symbol,
        address payable _campaignAddress,
        address _manager
    ) ERC20(_name, _symbol) {
        manager = _manager;
        campaignAddress = _campaignAddress;
    }

    modifier noReentrant() {
        require(!locked, 'No re-entrancy');
        locked = true;
        _;
        locked = false;
    }

    function mint(address caller, uint128 contributionAmount) external noReentrant {
        require(msg.sender == campaignAddress, 'only campaign can mint tokens');
        _mint(caller, uint256(contributionAmount * 100));
    }
}
