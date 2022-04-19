const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

describe('Campaign Factory Contract -----------------------------------------------------', () => {
  let owner, manager1, manager2, investor1, investor2, attacker1, attacker2, another, hardhatCampiagnFactory, deployedAddress2, deployedAddress3, campaignAddress;
  const provider = ethers.provider;

  //  Upgradeable Initialization
  before(async () => {
    [owner, manager1, manager2, investor1, investor2, attacker1, attacker2, another] = await ethers.getSigners();
    const implementation = await ethers.getContractFactory('Factory');
    hardhatCampiagnFactory = await upgrades.deployProxy(implementation, {
      initializer: 'initialize',
    });
    campaignAddress = hardhatCampiagnFactory.address;
  });

  //  Simple Initialization
  //   before(async () => {
  //     [owner, manager1, manager2, investor1, investor2, attacker1, attacker2, another] = await ethers.getSigners();
  //     const CampiagnFactory = await ethers.getContractFactory('Factory');
  //     hardhatCampiagnFactory = await CampiagnFactory.deploy();
  //     await hardhatCampiagnFactory.connect(owner).initialize({ gasLimit: 50000 });
  //   });

  describe('initialize() after deploy proxy', () => {
    it('should pass equality of owner getter function of contract and owner account of test', async () => {
      expect((await hardhatCampiagnFactory.factoryStatus()).owner).to.equal(await owner.getAddress());
    });

    it('should revert because its already initialized', async () => {
      await expect(hardhatCampiagnFactory.connect(attacker1).initialize()).to.be.revertedWith('Initializable: contract is already initialized');
      await expect(hardhatCampiagnFactory.connect(owner).initialize()).to.be.revertedWith('Initializable: contract is already initialized');
    });
  });

  describe('Pause()', () => {
    it('should revert when called by other accounts than owner', async () => {
      await expect(hardhatCampiagnFactory.connect(attacker1).Pause({ gasLimit: 50000 })).to.be.revertedWith('only owner can do this task');
    });

    it('should pass Pause by owner', async () => {
      await expect(hardhatCampiagnFactory.connect(owner).Pause({ gasLimit: 50000 }))
        .to.emit(hardhatCampiagnFactory, 'Paused')
        .withArgs();
    });

    it('should revert because factory is already paused', async () => {
      await expect(hardhatCampiagnFactory.connect(owner).Pause({ gasLimit: 50000 })).to.be.revertedWith('Factory is already Paused');
    });
  });

  describe('unPause()', () => {
    it('revert when called by other accounts than owner', async () => {
      await expect(hardhatCampiagnFactory.connect(attacker1).unPause({ gasLimit: 50000 })).to.be.revertedWith('only owner can do this task');
    });

    it('should pass called by owner', async () => {
      await expect(hardhatCampiagnFactory.connect(owner).unPause({ gasLimit: 50000 }))
        .to.emit(hardhatCampiagnFactory, 'unPaused')
        .withArgs();
    });

    it('should revert because factory is already not paused', async () => {
      await expect(hardhatCampiagnFactory.connect(owner).unPause({ gasLimit: 50000 })).to.be.revertedWith('Factory is already not Paused');
    });
  });

  describe('setTax(uint64)', () => {
    const newTax = ethers.utils.parseEther('0.02');
    it('should revert when called by other accounts than owner', async () => {
      await expect(hardhatCampiagnFactory.connect(attacker1).setTax(newTax, { gasLimit: 50000 })).to.be.revertedWith('only owner can do this task');
    });

    it('should pass when called by owner', async () => {
      await expect(hardhatCampiagnFactory.connect(owner).setTax(newTax, { gasLimit: 50000 }))
        .to.emit(hardhatCampiagnFactory, 'SetTax')
        .withArgs(newTax);
    });
  });

  describe('authorize(address)', () => {
    it('revert when called by other accounts than owner', async () => {
      await expect(hardhatCampiagnFactory.connect(attacker1).authorize(await attacker2.getAddress(), { gasLimit: 50000 })).to.be.revertedWith('only owner can do this task');
    });

    it('should pass called by owner', async () => {
      await expect(hardhatCampiagnFactory.connect(owner).authorize(await manager1.getAddress(), { gasLimit: 60000 }))
        .to.emit(hardhatCampiagnFactory, 'Authorized')
        .withArgs(await manager1.getAddress());
    });
  });

  describe('blacklist()', () => {
    it('revert when called by other accounts than owner', async () => {
      await expect(hardhatCampiagnFactory.connect(attacker1).blacklist(await attacker2.getAddress(), { gasLimit: 50000 })).to.be.revertedWith('only owner can do this task');
    });

    it('should pass called by owner', async () => {
      await expect(hardhatCampiagnFactory.connect(owner).blacklist(await attacker2.getAddress(), { gasLimit: 60000 }))
        .to.emit(hardhatCampiagnFactory, 'Blacklisted')
        .withArgs(await attacker2.getAddress());
    });
  });

  describe('createCampaign(string,string,string,uint256,uint256)', () => {
    let min, tax, deployedAddress, deployedAddressToken;
    before(async () => {
      min = ethers.utils.parseEther('0.01');
      tax = ethers.utils.parseEther('0.02');
      period = 2000;
    });

    it('should revert campaign creation by attacker1 because he is not authorized', async () => {
      await expect(
        hardhatCampiagnFactory.connect(attacker1).createCampaign(ethers.utils.formatBytes32String('campA1'), 'descA1', 'ipfsA1', min, period, { value: tax, gasLimit: 200000 })
      ).to.be.revertedWith('!Authorized');
    });

    it('should revert campaign creation by attacker2 because he is blacklisted', async () => {
      await hardhatCampiagnFactory.connect(owner).authorize(await attacker2.getAddress()); 
      await expect(
        hardhatCampiagnFactory.connect(attacker2).createCampaign(ethers.utils.formatBytes32String('campA1'), 'descA1', 'ipfsA1', min, period, { value: tax, gasLimit: 200000 })
      ).to.be.revertedWith('Blacklisted');
    });

    it('should revert because of tax', async () => {
      await expect(
        hardhatCampiagnFactory.connect(manager1).createCampaign(ethers.utils.formatBytes32String('campM11'), 'descM11', 'ipfsM11', min, period, { value: 0, gasLimit: 30000000 })
      ).to.be.revertedWith('!Tax');
    });

    it('should revert because of description length', async () => {
      const desc = Array(257).fill(0).toString().replaceAll(',', '');
      await expect(
        hardhatCampiagnFactory.connect(manager1).createCampaign(ethers.utils.formatBytes32String('campM11'), desc, 'ipfsM11', min, period, { value: tax, gasLimit: 30000000 })
      ).to.be.revertedWith('Campaign Description is too Big');
    });

    it('should pass campaign creation by manager1', async () => {
      const createCampaignTx = await hardhatCampiagnFactory
        .connect(manager1)
        .createCampaign(ethers.utils.formatBytes32String('campM11'), 'descM11', 'ipfsM11', min, period, { value: tax, gasLimit: 30000000 });
      const receipt = await createCampaignTx.wait();
      deployedAddress = receipt.events[0].args.createdCampaignAddress;
      deployedAddressToken = receipt.events[0].args.createdCampaignTokenAddress;
      expect(receipt.events[0].args.result).to.be.equal('successfully created');
      expect((await hardhatCampiagnFactory.connect(owner).campaignStatus(deployedAddress)).campaignTokenAddress).to.be.equal(deployedAddressToken);
    });
  });

  describe('getCampaigns()', () => {
    before(async () => {
      await hardhatCampiagnFactory.authorize(await manager2.getAddress());

      min = ethers.utils.parseEther('0.01');
      tax = ethers.utils.parseEther('0.02');
      period = 2000;

      const [deployTransaction2, deployTransaction3] = await Promise.all([
        hardhatCampiagnFactory.connect(manager1).createCampaign(ethers.utils.formatBytes32String('campM12'), 'descM12', 'ipfsM12', min, period, { value: tax, gasLimit: 30000000 }),
        hardhatCampiagnFactory.connect(manager2).createCampaign(ethers.utils.formatBytes32String('campM21'), 'descM21', 'ipfsM21', min, period, { value: tax, gasLimit: 30000000 }),
      ]);

      const [receipt2, receipt3] = await Promise.all([deployTransaction2.wait(), deployTransaction3.wait()]);
      [deployedAddress2, deployedAddress3] = [receipt2.events[0].args.createdCampaignAddress, receipt3.events[0].args.createdCampaignAddress];
    });

    it('should return deployed campaigns addresses', async () => {
      const deployedAddresses = await hardhatCampiagnFactory.connect(another).getCampaigns();
      expect(deployedAddresses.length).to.be.equal(3);
      expect(deployedAddress2).to.be.equal(deployedAddresses[1]);
      expect(deployedAddress3).to.be.equal(deployedAddresses[2]);
    });
  });

  describe('rejectCampaign(address)', () => {
    it('should return rejected campaign succesfully', async () => {
      const rejectTx = await hardhatCampiagnFactory.connect(owner).rejectCampaign(deployedAddress2, { gasLimit: 3000000 });
      const receipt = await rejectTx.wait();
      expect(receipt.events[1].args.rejectedAddress).to.be.equal(deployedAddress2);
    });

    it('should revert when campaign was rejected before ', async () => {
      await expect(hardhatCampiagnFactory.connect(owner).rejectCampaign(deployedAddress2, { gasLimit: 3000000 })).to.be.revertedWith('this campaign is already rejected');
    });
  });

  describe('withdrawTaxFees()', () => {
    it('should transfer fees for deploying 3 campaigns (0.06 = 3*0.02 ETH) to owner address', async () => {
      ownerBalanceBefore = ethers.utils.formatEther(await provider.getBalance(owner.getAddress()));
      await hardhatCampiagnFactory.connect(owner).withdrawTaxFees();
      ownerBalanceAfter = ethers.utils.formatEther(await provider.getBalance(owner.getAddress()));
      const roundedDiffernce = Math.round((ownerBalanceAfter - ownerBalanceBefore) * 100) / 100;
      expect(roundedDiffernce).to.be.equal(0.06); 
    });
  });

  describe('fallback()', () => {
    it('should receive the incoming ether containing data', async () => {
      balanceBefore = ethers.utils.formatEther(await provider.getBalance(campaignAddress));
      const tx = await owner.sendTransaction({
        from: owner.getAddress(),
        to: campaignAddress,
        value: ethers.utils.parseEther('0.1'),
        data: '0x307868616D6564',
        gasPrice: provider.getGasPrice(),
        gasLimit: 30000,
        nonce: provider.getTransactionCount(owner.getAddress(), 'latest'),
      });
      const receipt = await tx.wait();
      balanceAfter = ethers.utils.formatEther(await provider.getBalance(campaignAddress));
      expect(Math.round((balanceAfter - balanceBefore) * 100) / 100).to.be.equal(0.1);
    });
  });

  describe('receive()', () => {
    it('should receive the incoming ether', async () => {
      balanceBefore = ethers.utils.formatEther(await provider.getBalance(campaignAddress));
      const tx = await owner.sendTransaction({
        from: owner.getAddress(),
        to: campaignAddress,
        value: ethers.utils.parseEther('0.1'),
        gasPrice: provider.getGasPrice(),
        gasLimit: 30000,
        nonce: provider.getTransactionCount(owner.getAddress(), 'latest'),
      });
      const receipt = await tx.wait();
      balanceAfter = ethers.utils.formatEther(await provider.getBalance(campaignAddress));
      expect(Math.round((balanceAfter - balanceBefore) * 100) / 100).to.be.equal(0.1);
    });
  });
});
