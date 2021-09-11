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
const rpcPolygonAddress = process.env['POLYGON_RPC_ADDRESS'] || '';
const polygonscanApiKey = process.env['POLYGONSCAN_API_KEY'] || '';
const rpcBSCAddress = process.env['BSC_RPC_ADDRESS'] || '';
const bscscanApiKey = process.env['BSCSCAN_API_KEY'] || '';

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
    // hardhat: {
    //   chainId: 56,
    //   forking: {
    //     url: rpcBSCAddress,
    //     blockNumber: 10784771,
    //   },
    // },
    hardhat: {
      chainId: 137,
      forking: {
        url: rpcPolygonAddress,
        blockNumber: 18944218,
      },
    },
    localhost: {
      url: 'http://127.0.0.1:7545',
      accounts: [privateKey],
    },
    polygon: {
      chainId: 137,
      url: rpcPolygonAddress,
      accounts: [privateKey],
    },
    bsc: {
      chainId: 56,
      url: rpcBSCAddress,
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
    apiKey: polygonscanApiKey || bscscanApiKey,
  },
  typechain: {
    outDir: './typechain',
  },
};

export default config;
