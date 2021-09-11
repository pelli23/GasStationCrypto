import { deployments } from 'hardhat';
import chai from 'chai';

const { expect } = chai;

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Deployment } from 'hardhat-deploy/types';

import { ERC20, CryptoGasStationNFP } from '../../typechain';
import { IUniswapV2Router02 } from '../typechain/IUniswapV2Router02';
import IUniswapV2Router02Abi from '../abi/IUniswapV2Router02.json';

import { setupUsers, setupUser } from '../utils';

import {
  USDC_ADDRESSES,
  WETH_ADDRESSES,
  APE_ROUTERS,
  WETH_USDC_PATH_EXTRA,
} from '../../constants';

export type Contracts = {
  CryptoGasStationNFP: Deployment;
};

export type Instances = {
  CryptoGasStationNFP: CryptoGasStationNFP;
  USDC: ERC20;
  WETH: ERC20;
  ApeRouter: IUniswapV2Router02;
};

export type UserContracts = Instances & {
  address: string;
  signer: SignerWithAddress;
};

export type Config = Instances & {
  deployedContracts: Contracts;
  users: UserContracts[];
  deployer: UserContracts;
};

export const setupTests = deployments.createFixture<
  Config,
  { userCount: number }
>(
  async (
    { deployments, getNamedAccounts, getUnnamedAccounts, ethers, network },
    { userCount },
  ) => {
    await deployments.fixture();

    const deployedContracts: Contracts = {
      CryptoGasStationNFP: await deployments.get('CryptoGasStationNFP'),
    };

    const instances: Instances = {
      CryptoGasStationNFP: (await ethers.getContractAt(
        deployedContracts.CryptoGasStationNFP.abi,
        deployedContracts.CryptoGasStationNFP.address,
      )) as CryptoGasStationNFP,
      USDC: (await ethers.getContractAt(
        'ERC20',
        USDC_ADDRESSES[network.config.chainId],
      )) as ERC20,
      WETH: (await ethers.getContractAt(
        'ERC20',
        WETH_ADDRESSES[network.config.chainId],
      )) as ERC20,
      ApeRouter: (await ethers.getContractAt(
        IUniswapV2Router02Abi,
        APE_ROUTERS[network.config.chainId],
      )) as IUniswapV2Router02,
    };

    const { deployer } = await getNamedAccounts();

    const users = await setupUsers(
      await (await getUnnamedAccounts()).splice(0, userCount),
      instances,
    );

    const config: Config = {
      ...instances,
      deployedContracts,
      users,
      deployer: await setupUser(deployer, instances),
    };

    // console.log(
    //   (await ethers.provider.getBalance(config.deployer.address)).toString(),
    // );

    // await network.provider.send('hardhat_setBalance', [
    //   config.deployer.address,
    //   '0xf00000000000',
    // ]);

    // console.log(
    //   (await ethers.provider.getBalance(config.deployer.address)).toString(),
    // );

    const path = [
      WETH_ADDRESSES[network.config.chainId],
      ...WETH_USDC_PATH_EXTRA[network.config.chainId],
      USDC_ADDRESSES[network.config.chainId],
    ];

    const usdcDecimals = await config.USDC.decimals();

    const getUsdc = async function (amount, user) {
      const usdcDesired = ethers.BigNumber.from(amount).mul(
        ethers.BigNumber.from(10).pow(usdcDecimals),
      );

      const estimatedEth = (
        await config.ApeRouter.getAmountsIn(usdcDesired, path)
      )[0];

      await network.provider.send('hardhat_setBalance', [
        user.address,
        estimatedEth.mul(10).toHexString(),
      ]);

      await user.ApeRouter.swapETHForExactTokens(
        usdcDesired,
        path,
        user.address,
        Date.now(),
        {
          value: estimatedEth.mul(110).div(100),
        },
      );

      const tokenBalanceWei = await config.USDC.balanceOf(
        config.deployer.address,
      );
      expect(tokenBalanceWei).to.be.above(
        ethers.BigNumber.from(usdcDesired).mul(95).div(100),
      );
    };

    await getUsdc(20000, config.deployer);

    for (let i = 0; i < config.users.length; i++) {
      await getUsdc(20000, config.users[i]);
    }

    await getUsdc(20000, config.users[0]);

    return config;
  },
);
