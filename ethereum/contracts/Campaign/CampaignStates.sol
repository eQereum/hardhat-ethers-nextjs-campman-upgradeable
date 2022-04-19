// SPDX-License-Identifier: MIT
import '../Token.sol';
import './ICampaign.sol';

pragma solidity ^0.8.13;

abstract contract CampaignStates is ICampaign {
    address payable public immutable owner;
    address payable public immutable factory;
    address public immutable manager;
    uint64 public immutable minimumContribution;
    uint32 public immutable campaignCreationTime;
    uint32 public immutable contributionPeriod;
    address payable public immutable campaignTokenAddress;
    uint32 public constant requestApprovalPeriod = 2592000;
    bytes32 public immutable campaignName;
    string public bannerIPFS;
    string public campaignDescription;
    mapping(address => bool) public isInvestor;
    uint128 public totalContribution;
    uint128 public totalRequestValues;
    uint128 public availableBalance;
    uint16 public investorsCount;
    uint16 public requestsCount;
    bool public isRejectedByOwner;
    bool public isClosed;
    bool internal locked;
    address public PoolAddress;
    mapping(address => uint128) public contributionPerInvestor;
    mapping(uint16 => Request) public requests;

    constructor(
        address payable _owner,
        address payable _factory,
        bytes32 _name,
        string memory _description,
        string memory _banner,
        uint64 _minimum,
        uint32 _contributionPeriod,
        address _manager,
        address _campaignAddress
    ) {
        campaignName = _name;
        campaignDescription = _description;
        bannerIPFS = _banner;
        manager = _manager;
        minimumContribution = _minimum;
        contributionPeriod = _contributionPeriod;
        campaignCreationTime = uint32(block.timestamp);
        owner = _owner;
        factory = _factory;
        Token token = new Token('CampToken', 'CT', payable(_campaignAddress), manager);
        campaignTokenAddress = payable(address(token));
    }
}
