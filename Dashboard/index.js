const tokens = {
  56: {
    address: "0x6fabfe7946b23da23ad51dc45167cc2cfd0ce70e",
    symbol: "bscGAS",
    decimals: 18,
    image: "https://imgur.com/is3daqb.png",
    rpcUrls: ["https://bsc-dataseed2.binance.org"],
    blockCreated: 9791290,
    provider: null,
    lpAddress: "0x340db2a8E77aD047e5E786c94dB0aE1593082264",
    gasAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    gasLpAddress: "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16",
  },
};

const lpAbi = [
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "token0",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "getReserves",
    outputs: [
      { internalType: "uint112", name: "_reserve0", type: "uint112" },
      { internalType: "uint112", name: "_reserve1", type: "uint112" },
      { internalType: "uint32", name: "_blockTimestampLast", type: "uint32" },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const gasReflectAbi = [
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getAccountDividendsInfo",
    outputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "int256", name: "", type: "int256" },
      { internalType: "int256", name: "", type: "int256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalDividendsDistributed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getNumberOfDividendTokenHolders",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

let provider;
let network;
let connected;
let address;
let statsUpdated;

const stats = {
  totalRewards: "0",
  totalRewardsUSD: "0",
  balance: "0",
  balanceUSD: "0",
  rewards: "0",
  rewardsUSD: "0",
  marketCap: "0",
  tradingVolume: "0",
  lpValue: "0",
  holders: "0",
  gasPrice: "5",
};

const decimals = ethers.BigNumber.from(10).pow(18);

function setAddress(addr) {
  address = addr;
}

function getAddress() {
  return address;
}

function getStats() {
  return stats;
}

function isConnected() {
  return connected;
}

async function configure(statsUpdatedCallback) {
  statsUpdated = statsUpdatedCallback;
  tokens["56"].provider = new ethers.providers.JsonRpcProvider(
    tokens["56"].rpcUrls[0]
  );

  provider = await detectEthereumProvider();
  network = provider ? `${provider.networkVersion}` : null;
  connected = !!provider;

  if (statsUpdated) {
    statsUpdated();
  }

  loadStats();
}

async function getTokenValueFromLP(token, lp, provider) {
  const lpContract = new ethers.Contract(lp, lpAbi, provider);

  const lpToken0 = await lpContract.token0();
  const lpReserves = await lpContract.getReserves();
  const lpTotalSupply = await lpContract.totalSupply();

  let value = 1;
  let percentA = 1;
  let percentB = 1;

  if (lpToken0 == token) {
    value = decimals.mul(lpReserves._reserve1).div(lpReserves._reserve0);
    percentA = decimals.mul(lpReserves._reserve0).div(lpTotalSupply);
    percentB = decimals.mul(lpReserves._reserve1).div(lpTotalSupply);
  } else {
    value = decimals.mul(lpReserves._reserve0).div(lpReserves._reserve1);
    percentA = decimals.mul(lpReserves._reserve1).div(lpTotalSupply);
    percentB = decimals.mul(lpReserves._reserve0).div(lpTotalSupply);
  }

  return [value, percentA, percentB, lpTotalSupply];
}

async function loadStats() {
  if (tokens["56"]) {
    const response = await fetch("https://bscgas.info/gas");

    if (response.ok) {
      const result = await response.json();
      stats.gasPrice = result.standard;
    }

    const gasReflectContract = new ethers.Contract(
      tokens["56"].address,
      gasReflectAbi,
      tokens["56"].provider
    );

    const totalSupply = await gasReflectContract.totalSupply();
    const burnedSupply = await gasReflectContract.balanceOf(
      "0x000000000000000000000000000000000000dead"
    );
    const circulatingSupply = totalSupply.sub(burnedSupply);

    let [bnbValue] = await getTokenValueFromLP(
      tokens["56"].gasAddress,
      tokens["56"].gasLpAddress,
      tokens["56"].provider
    );
    let [gasReflectValue, percentA, percentB, lpSupply] =
      await getTokenValueFromLP(
        tokens["56"].address,
        tokens["56"].lpAddress,
        tokens["56"].provider
      );

    stats.marketCap = ethers.utils.formatEther(
      circulatingSupply.div(gasReflectValue).mul(bnbValue)
    );
    stats.lpValue = ethers.utils.formatEther(
      lpSupply.mul(bnbValue).mul(percentA).div(decimals).div(decimals)
    );

    const totalRewards =
      await gasReflectContract.getTotalDividendsDistributed();
    stats.totalRewards = ethers.utils.formatEther(totalRewards);
    stats.totalRewardsUSD = ethers.utils.formatEther(
      totalRewards.mul(bnbValue).div(decimals)
    );

    const holders = await gasReflectContract.getNumberOfDividendTokenHolders();
    stats.holders = holders.toString();

    if (address) {
      const balance = await gasReflectContract.balanceOf(address);
      stats.balance = ethers.utils.formatEther(balance);
      stats.balanceUSD = ethers.utils.formatEther(
        balance.mul(bnbValue).div(decimals)
      );

      const accountInfo = await gasReflectContract.getAccountDividendsInfo(
        address
      );
      stats.rewards = ethers.utils.formatEther(accountInfo[4]);
      stats.rewardsUSD = ethers.utils.formatEther(
        accountInfo[4].mul(bnbValue).div(decimals)
      );
    } else {
      stats.balance = "0";
      stats.rewards = "0";
      stats.rewardsUSD = "0";
    }

    console.log(stats);
    if (statsUpdated) {
      statsUpdated();
    }
  }
}

async function connect(callback) {
  if (connected) {
    try {
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      address = accounts[0];

      console.log(`Connected: ${address}`);

      loadStats();

      if (callback) {
        callback();
      }
    } catch (error) {
      console.log(error);
    }
  }
}

async function disconnect(callback) {
  address = null;

  if (callback) {
    callback();
  }
}

async function registerToken() {
  network = provider ? `${provider.networkVersion}` : null;
  if (connected && tokens[network]) {
    try {
      const wasAdded = await provider.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokens[network].address,
            symbol: tokens[network].symbol,
            decimals: tokens[network].decimals,
            image: tokens[network].image,
          },
        },
      });

      if (wasAdded) {
        console.log("Thanks for your interest!");
      } else {
        console.log("Your loss!");
      }
    } catch (error) {
      console.log(error);
    }
  }
}
