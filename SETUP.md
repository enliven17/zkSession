# 🔐 Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# OKX API Configuration
NEXT_PUBLIC_OKX_API_KEY=your_okx_api_key_here
NEXT_PUBLIC_OKX_SECRET_KEY=your_okx_secret_key_here
NEXT_PUBLIC_OKX_PASSPHRASE=your_okx_passphrase_here

# XLayer Contract Configuration
NEXT_PUBLIC_SESSION_CONTRACT_ADDRESS=your_deployed_contract_address

# WalletConnect Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# XLayer Network Configuration
NEXT_PUBLIC_XLAYER_CHAIN_ID=196
NEXT_PUBLIC_XLAYER_RPC_URL=https://rpc.xlayer.tech
```

## 🔑 Getting OKX API Keys

1. Go to [OKX Developer Portal](https://www.okx.com/developers)
2. Create an account and log in
3. Navigate to API Management
4. Create a new API key with the following permissions:
   - **Read** permissions for account data
   - **Trade** permissions for DEX operations
5. Copy the API Key, Secret Key, and Passphrase

## 🏗️ Deploying Smart Contract

1. Add XLayer mainnet to MetaMask:
   - Network Name: XLayer
   - RPC URL: https://rpc.xlayer.tech
   - Chain ID: 196
   - Currency Symbol: OKB

2. Deploy the `XLayerSession.sol` contract using Remix IDE or Hardhat

3. Update `NEXT_PUBLIC_SESSION_CONTRACT_ADDRESS` with the deployed contract address

## 🔗 WalletConnect Setup

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Update `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

## 🚀 Running the Application

```bash
npm install
npm run dev
```

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Keep your API keys secure and rotate them regularly
- Use different API keys for development and production
- Monitor API usage to prevent abuse

## 🐛 Troubleshooting

If you see "Missing OKX API configuration" error:
1. Check that `.env.local` file exists
2. Verify all environment variables are set
3. Restart the development server after making changes 