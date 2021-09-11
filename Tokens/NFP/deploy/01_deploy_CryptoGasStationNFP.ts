import * as dotenv from 'dotenv';
dotenv.config();

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { USDC_ADDRESSES } from '../constants';

const tags = ['CryptoGasStationNFP'];

const func: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const usdcAddresses = {
    '56': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    '137': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  };

  await deploy('CryptoGasStationNFP', {
    from: deployer,
    args: [
      'https://t2mir7dilg.execute-api.us-west-2.amazonaws.com/dev/tokens/',
      usdcAddresses[network.config.chainId],
      deployer,
    ],
    log: true,
  });

  return true;
};

func.id = '01_deploy_CryptoGasStationNFP';
func.tags = tags;
export default func;
