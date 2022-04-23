// SPDX-License-Identifier: MIT

import './IFactoryV2.sol';
import '../Campaign/Campaign.sol';

pragma solidity ^0.8.13;

abstract contract FactoryStatesV2 is IFactoryV2 {
    address[] public Campaigns;
    FactoryStatus public factoryStatus;
    mapping(address => CampaignStatus) public campaignStatus;
    mapping(address => ManagerStatus) public managerStatus;
    bool public upgradedVersion;
}
