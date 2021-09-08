import { deployments } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Deployment } from 'hardhat-deploy/types';

import { CryptoGasStationNFP } from '../../typechain';

import { setupUsers, setupUser } from '../utils';

export type Contracts = {
  CryptoGasStationNFP: Deployment;
};

export type Instances = {
  CryptoGasStationNFP: CryptoGasStationNFP;
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
    { deployments, getNamedAccounts, getUnnamedAccounts, ethers },
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

    return config;
  },
);
