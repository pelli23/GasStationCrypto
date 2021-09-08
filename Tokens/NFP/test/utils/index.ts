import { Contract } from 'ethers';
import { network, ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export async function fastforward(increaseTime: number) {
  await network.provider.send('evm_setNextBlockTimestamp', [
    Date.now() + increaseTime,
  ]);
  await network.provider.send('evm_mine');
}

export async function setupUsers<
  T extends { [contractName: string]: Contract },
>(
  addresses: string[],
  contracts: T,
): Promise<({ address: string; signer: SignerWithAddress } & T)[]> {
  const users: ({ address: string; signer: SignerWithAddress } & T)[] = [];
  for (const address of addresses) {
    users.push(await setupUser(address, contracts));
  }
  return users;
}

export async function setupUser<T extends { [contractName: string]: Contract }>(
  address: string,
  contracts: T,
): Promise<{ address: string; signer: SignerWithAddress } & T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = {
    address,
    signer: await ethers.getSigner(address),
  };
  for (const key of Object.keys(contracts)) {
    user[key] = contracts[key].connect(user.signer);
  }
  return user as { address: string; signer: SignerWithAddress } & T;
}
