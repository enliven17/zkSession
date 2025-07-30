'use client';

import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// XLayer Testnet configuration
const xlayerTestnet = {
  id: 195,
  name: 'X Layer Testnet',
  network: 'xlayer-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    public: { 
      http: [
        'https://testrpc.xlayer.tech'
      ] 
    },
    default: { 
      http: [
        'https://testrpc.xlayer.tech'
      ] 
    },
  },
  blockExplorers: {
    default: { name: 'OKX Explorer', url: 'https://www.okx.com/web3/explorer/xlayer-test' },
  },
  testnet: true,
};

// XLayer Mainnet configuration
const xlayerMainnet = {
  id: 196,
  name: 'X Layer Mainnet',
  network: 'xlayer-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    public: { 
      http: [
        'https://rpc.xlayer.tech'
      ] 
    },
    default: { 
      http: [
        'https://rpc.xlayer.tech'
      ] 
    },
  },
  blockExplorers: {
    default: { name: 'OKX Explorer', url: 'https://www.okx.com/web3/explorer/xlayer' },
  },
};

// Ethereum Mainnet (for fallback)
const ethereumMainnet = {
  id: 1,
  name: 'Ethereum',
  network: 'ethereum',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://eth.llamarpc.com'] },
    default: { http: ['https://eth.llamarpc.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
};

const { chains, publicClient } = configureChains(
  [xlayerTestnet, xlayerMainnet, ethereumMainnet],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID || 'demo' }),
    infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_ID || '84842078b09946638c03157f83405213' }),
    publicProvider()
  ]
);

const config = createConfig({
  autoConnect: true, // Enable autoConnect for better UX
  connectors: [
    new MetaMaskConnector({ 
      chains,
      options: {
        shimDisconnect: true,
      }
    }),
    new InjectedConnector({ 
      chains,
      options: {
        shimDisconnect: true,
      }
    }),
    new WalletConnectConnector({ 
      chains, 
      options: { 
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c4f79cc821944d9680842e34466bfbd9',
        showQrModal: true,
        metadata: {
          name: 'zkSession',
          description: 'Secure XLayer Session Management',
          url: 'https://zksession.vercel.app',
          icons: ['https://zksession.vercel.app/icon.png']
        }
      } 
    }),
  ],
  publicClient,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiConfig>
  );
} 