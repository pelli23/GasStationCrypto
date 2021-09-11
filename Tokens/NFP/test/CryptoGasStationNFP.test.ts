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

  it('cant buy unknown rarity', async () => {
    const nftContract = config.CryptoGasStationNFP;
    const deployer = config.deployer;

    const usdcDecimals = await config.USDC.decimals();

    const bigApproval = ethers.BigNumber.from(999999).mul(
      ethers.BigNumber.from(10).pow(usdcDecimals),
    );

    await deployer.USDC.approve(nftContract.address, bigApproval);

    try {
      await deployer.CryptoGasStationNFP.buyPatron(0);
    } catch (e) {
      expect(e.message).to.equal(
        "VM Exception while processing transaction: reverted with reason string 'CryptoGasStationNFP: rarity doesn't exist'",
      );
    }

    try {
      await deployer.CryptoGasStationNFP.buyPatron(4);
    } catch (e) {
      expect(e.message).to.equal(
        "VM Exception while processing transaction: reverted with reason string 'CryptoGasStationNFP: rarity doesn't exist'",
      );
    }
  });

  it('returns default json for unknown tokenId', async () => {
    const nftContract = config.CryptoGasStationNFP;

    const baseURI = await nftContract.baseURI();

    const tokenUri = await nftContract.tokenURI(0);

    expect(tokenUri).to.equal(`${baseURI}NFPs-NFP.json`);
  });

  it('price goes up as more Patrons are bought', async () => {
    const nftContract = config.CryptoGasStationNFP;
    const deployer = config.deployer;

    const usdcDecimals = await config.USDC.decimals();
    const baseURI = await deployer.CryptoGasStationNFP.baseURI();

    const checkMintPriceAll = async function (
      rarity: number,
      startPrice: number,
      extraPrice: number,
      everyAmount: number,
    ) {
      const total = await nftContract.amountTotal(rarity);
      let minted = await nftContract.amountMinted(rarity);

      while (minted < total) {
        const price =
          startPrice + extraPrice * Math.floor(minted / everyAmount);

        const contractPrice =
          await deployer.CryptoGasStationNFP.getPatronRarityPrice(rarity);

        expect(contractPrice).to.equal(
          ethers.BigNumber.from(price).mul(
            ethers.BigNumber.from(10).pow(usdcDecimals),
          ),
        );

        const supplyBefore = (await nftContract.totalSupply()).toNumber();

        await deployer.CryptoGasStationNFP.mintPatron(rarity, deployer.address);

        const tokenId = supplyBefore + 1;
        const tokenRarity = await nftContract.patronRarity(tokenId);
        const tokenIdInRarity = await nftContract.patronTokenIdInRarity(
          tokenId,
        );

        expect(tokenRarity).to.equal(rarity);

        expect(await nftContract.ownerOf(tokenId)).to.equal(deployer.address);
        expect(await nftContract.tokenURI(tokenId)).to.equal(
          `${baseURI}${tokenRarity}/${tokenIdInRarity}/index.json`,
        );

        minted = await nftContract.amountMinted(rarity);
      }
    };

    await checkMintPriceAll(1, 25, 25, 125);
    await checkMintPriceAll(2, 250, 39, 1);
    await checkMintPriceAll(3, 750, 375, 1);
  });

  it('does not allow mints over max patrons of each rarity', async () => {
    const nftContract = config.CryptoGasStationNFP;
    const deployer = config.deployer;

    const users = config.users;
    const user1 = users.shift();

    const usdcDecimals = await config.USDC.decimals();
    const bigApproval = ethers.BigNumber.from(999999).mul(
      ethers.BigNumber.from(10).pow(usdcDecimals),
    );

    await deployer.USDC.approve(nftContract.address, bigApproval);

    const baseURI = await deployer.CryptoGasStationNFP.baseURI();

    for (let rarity = 1; rarity < 4; rarity++) {
      const maxRarity = await nftContract.amountTotal(rarity);

      let mintedSoFar = await nftContract.amountMinted(rarity);

      for (const user of users) {
        for (let i = 0; i < maxRarity / 10; i++) {
          if (mintedSoFar >= maxRarity) {
            continue;
          }

          await user.USDC.approve(nftContract.address, bigApproval);
          const supplyBefore = (await nftContract.totalSupply()).toNumber();

          await user.CryptoGasStationNFP.buyPatron(rarity);

          const tokenId = supplyBefore + 1;
          const tokenRarity = await nftContract.patronRarity(tokenId);
          const tokenIdInRarity = await nftContract.patronTokenIdInRarity(
            tokenId,
          );

          expect(tokenRarity).to.equal(rarity);

          expect(await nftContract.ownerOf(tokenId)).to.equal(user.address);
          expect(await nftContract.tokenURI(tokenId)).to.equal(
            `${baseURI}${tokenRarity}/${tokenIdInRarity}/index.json`,
          );

          mintedSoFar = await nftContract.amountMinted(rarity);
        }
      }

      while (mintedSoFar < maxRarity) {
        await user1.USDC.approve(nftContract.address, bigApproval);

        const user = user1;

        const supplyBefore = (await nftContract.totalSupply()).toNumber();

        await user.CryptoGasStationNFP.buyPatron(rarity);

        const tokenId = supplyBefore + 1;
        const tokenRarity = await nftContract.patronRarity(tokenId);
        const tokenIdInRarity = await nftContract.patronTokenIdInRarity(
          tokenId,
        );

        expect(tokenRarity).to.equal(rarity);

        expect(await nftContract.ownerOf(tokenId)).to.equal(user.address);
        expect(await nftContract.tokenURI(tokenId)).to.equal(
          `${baseURI}${tokenRarity}/${tokenIdInRarity}/index.json`,
        );

        mintedSoFar = await nftContract.amountMinted(rarity);
      }

      try {
        await deployer.USDC.approve(nftContract.address, bigApproval);

        await deployer.CryptoGasStationNFP.buyPatron(rarity);
        expect(true, 'buyPatron should only not allow max mint').to.equal(
          false,
        );
      } catch (e) {
        expect(e.message).to.equal(
          "VM Exception while processing transaction: reverted with reason string 'CryptoGasStationNFP: all patrons in this rarity are sold'",
        );
      }

      try {
        await deployer.CryptoGasStationNFP.mintPatron(rarity, deployer.address);
        expect(true, 'mintPatron shouldnt over mint').to.equal(false);
      } catch (e) {
        expect(e.message).to.equal(
          "VM Exception while processing transaction: reverted with reason string 'CryptoGasStationNFP: all patrons in this rarity are sold'",
        );
      }
    }
  });

  it('returns nfps for user', async () => {
    const nftContract = config.CryptoGasStationNFP;
    const deployer = config.deployer;

    const baseURI = await deployer.CryptoGasStationNFP.baseURI();

    let tokens = await deployer.CryptoGasStationNFP.getNFPsOfOwner(
      deployer.address,
    );

    expect(tokens.length).to.equal(0);

    await deployer.CryptoGasStationNFP.mintPatron(1, deployer.address);
    await deployer.CryptoGasStationNFP.mintPatron(2, deployer.address);
    await deployer.CryptoGasStationNFP.mintPatron(3, deployer.address);

    tokens = await deployer.CryptoGasStationNFP.getNFPsOfOwner(
      deployer.address,
    );

    expect(tokens.length).to.equal(3);

    for (let i = 0; i < tokens.length; i++) {
      const tokenId = tokens[i];
      const tokenRarity = await nftContract.patronRarity(tokenId);
      const tokenIdInRarity = await nftContract.patronTokenIdInRarity(tokenId);

      expect(tokenRarity).to.equal(i + 1);

      expect(await nftContract.ownerOf(tokenId)).to.equal(deployer.address);
      expect(await nftContract.tokenURI(tokenId)).to.equal(
        `${baseURI}${tokenRarity}/${tokenIdInRarity}/index.json`,
      );
    }
  });

  describe('only owner', async () => {
    it('can change token base uri', async () => {
      const nftContract = config.CryptoGasStationNFP;
      const deployer = config.deployer;
      const user1 = config.users[0];

      const newBaseUri = 'https://www.google.com';

      const initialBaseURI = await nftContract.baseURI();

      await deployer.CryptoGasStationNFP.setBaseURI(newBaseUri);

      const afterSetBaseURI = await nftContract.baseURI();

      expect(afterSetBaseURI).to.not.equal(initialBaseURI);
      expect(afterSetBaseURI).to.equal(newBaseUri);

      try {
        await user1.CryptoGasStationNFP.setBaseURI(initialBaseURI);
        expect(true, 'setBaseURI should only work for owner').to.equal(false);
      } catch (e) {
        expect(e.message).to.equal(
          "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'",
        );
      }
    });

    it('cant set amount total for rarity less then minted', async () => {
      const deployer = config.deployer;

      for (let rarity = 1; rarity < 4; rarity++) {
        await deployer.CryptoGasStationNFP.mintPatron(rarity, deployer.address);

        try {
          await deployer.CryptoGasStationNFP.setAmountTotal(rarity, 0);
          expect(
            true,
            'setAmountTotal shouldnt allow to set total below minted',
          ).to.equal(false);
        } catch (e) {
          expect(e.message).to.equal(
            "VM Exception while processing transaction: reverted with reason string 'CryptoGasStationNFP: minted NFPs amount is larger than this total limit'",
          );
        }
      }
    });

    it('can set amount total for rarity', async () => {
      const nftContract = config.CryptoGasStationNFP;
      const deployer = config.deployer;
      const user1 = config.users[0];

      const newAmount = 10;

      for (let rarity = 1; rarity < 4; rarity++) {
        const initialAmount = await nftContract.amountTotal(rarity);

        await deployer.CryptoGasStationNFP.setAmountTotal(rarity, newAmount);

        const afterAmount = await nftContract.amountTotal(rarity);

        expect(afterAmount).to.not.equal(initialAmount);
        expect(afterAmount).to.equal(newAmount);
      }

      try {
        await user1.CryptoGasStationNFP.setAmountTotal(1, 500);
        expect(true, 'setAmountTotal should only work for owner').to.equal(
          false,
        );
      } catch (e) {
        expect(e.message).to.equal(
          "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'",
        );
      }
    });

    it('can update payTo address', async () => {
      const nftContract = config.CryptoGasStationNFP;
      const deployer = config.deployer;
      const user1 = config.users[0];

      const newAddress = user1.address;

      const initialPayTo = await nftContract.payTo();

      await deployer.CryptoGasStationNFP.updatePayTo(newAddress);

      const afterUpdatePayTo = await nftContract.payTo();

      expect(afterUpdatePayTo).to.not.equal(initialPayTo);
      expect(afterUpdatePayTo).to.equal(newAddress);

      try {
        await user1.CryptoGasStationNFP.setBaseURI(initialPayTo);
        expect(true, 'updatePayTo should only work for owner').to.equal(false);
      } catch (e) {
        expect(e.message).to.equal(
          "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'",
        );
      }
    });

    it('can mint Patron for free', async () => {
      const nftContract = config.CryptoGasStationNFP;
      const deployer = config.deployer;
      const user1 = config.users[0];

      const baseURI = await deployer.CryptoGasStationNFP.baseURI();

      for (let rarity = 1; rarity < 4; rarity++) {
        const supplyBefore = (await nftContract.totalSupply()).toNumber();

        await deployer.CryptoGasStationNFP.mintPatron(rarity, deployer.address);

        const tokenId = supplyBefore + 1;
        const tokenRarity = await nftContract.patronRarity(tokenId);
        const tokenIdInRarity = await nftContract.patronTokenIdInRarity(
          tokenId,
        );

        expect(tokenRarity).to.equal(rarity);

        expect(await nftContract.ownerOf(tokenId)).to.equal(deployer.address);
        expect(await nftContract.tokenURI(tokenId)).to.equal(
          `${baseURI}${tokenRarity}/${tokenIdInRarity}/index.json`,
        );
      }

      try {
        await user1.CryptoGasStationNFP.mintPatron(1, user1.address);
        expect(true, 'mintPatron should only work for owner').to.equal(false);
      } catch (e) {
        expect(e.message).to.equal(
          "VM Exception while processing transaction: reverted with reason string 'Ownable: caller is not the owner'",
        );
      }
    });
  });
});
