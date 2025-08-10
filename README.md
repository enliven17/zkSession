# zkSession - Secure XLayer Trading Sessions

A secure and limited trading session management system built on XLayer (OKX's L2) that allows users to create time-limited and spending-limited trading sessions for OKX DEX.

## 🚀 Features

- **Secure Session Management**: Create time-limited trading sessions with spending limits
- **XLayer Integration**: Built on OKX's official L2 for low gas fees and zkProof support
- **OKX DEX Integration**: Direct integration with OKX trading API
- **Wallet Security**: Private keys never leave the user's wallet
- **Real-time Trading**: Execute trades with session-based limits
- **Modern UI**: Beautiful and intuitive user interface

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   XLayer        │    │   OKX API       │
│   (Next.js)     │◄──►│   Smart Contract│◄──►│   Trading       │
│                 │    │   (Session Mgmt)│    │   Engine        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Wallet   │    │   zkProof       │    │   Market Data   │
│   (MetaMask)    │    │   Generation    │    │   & Execution   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Blockchain**: XLayer (OKX L2), Solidity, Ethers.js
- **State Management**: Wagmi, React Query
- **API Integration**: OKX Trading API, Axios
- **UI Components**: Lucide React Icons

## 📋 Prerequisites

- Node.js 18+ 
- MetaMask wallet with XLayer testnet configured
- OKX Developer Account (for API keys)
- XLayer testnet OKB tokens

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd zkSession
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your API keys:

```bash
cp env.example .env.local
```

Edit `.env.local` with your actual API keys:

```env
# OKX API Configuration
NEXT_PUBLIC_OKX_API_KEY=your_okx_api_key_here
NEXT_PUBLIC_OKX_SECRET_KEY=your_okx_secret_key_here
NEXT_PUBLIC_OKX_PASSPHRASE=your_okx_passphrase_here

# XLayer Contract Configuration
NEXT_PUBLIC_SESSION_CONTRACT_ADDRESS=your_deployed_contract_address

# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### 3. Deploy Smart Contract

1. Add XLayer testnet to MetaMask:
   - Network Name: XLayer Testnet
   - RPC URL: https://testrpc.xlayer.tech
   - Chain ID: 196
   - Currency Symbol: OKB

2. Deploy the contract using Remix IDE or Hardhat:
   ```solidity
   // Deploy XLayerSession.sol to XLayer testnet
   ```

3. Update the contract address in `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### Creating a Session

1. Connect your MetaMask wallet
2. Set session duration (e.g., 24 hours)
3. Set spending limit (e.g., $500)
4. Click "Create Session"

### Trading

1. Select trading pair (BTC/USDT, ETH/USDT, etc.)
2. Choose buy/sell side
3. Enter amount (within session limits)
4. Execute trade

## 🔧 Configuration

### OKX API Setup

1. Create account at [OKX Developer Portal](https://www.okx.com/developers)
2. Generate API keys with trading permissions
3. Add IP whitelist for security

### XLayer Network

- **Testnet RPC**: https://testrpc.xlayer.tech
- **Chain ID**: 196
- **Currency**: OKB
- **Block Explorer**: https://www.oklink.com/xlayer-test

## 🧪 Testing

```bash
# Run tests
npm test

# Test scenarios
- Session creation with limits
- Trade execution within limits
- Limit exceeded scenarios
- Session expiration handling
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/         # React components
│   ├── header.tsx      # Navigation header
│   ├── providers.tsx   # Wagmi providers
│   ├── session-manager.tsx
│   └── trade-interface.tsx
├── api/               # API integrations
│   └── okx.ts         # OKX trading API
├── lib/               # Utilities and config
│   └── contracts.ts   # Contract ABI and config
├── contracts/         # Smart contracts
│   └── XLayerSession.sol
└── types/             # TypeScript types
```

## 🔒 Security Features

- **Private Key Protection**: Keys never leave user's wallet
- **Session Limits**: Time and spending constraints
- **XLayer Security**: zkProof verification
- **API Security**: Signed requests with timestamps
- **Input Validation**: Comprehensive validation on all inputs

## 🌟 Key Benefits

- **Low Gas Fees**: XLayer provides 90% lower fees than Ethereum
- **zkProof Support**: Zero-knowledge proofs for privacy
- **OKX Integration**: Direct access to OKX's liquidity
- **Session Security**: Limited and time-bound trading sessions
- **User Control**: Full control over session parameters

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details


## 🔮 Roadmap

- [ ] Multi-chain support
- [ ] Advanced zkProof integration
- [ ] Mobile app
- [ ] Social trading features
- [ ] DeFi protocol integrations 