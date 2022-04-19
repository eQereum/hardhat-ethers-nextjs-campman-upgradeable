// or
const { ethers, upgrades } = require('hardhat');
const path = require('path');
const fs = require('fs-extra');

// ----------------------------------------------------- config -----------------------------------------------------
const projectName = 'Factory';
const projectVersion = '1.0';
const contractName = 'Factory'; // example: ContractA for `contract ContractA {}`
const sourceFilename = 'Factory'; // example: "source" for source.sol
const networkName = 'maticMumbai'; //example: "rinkeby"
const pathSource = `./artifacts/contracts/Factory/Factory.sol/Factory.json`;
// `npx hardhat run scripts/deploy_Factory_v1.js --network ${networkName}`;
// ------------------------------------------------------------------------------------------------------------------

const main = async () => {
  const [deployer] = await ethers.getSigners();

  const implementation = await ethers.getContractFactory(contractName);
  console.log(`Deploying Implementation ${projectName} ...`);
  const proxy = await upgrades.deployProxy(implementation, {
    initializer: 'initialize',
  });
  console.log(`Proxy version ${projectVersion} deployed to:`, proxy.address);

  const proxyContractAddress = JSON.parse(JSON.stringify(proxy.address));
  const owner = JSON.parse(JSON.stringify(proxy.deployTransaction.from));
  const networkId = JSON.parse(JSON.stringify(proxy.deployTransaction.chainId));
  const deployProxyTrancationHash = JSON.parse(JSON.stringify(proxy.deployTransaction.hash));

  makeOutputSummary(pathSource, proxyContractAddress, owner, networkId, deployProxyTrancationHash);
};

const makeOutputSummary = (pathSource, proxyContractAddress, owner, networkId, deployProxyTrancationHash) => {
  let readableSource = fs.readFileSync(pathSource, 'utf8');
  readableSource = JSON.parse(readableSource);

  const buildPath = path.resolve(__dirname, '../../client/src/contracts');
  // fs.removeSync(buildPath);
  fs.ensureDirSync(buildPath);

  var input = {
    language: 'Solidity',
    contractName: `Proxy_${projectName}v${projectVersion}`,
    projectVersion: projectVersion,
    proxyContractAddress: proxyContractAddress,
    onwer: owner,
    networkName: networkName,
    networkId: networkId,
    fullBytecodeSizeKB: (readableSource.bytecode.length - 2) / 2000,
    deployedBytecodeSizeKB: (readableSource.deployedBytecode.length - 2) / 2000,
    deployProxyTrancationHash: deployProxyTrancationHash,
    abi: readableSource.abi,
    bytecode: readableSource.bytecode,
    sourcePath: readableSource.sourceName,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };

  let output = JSON.parse(JSON.stringify(input));
  const jsonOutput = fs.outputJsonSync(path.resolve(buildPath, `${projectName}-${networkName}.json`), output);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
