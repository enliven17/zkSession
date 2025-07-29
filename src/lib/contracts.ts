// XLayer Session Contract ABI
export const SESSION_CONTRACT_ABI = [
  // Session struct
  "struct Session { address user; uint256 expiry; uint256 spendLimit; uint256 spent; bool isActive; }",
  
  // Events
  "event SessionCreated(address indexed user, uint256 expiry, uint256 spendLimit)",
  "event TradeExecuted(address indexed user, uint256 amount, uint256 remaining)",
  "event SessionExpired(address indexed user)",
  "event TraderAuthorized(address indexed trader)",
  "event TraderRevoked(address indexed trader)",
  
  // Functions
  "function createSession(uint256 duration, uint256 spendLimit) external",
  "function executeTrade(uint256 amount) external returns (bool)",
  "function getSession(address user) external view returns (Session memory)",
  "function isSessionValid(address user) external view returns (bool)",
  "function getRemainingLimit(address user) external view returns (uint256)",
  "function authorizeTrader(address trader) external",
  "function revokeTrader(address trader) external",
  "function emergencyExpireSession(address user) external",
  
  // Mappings
  "mapping(address => Session) public sessions",
  "mapping(address => bool) public authorizedTraders"
] as const;

// Contract address (will be updated after deployment to XLayer testnet)
export const SESSION_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SESSION_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// XLayer Testnet configuration from official docs
export const XLAYER_TESTNET_CONFIG = {
  chainId: 195,
  name: 'X Layer Testnet',
  network: 'xlayer-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    public: { http: ['https://testrpc.xlayer.tech'] },
    default: { http: ['https://testrpc.xlayer.tech'] },
  },
  blockExplorers: {
    default: { name: 'XLayer Explorer', url: 'https://www.okx.com/web3/explorer/xlayer-test' },
  },
} as const; 