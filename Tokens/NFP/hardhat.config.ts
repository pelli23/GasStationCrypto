import { task, HardhatUserConfig } from 'hardhat/config';

import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-deploy-ethers';
import 'hardhat-deploy';
import '@typechain/ethers-v5';
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import 'solidity-coverage';
import 'hardhat-abi-exporter';

import * as dotenv from 'dotenv';
dotenv.config();

const privateKey = process.env['PRIVATE_KEY'] || '';
const rpcRinkebyAddress = process.env['RINKEBY_RPC_ADDRESS'] || '';
const scanRinkebyApiKey = process.env['RINKEBY_ETHERSCAN_API_KEY'] || '';
const rpcAddress = process.env['ETHEREUM_RPC_ADDRESS'] || '';
const scanApiKey = process.env['ETHERSCAN_API_KEY'] || '';

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  namedAccounts: {
    deployer: {
      default: 0,
    },
    scheduler: {
      default: 1,
    },
  },
  gasReporter: {
    currency: 'ETH',
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 4,
      forking: {
        url: rpcRinkebyAddress,
        blockNumber: 9248411,
      },
    },
    localhost: {
      url: 'http://127.0.0.1:7545',
      accounts: [privateKey],
    },
    rinkeby: {
      chainId: 4,
      url: rpcRinkebyAddress,
      accounts: [privateKey],
    },
    ethereum: {
      chainId: 1,
      url: rpcAddress,
      accounts: [privateKey],
    },
  },
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
      },
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 300000,
  },
  etherscan: {
    apiKey: scanRinkebyApiKey || scanApiKey,
  },
  typechain: {
    outDir: './typechain',
  },
};

export default config;
