import { ethers, waffle } from 'hardhat';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { Config, setupTests } from './fixtures';

chai.use(chaiAsPromised);
chai.use(waffle.solidity);

const { expect } = chai;

import * as dotenv from 'dotenv';
dotenv.config();

describe('CryptoGasStationNFP', async () => {
  let config: Config;

  beforeEach(async () => {
    config = await setupTests({ userCount: 10 });
  });

  it('does not allow mints over max patrons of each rarity', async () => {
    const nftContract = config.CryptoGasStationNFP;
    const deployer = config.deployer;

    const users = config.users;
    const user1 = users.shift();
  });

  describe('only owner', async () => {});
});
