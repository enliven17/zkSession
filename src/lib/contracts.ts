// XLayer Session Contract ABI
export const SESSION_CONTRACT_ABI = [
  // Functions
  {
    "inputs": [
      {"internalType": "uint256", "name": "_expiry", "type": "uint256"},
      {"internalType": "uint256", "name": "_limit", "type": "uint256"}
    ],
    "name": "createSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_user", "type": "address"},
      {"internalType": "uint256", "name": "_amount", "type": "uint256"}
    ],
    "name": "executeTrade",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getSession",
    "outputs": [
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "uint256", "name": "expiry", "type": "uint256"},
      {"internalType": "uint256", "name": "spendLimit", "type": "uint256"},
      {"internalType": "uint256", "name": "spent", "type": "uint256"},
      {"internalType": "bool", "name": "isActive", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "isSessionValid",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getRemainingLimit",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_trader", "type": "address"}],
    "name": "authorizeTrader",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_trader", "type": "address"}],
    "name": "revokeTrader",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "emergencyExpireSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "expiry", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "spendLimit", "type": "uint256"}
    ],
    "name": "SessionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "remaining", "type": "uint256"}
    ],
    "name": "TradeExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "SessionExpired",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "trader", "type": "address"}
    ],
    "name": "TraderAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "trader", "type": "address"}
    ],
    "name": "TraderRevoked",
    "type": "event"
  }
] as const;

// Contract address (XLayer testnet deployed)
export const SESSION_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SESSION_CONTRACT_ADDRESS || "0xc0b33Cc720025dD0AcF56e249C8b76A6A34170B6" as const;

// XLayer Testnet configuration
export const XLAYER_CONFIG = {
  chainId: parseInt(process.env.NEXT_PUBLIC_XLAYER_CHAIN_ID || '196'),
  rpcUrl: process.env.NEXT_PUBLIC_XLAYER_RPC_URL || "https://rpc.xlayer.tech",
}; 