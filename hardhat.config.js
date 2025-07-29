require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "xlayerMainnet",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: ["2a975a6e86c98d3e96927ba685f2e45a7df6363596e30df574c7901f2e2e6cc9"]
    },
    xlayerMainnet: {
      url: "https://rpc.xlayer.tech",
      chainId: 196,
      accounts: ["2a975a6e86c98d3e96927ba685f2e45a7df6363596e30df574c7901f2e2e6cc9"],
      gasPrice: 1000000000
    },
    xlayerTestnet: {
      url: "https://testrpc.xlayer.tech",
      chainId: 195,
      accounts: ["2a975a6e86c98d3e96927ba685f2e45a7df6363596e30df574c7901f2e2e6cc9"],
      gas: 6000000,
      gasPrice: 10000000000 // 10 gwei
    }
  },
  mocha: {
    timeout: 40000
  }
};
