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
    stableDecimals: 18,
    blockExplorerUrls: ["https://www.bscscan.com/"],
  },
  137: {
    address: "0x840b5fc8c6dee2b1140174a3abdc215190426ccf",
    symbol: "polyGAS",
    decimals: 18,
    image: "https://imgur.com/is3daqb.png",
    rpcUrls: ["https://polygon-rpc.com/"],
    blockCreated: 17732765,
    provider: null,
    lpAddress: "0x2637ce16e98fcc66f2ccdd36087defdcf955b68a",
    gasAddress: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    gasLpAddress: "0xcd353F79d9FADe311fC3119B841e1f456b54e858",
    stableDecimals: 6,
    blockExplorerUrls: ["https://polygonscan.com/"],
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

let refreshInterval = 600000;

let provider;
let network;
let connected;
let address;
let statsUpdated;

const refreshData = {
  gasPrice: {
    timeout: null,
    refreshing: false,
  },
  gasValue: {
    timeout: null,
    refreshing: false,
  },
  lpData: {
    timeout: null,
    refreshing: false,
  },
  totalRewardsData: {
    timeout: null,
    refreshing: false,
  },
  holdersData: {
    timeout: null,
    refreshing: false,
  },
  balanceData: {
    timeout: null,
    refreshing: false,
  },
  rewardsData: {
    timeout: null,
    refreshing: false,
  },
};

let stats = {
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
  internal: {},
};

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
  tokens["137"].provider = new ethers.providers.JsonRpcProvider(
    tokens["137"].rpcUrls[0]
  );

  provider = await detectEthereumProvider();

  if (provider.selectedAddress) {
    address = provider.selectedAddress;
  }

  const refreshNetwork = () => {
    let newNetwork = provider ? `${provider.networkVersion}` : null;

    if (!newNetwork || !tokens[newNetwork]) {
      if (network && tokens[network]) {
        newNetwork = network;
      } else {
        newNetwork = Object.keys(tokens)[0];
      }
    }

    if (network != newNetwork) {
      stats = {
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
        internal: {},
      };
    }

    network = newNetwork;

    loadStats();

    setTimeout(refreshNetwork, 5000);
  };

  refreshNetwork();

  connected = !!provider;

  if (statsUpdated) {
    statsUpdated();
  }

  loadStats();
}

const decimals = ethers.BigNumber.from(10).pow(18);

async function getTokenValueFromLP(token, lp, provider) {
  const lpContract = new ethers.Contract(lp, lpAbi, provider);

  const lpToken0 = await lpContract.token0();
  const lpReserves = await lpContract.getReserves();
  let lpTotalSupply = await lpContract.totalSupply();

  let value = 1;
  let percentA = 1;
  let percentB = 1;

  if (lpToken0.toLowerCase() == token.toLowerCase()) {
    value = decimals.mul(lpReserves._reserve1).div(lpReserves._reserve0);
    percentA = decimals.mul(lpReserves._reserve1).div(lpTotalSupply);
    percentB = decimals.mul(lpReserves._reserve0).div(lpTotalSupply);
  } else {
    value = decimals.mul(lpReserves._reserve0).div(lpReserves._reserve1);
    percentA = decimals.mul(lpReserves._reserve0).div(lpTotalSupply);
    percentB = decimals.mul(lpReserves._reserve1).div(lpTotalSupply);
  }

  return [value, percentA, percentB, lpTotalSupply];
}

async function refreshGasPrice() {
  if (refreshData.gasPrice.refreshing) {
    return;
  }

  refreshData.gasPrice.refreshing = true;
  clearTimeout(refreshData.gasPrice.timeout);

  try {
    const response = await fetch("https://bscgas.info/gas");

    if (response.ok) {
      const result = await response.json();
      stats.gasPrice = result.standard;
    }
  } catch (e) {
    console.error(e);
  }

  const halfInterval = refreshInterval / 2;
  refreshData.gasPrice.timeout = setTimeout(
    refreshGasPrice,
    (halfInterval + Math.random() * halfInterval) * 5
  );
  refreshData.gasPrice.refreshing = false;

  if (statsUpdated) {
    statsUpdated();
  }
}

function updateMarketCap() {
  if (
    stats.internal.circulatingSupply &&
    stats.internal.gasValue &&
    stats.internal.gasReflectValue
  ) {
    stats.marketCap = ethers.utils.formatEther(
      stats.internal.circulatingSupply
        .mul(stats.internal.gasValue)
        .div(stats.internal.gasReflectValue)
    );
  }
}

function updateLpValue() {
  if (stats.internal.gasValue && stats.internal.percentA) {
    stats.lpValue = ethers.utils.formatEther(
      stats.internal.lpSupply
        .mul(stats.internal.percentA)
        .mul(stats.internal.gasValue)
        .div(decimals)
        .div(decimals)
    );
  }
}

function updateTotalRewardsUsd() {
  if (stats.internal.totalRewards && stats.internal.gasValue) {
    stats.totalRewardsUSD = ethers.utils.formatEther(
      stats.internal.totalRewards.mul(stats.internal.gasValue).div(decimals)
    );
  }
}

function updateBalanceUsd() {
  if (address) {
    if (
      stats.internal.balance &&
      stats.internal.gasValue &&
      stats.internal.gasReflectValue
    ) {
      stats.balanceUSD = ethers.utils.formatEther(
        stats.internal.balance
          .mul(stats.internal.gasReflectValue)
          .mul(stats.internal.gasValue)
          .div(decimals)
          .div(decimals)
      );
    }
  } else {
    stats.balanceUSD = "0";
  }
}

function updateRewardsUsd() {
  if (address) {
    if (stats.internal.rewards && stats.internal.gasValue) {
      stats.rewardsUSD = ethers.utils.formatEther(
        stats.internal.rewards.mul(stats.internal.gasValue).div(decimals)
      );
    }
  } else {
    stats.rewardsUSD = "0";
  }
}

async function refreshGasValue() {
  if (refreshData.gasValue.refreshing) {
    return;
  }

  refreshData.gasValue.refreshing = true;
  clearTimeout(refreshData.gasValue.timeout);

  try {
    let [gasValue] = await getTokenValueFromLP(
      tokens[network].gasAddress,
      tokens[network].gasLpAddress,
      tokens[network].provider
    );

    stats.internal.gasValue = gasValue.mul(
      ethers.BigNumber.from(10).pow(18 - tokens[network].stableDecimals)
    );
  } catch (e) {
    console.error(e);
  }

  updateMarketCap();
  updateLpValue();
  updateTotalRewardsUsd();
  updateBalanceUsd();
  updateRewardsUsd();

  const halfInterval = refreshInterval / 2;
  refreshData.gasValue.timeout = setTimeout(
    refreshGasValue,
    halfInterval + Math.random() * halfInterval
  );
  refreshData.gasValue.refreshing = false;

  if (statsUpdated) {
    statsUpdated();
  }
}

async function refreshLpData() {
  if (refreshData.lpData.refreshing) {
    return;
  }

  refreshData.lpData.refreshing = true;
  clearTimeout(refreshData.lpData.timeout);

  if (tokens[network].lpAddress) {
    try {
      let [gasReflectValue, percentA, percentB, lpSupply] =
        await getTokenValueFromLP(
          tokens[network].address,
          tokens[network].lpAddress,
          tokens[network].provider
        );

      stats.internal.gasReflectValue = gasReflectValue;
      stats.internal.percentA = percentA;
      stats.internal.percentB = percentB;
      stats.internal.lpSupply = lpSupply;
    } catch (e) {
      console.error(e);
    }

    updateMarketCap();
    updateLpValue();
  }

  const halfInterval = refreshInterval / 2;
  refreshData.lpData.timeout = setTimeout(
    refreshLpData,
    halfInterval + Math.random() * halfInterval
  );
  refreshData.lpData.refreshing = false;

  if (statsUpdated) {
    statsUpdated();
  }
}

async function refreshTotalRewardsData() {
  if (refreshData.totalRewardsData.refreshing) {
    return;
  }

  refreshData.totalRewardsData.refreshing = true;
  clearTimeout(refreshData.totalRewardsData.timeout);

  try {
    const gasReflectContract = new ethers.Contract(
      tokens[network].address,
      gasReflectAbi,
      tokens[network].provider
    );

    const totalRewards =
      await gasReflectContract.getTotalDividendsDistributed();
    stats.internal.totalRewards = totalRewards;
    stats.totalRewards = ethers.utils.formatEther(totalRewards);

    updateTotalRewardsUsd();
  } catch (e) {
    console.error(e);
  }

  const halfInterval = refreshInterval / 2;
  refreshData.totalRewardsData.timeout = setTimeout(
    refreshLpData,
    halfInterval + Math.random() * halfInterval
  );
  refreshData.totalRewardsData.refreshing = false;

  if (statsUpdated) {
    statsUpdated();
  }
}

async function refreshHoldersData() {
  if (refreshData.holdersData.refreshing) {
    return;
  }

  refreshData.holdersData.refreshing = true;
  clearTimeout(refreshData.holdersData.timeout);

  try {
    const gasReflectContract = new ethers.Contract(
      tokens[network].address,
      gasReflectAbi,
      tokens[network].provider
    );

    const holders = await gasReflectContract.getNumberOfDividendTokenHolders();
    stats.holders = holders.toString();
  } catch (e) {
    console.error(e);
  }

  const halfInterval = refreshInterval / 2;
  refreshData.holdersData.timeout = setTimeout(
    refreshLpData,
    halfInterval + Math.random() * halfInterval
  );
  refreshData.holdersData.refreshing = false;

  if (statsUpdated) {
    statsUpdated();
  }
}

async function refreshBalanceData() {
  if (refreshData.balanceData.refreshing) {
    return;
  }

  refreshData.balanceData.refreshing = true;
  clearTimeout(refreshData.balanceData.timeout);

  if (address) {
    try {
      const gasReflectContract = new ethers.Contract(
        tokens[network].address,
        gasReflectAbi,
        tokens[network].provider
      );

      const balance = await gasReflectContract.balanceOf(address);
      stats.internal.balance = balance;
      stats.balance = ethers.utils.formatEther(balance);
    } catch (e) {
      console.error(e);
    }
  } else {
    stats.internal.balance = 0;
    stats.balance = "";
  }

  updateBalanceUsd();

  const halfInterval = refreshInterval / 2;
  refreshData.balanceData.timeout = setTimeout(
    refreshLpData,
    halfInterval + Math.random() * halfInterval
  );
  refreshData.balanceData.refreshing = false;

  if (statsUpdated) {
    statsUpdated();
  }
}

async function refreshRewardsData() {
  if (refreshData.rewardsData.refreshing) {
    return;
  }

  refreshData.rewardsData.refreshing = true;
  clearTimeout(refreshData.rewardsData.timeout);

  if (address) {
    try {
      const gasReflectContract = new ethers.Contract(
        tokens[network].address,
        gasReflectAbi,
        tokens[network].provider
      );

      const accountInfo = await gasReflectContract.getAccountDividendsInfo(
        address
      );
      stats.internal.rewards = accountInfo[4];
      stats.rewards = ethers.utils.formatEther(accountInfo[4]);
    } catch (e) {
      console.error(e);
    }
  } else {
    stats.internal.rewards = 0;
    stats.rewards = "";
  }

  updateRewardsUsd();

  const halfInterval = refreshInterval / 2;
  refreshData.rewardsData.timeout = setTimeout(
    refreshLpData,
    halfInterval + Math.random() * halfInterval
  );
  refreshData.rewardsData.refreshing = false;

  if (statsUpdated) {
    statsUpdated();
  }
}

async function loadStats() {
  if (tokens[network]) {
    refreshGasPrice();

    refreshGasValue();
    refreshLpData();

    const gasReflectContract = new ethers.Contract(
      tokens[network].address,
      gasReflectAbi,
      tokens[network].provider
    );

    if (!stats.internal.circulatingSupply) {
      const totalSupply = await gasReflectContract.totalSupply();
      const burnedSupply = await gasReflectContract.balanceOf(
        "0x000000000000000000000000000000000000dead"
      );
      stats.internal.circulatingSupply = totalSupply.sub(burnedSupply);

      updateMarketCap();
    }

    refreshTotalRewardsData();
    refreshHoldersData();
    refreshBalanceData();
    refreshRewardsData();

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

async function switchNetwork(_network, callback) {
  const isNewNetwork = _network != network;
  network = _network;

  if (connected) {
    try {
      if (isNewNetwork) {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${parseInt(network, 10).toString(16)}` }],
          });
        } catch (e) {
          if (e.code == 4902) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${parseInt(network, 10).toString(16)}`,
                  chainName:
                    network == "56" ? "Binance Smart Chain" : "Polygon Network",
                  nativeCurrency: {
                    name: network == "56" ? "BNB" : "Matic",
                    symbol: network == "56" ? "BNB" : "Matic",
                    decimals: 18,
                  },
                  rpcUrls: tokens[network].rpcUrls,
                  blockExplorerUrls: tokens[network].blockExplorerUrls,
                },
              ],
            });
          }
        }
      }

      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      address = accounts[0];

      console.log(`Connected: ${address}`);
    } catch (error) {
      console.log(error);
    }
  }

  stats = {
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
    internal: {},
  };

  if (statsUpdated) {
    statsUpdated();
  }

  loadStats();

  if (callback) {
    callback();
  }
}

async function disconnect(callback) {
  address = null;

  if (callback) {
    callback();
  }
}

async function registerToken() {
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
