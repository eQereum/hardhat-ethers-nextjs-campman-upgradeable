// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import './CampaignStates.sol';
import '../Pool.sol';

abstract contract CampaignLogics is CampaignStates {
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
    ) CampaignStates(_owner, _factory, _name, _description, _banner, _minimum, _contributionPeriod, _manager, _campaignAddress) {}

    function _contribute() internal {
        require(block.timestamp < campaignCreationTime + contributionPeriod, 'contribution time is over');

        require(msg.value >= minimumContribution, 'value must be gt minimum contribution');

        if (!isInvestor[msg.sender]) investorsCount++;

        isInvestor[msg.sender] = true;
        contributionPerInvestor[msg.sender] += uint128(msg.value);
        availableBalance += uint128(msg.value);
        totalContribution += uint128(msg.value);

        Token(campaignTokenAddress).mint(msg.sender, uint128(msg.value));
        emit ContributionLog(uint128(msg.value), msg.sender);
    }

    function _createRequest(
        string memory description,
        uint128 value,
        address payable recipient
    ) internal {
        require(block.timestamp > campaignCreationTime + contributionPeriod, 'you have to wait until the contributiom period is over !!!');
        require(bytes(description).length <= 255, 'request description is too big');
        require(value <= availableBalance, 'requested value is more than available balance');

        Request storage newRequest = requests[requestsCount++];

        newRequest.description = description;
        newRequest.value = value;
        newRequest.recipient = recipient;
        newRequest.isComplete = false;
        newRequest.approversCount = 0;
        newRequest.requestCreationTime = block.timestamp;

        availableBalance -= value;
        emit CreateRequestLog(value, description, recipient);
    }

    function _approveRequest(uint16 index) internal {
        Request storage request = requests[index];
        require(!request.isCancel, 'this request has been cancelled');
        require(!request.isComplete, 'this request has been completed');
        require(block.timestamp < request.requestCreationTime + requestApprovalPeriod, 'request approval period is over');
        require(!request.wasApproved[msg.sender], 'this investor has approved the request already');

        request.wasApproved[msg.sender] = true;
        request.approversCount++;
        emit ApproveRequestLog(index, msg.sender);
    }

    function _finalizeRequest(uint16 index) internal {
        Request storage request = requests[index];

        require(!request.isCancel, 'this request has been cancelled');
        require(!request.isComplete, 'this request has been completed already');
        require(request.approversCount > (investorsCount / 2), 'at least 50 percent of investors should approve this request');

        totalRequestValues += request.value;
        request.isComplete = true;
        request.recipient.transfer(request.value);
        emit FinalizeRequestLog(index, request.recipient);
    }

    function _cancelRequest(uint16 index) internal {
        Request storage request = requests[index];

        require(!request.isCancel, 'this request has been cancelled already');
        require(!request.isComplete, 'this request has been completed');
        request.isCancel = true;
        availableBalance += request.value;
        emit CancelRequestLog(index);
    }

    function _getSummary() internal view returns (CampaignSummary memory) {
        CampaignSummary memory summary = CampaignSummary({
            campaignName: campaignName,
            campaignCreationTime: campaignCreationTime,
            contributionPeriod: contributionPeriod,
            requestsCount: requestsCount,
            investorsCount: investorsCount,
            totalContribution: totalContribution,
            availableBalance: availableBalance,
            balance: uint128(address(this).balance),
            manager: manager,
            minimumContribution: minimumContribution,
            isClosed: isClosed,
            isRejectedByOwner: isRejectedByOwner,
            campaignTokenAddress: campaignTokenAddress,
            poolAddress: PoolAddress,
            campaignDescription: campaignDescription,
            bannerIPFS: bannerIPFS
        });

        return summary;
    }

    function _rejectCampaign() internal returns (address poolAddress) {
        isRejectedByOwner = true;
        isClosed = true;
        availableBalance = 0;
        if (totalContribution >= 0.01 ether) {
            PoolAddress = address(new Pool{value: totalContribution}(payable(address(this)), investorsCount));
            emit CreatePoolLog('Pool Created - Succeccfully Rejected', address(this), PoolAddress);
        } else {
            PoolAddress = address(this);
            emit CreatePoolLog('Empty Campaign - Succeccfully Rejected', address(this), PoolAddress);
        }
        poolAddress = PoolAddress;
    }
}
