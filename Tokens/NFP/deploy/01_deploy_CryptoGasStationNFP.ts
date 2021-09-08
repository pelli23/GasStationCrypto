import * as dotenv from 'dotenv';
dotenv.config();

import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const tags = ['CryptoGasStationNFP'];

const func: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy('CryptoGasStationNFP', {
    from: deployer,
    args: [
      'https://t2mir7dilg.execute-api.us-west-2.amazonaws.com/dev/tokens/',
    ],
    log: true,
  });

  return true;
};

func.id = '01_deploy_CryptoGasStationNFP';
func.tags = tags;
export default func;
