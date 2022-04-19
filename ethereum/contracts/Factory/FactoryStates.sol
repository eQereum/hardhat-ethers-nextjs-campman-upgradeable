// SPDX-License-Identifier: MIT

import './IFactory.sol';
import '../Campaign/Campaign.sol';

pragma solidity ^0.8.13;

abstract contract FactoryStates is IFactory {
    address[] public Campaigns;
    FactoryStatus public factoryStatus;
    mapping(address => CampaignStatus) public campaignStatus;
    mapping(address => ManagerStatus) public managerStatus;
}
