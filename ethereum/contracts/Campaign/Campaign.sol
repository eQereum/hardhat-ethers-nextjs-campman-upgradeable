// SPDX-License-Identifier: MIT
import './CampaignLogics.sol';
import './CampaignModifiers.sol';

pragma solidity ^0.8.13;

contract Campaign is CampaignModifiers, CampaignLogics {
    constructor(
        address payable _owner,
        address payable _factory,
        bytes32 _name,
        string memory _description,
        string memory _banner,
        uint64 _minimum,
        uint32 _contributionPeriod,
        address _manager
    ) CampaignLogics(_owner, _factory, _name, _description, _banner, _minimum, _contributionPeriod, _manager, address(this)) {}

    fallback() external payable {
        require(msg.value > 0.001 ether, 'poof');
        owner.transfer(msg.value);
    }

    receive() external payable {
        require(msg.value > 0.001 ether, 'poof');
        owner.transfer(msg.value);
    }

    function contribute() public payable override notClosed {
        _contribute();
    }

    function createRequest(
        string memory description,
        uint128 value,
        address payable recipient
    ) public notClosed onlyManager {
        _createRequest(description, value, recipient);
    }

    function approveRequest(uint16 index) public override notClosed onlyInvestor {
        _approveRequest(index);
    }

    function finalizeRequest(uint16 index) public override notClosed onlyManager noReentrant {
        _finalizeRequest(index);
    }

    function cancelRequest(uint16 index) public override notClosed onlyManager {
        _cancelRequest(index);
    }

    function getSummary() external view override returns (CampaignSummary memory) {
        return _getSummary();
    }

    function rejectCampaign() external override onlyOwnerFactory noReentrant returns (address poolAddress) {
        return _rejectCampaign();
    }
}
