'use client';

import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';
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
    public: { http: ['https://testrpc.xlayer.tech'] },
    default: { http: ['https://testrpc.xlayer.tech'] },
  },
  blockExplorers: {
    default: { name: 'OKX Explorer', url: 'https://www.okx.com/web3/explorer/xlayer-test' },
  },
  testnet: true,
};

const { chains, publicClient } = configureChains(
  [xlayerTestnet],
  [publicProvider()]
);

const config = createConfig({
  autoConnect: false, // Disable autoConnect to prevent connection issues
  connectors: [
    new InjectedConnector({ 
      chains,
      options: {
        shimDisconnect: true, // Keep connection state even if wallet disconnects
      }
    }),
    new MetaMaskConnector({ 
      chains,
      options: {
        shimDisconnect: true,
      }
    }),
    new WalletConnectConnector({ 
      chains, 
      options: { 
        projectId: 'c4f79cc821944d9680842e34466bfbd9',
        showQrModal: true,
      } 
    }),
  ],
  publicClient,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiConfig>
  );
} 