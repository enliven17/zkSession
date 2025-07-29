import axios from 'axios'
import CryptoJS from 'crypto-js'

// OKX DEX API Configuration
const OKX_DEX_API_BASE = 'https://web3.okx.com/api/v5/dex/aggregator'
const OKX_API_KEY = process.env.NEXT_PUBLIC_OKX_API_KEY
const OKX_SECRET_KEY = process.env.NEXT_PUBLIC_OKX_SECRET_KEY
const OKX_PASSPHRASE = process.env.NEXT_PUBLIC_OKX_PASSPHRASE

// Validate environment variables
if (!OKX_API_KEY || !OKX_SECRET_KEY || !OKX_PASSPHRASE) {
  console.error('Missing OKX API configuration. Please check your .env.local file.')
}

// Types
export interface SwapRequest {
  chainIndex: string
  amount: string
  swapMode: 'exactIn' | 'exactOut'
  fromTokenAddress: string
  toTokenAddress: string
  slippage: string
  userWalletAddress: string
  swapReceiverAddress?: string
  gasLevel?: 'slow' | 'average' | 'fast'
}

export interface SwapResponse {
  success: boolean
  tx?: any
  routerResult?: any
  message?: string
}

export interface TokenInfo {
  symbol: string
  address: string
  decimals: number
  price?: string
}

// Token addresses for XLayer mainnet (OKX DEX supported)
export const TOKENS: { [key: string]: TokenInfo } = {
  'ETH': {
    symbol: 'ETH',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    decimals: 18
  },
  'USDT': {
    symbol: 'USDT',
    address: '0x1c17e32e23437d63e2f91fd546a000f261e0b8fd', // XLayer mainnet USDT
    decimals: 6
  },
  'USDC': {
    symbol: 'USDC',
    address: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff', // XLayer mainnet USDC
    decimals: 6
  },
  'WBTC': {
    symbol: 'WBTC',
    address: '0x9a5b2c5054c3e9c43864736a3cd11a3042aa6c38', // XLayer mainnet WBTC
    decimals: 8
  }
}

// Generate zkProof for XLayer (mock implementation)
export const generateXLayerProof = async (data: any): Promise<string> => {
  const proofData = {
    timestamp: Date.now(),
    data: data,
    layer: 'xlayer',
    proof: 'mock_zk_proof_' + Math.random().toString(36).substring(7)
  }
  return Buffer.from(JSON.stringify(proofData)).toString('base64')
}

// Create signature for OKX API
export const createSignature = async (
  timestamp: string,
  method: string,
  requestPath: string,
  body: string = ''
): Promise<string> => {
  if (!OKX_SECRET_KEY) {
    throw new Error('OKX_SECRET_KEY is not configured')
  }
  
  // OKX API signature format: timestamp + method + requestPath + body
  const message = timestamp + method + requestPath + body;
  const signature = CryptoJS.HmacSHA256(message, OKX_SECRET_KEY).toString(CryptoJS.enc.Base64);
  console.log('[OKX SIGNATURE DEBUG]', { timestamp, method, requestPath, body, message, signature });
  return signature;
};

// Get swap quote from OKX DEX
export const getSwapQuote = async (request: SwapRequest): Promise<SwapResponse> => {
  try {
    console.log('Getting OKX DEX quote for request:', request)
    
    const timestamp = new Date().toISOString()
    const queryParams = new URLSearchParams({
      chainIndex: request.chainIndex,
      chainId: request.chainIndex, // OKX API requires both chainIndex and chainId
      amount: request.amount,
      swapMode: request.swapMode,
      fromTokenAddress: request.fromTokenAddress,
      toTokenAddress: request.toTokenAddress,
      slippage: request.slippage,
      userWalletAddress: request.userWalletAddress,
      ...(request.swapReceiverAddress && { swapReceiverAddress: request.swapReceiverAddress }),
      ...(request.gasLevel && { gasLevel: request.gasLevel })
    })

    // Use full API path for requestPath (OKX expects /api/v5/dex/aggregator/quote?...)
    const requestPath = `/api/v5/dex/aggregator/quote?${queryParams.toString()}`;
    const signature = await createSignature(timestamp, 'GET', requestPath)

    console.log('Making OKX DEX API request:', {
      url: `${OKX_DEX_API_BASE}${requestPath}`,
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'OK-ACCESS-TIMESTAMP': timestamp
      }
    })

    const response = await axios.get(`${OKX_DEX_API_BASE}${requestPath}`, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'OK-ACCESS-TIMESTAMP': timestamp
      }
    })

    console.log('OKX DEX API response:', response.data)

    if (response.data.code === '0') {
      const quoteData = response.data.data[0]
      return {
        success: true,
        tx: quoteData,
        routerResult: quoteData,
        message: `Quote received: ${quoteData.toTokenAmount} ${quoteData.toToken?.tokenSymbol} for ${quoteData.fromTokenAmount} ${quoteData.fromToken?.tokenSymbol}`
      }
    } else {
      return {
        success: false,
        message: response.data.msg || 'Failed to get quote'
      }
    }
  } catch (error: any) {
    console.error('OKX DEX quote error:', error)
    console.error('Error response:', error.response?.data)
    
    // If we get 401, it's likely due to missing secret key
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Authentication failed. OKX API key is valid but secret key is required for signature generation.'
      }
    }
    
    return {
      success: false,
      message: error.response?.data?.msg || error.message || 'Failed to get swap quote'
    }
  }
}

// Execute swap on OKX DEX
export const executeSwap = async (request: SwapRequest): Promise<SwapResponse> => {
  try {
    // First get the quote
    const quote = await getSwapQuote(request)
    
    if (!quote.success) {
      return quote
    }

    // In a real implementation, you would:
    // 1. Use the tx data from quote to create a transaction
    // 2. Sign the transaction with the user's wallet
    // 3. Broadcast the transaction to the blockchain
    
    // For now, we'll return the quote data as if the swap was executed
    return {
      success: true,
      tx: quote.tx,
      routerResult: quote.routerResult,
      message: 'Swap executed successfully (mock)'
    }
  } catch (error) {
    console.error('Swap execution error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Swap execution failed'
    }
  }
}

// Legacy trade execution function for compatibility
export interface TradeRequest {
  user: string
  amount: number
  symbol: string
  side: 'buy' | 'sell'
  sessionKey: string
}

export interface TradeResponse {
  orderId: string
  status: string
  filledSize: string
  avgPrice: string
}

// Execute trade on OKX (legacy function)
export async function executeTrade(tradeRequest: TradeRequest): Promise<TradeResponse> {
  try {
    // Convert legacy trade request to swap request
    const fromToken = tradeRequest.side === 'buy' ? 'USDT' : tradeRequest.symbol
    const toToken = tradeRequest.side === 'buy' ? tradeRequest.symbol : 'USDT'
    
    const swapRequest: SwapRequest = {
      chainIndex: '1', // Ethereum mainnet
      amount: (tradeRequest.amount * Math.pow(10, TOKENS[fromToken]?.decimals || 18)).toString(),
      swapMode: 'exactIn',
      fromTokenAddress: TOKENS[fromToken]?.address || TOKENS.ETH.address,
      toTokenAddress: TOKENS[toToken]?.address || TOKENS.USDT.address,
      slippage: '0.05', // 5% slippage
      userWalletAddress: tradeRequest.user,
      gasLevel: 'average'
    }

    const swapResult = await executeSwap(swapRequest)
    
    if (swapResult.success) {
      return {
        orderId: swapResult.tx?.data?.slice(0, 10) || 'mock_order_id',
        status: 'filled',
        filledSize: tradeRequest.amount.toString(),
        avgPrice: swapResult.routerResult?.toTokenAmount || '0'
      }
    } else {
      throw new Error(swapResult.message || 'Trade execution failed')
    }
  } catch (error: any) {
    console.error('Trade execution error:', error)
    throw new Error(error.message || 'Trade execution failed')
  }
}

// Get supported tokens
export const getSupportedTokens = async (chainIndex: string): Promise<TokenInfo[]> => {
  try {
    const timestamp = new Date().toISOString()
    const signature = await createSignature(timestamp, 'GET', `/tokens?chainIndex=${chainIndex}`)

    const response = await axios.get(`${OKX_DEX_API_BASE}/tokens?chainIndex=${chainIndex}`, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'OK-ACCESS-TIMESTAMP': timestamp
      }
    })

    if (response.data.code === '0') {
      return response.data.data || []
    } else {
      console.error('Failed to get tokens:', response.data.msg)
      return Object.values(TOKENS) // Fallback to common tokens
    }
  } catch (error) {
    console.error('Token fetch error:', error)
    return Object.values(TOKENS) // Fallback to common tokens
  }
}

// Get account balance (legacy function for compatibility)
export async function getAccountBalance(): Promise<any> {
  try {
    const timestamp = new Date().toISOString()
    const signature = await createSignature(timestamp, 'GET', '/account/balance')

    const response = await axios.get(`https://www.okx.com/api/v5/account/balance`, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'OK-ACCESS-TIMESTAMP': timestamp
      }
    })
    return response.data
  } catch (error: any) {
    console.error('Balance fetch error:', error)
    throw new Error(error.response?.data?.msg || error.message || 'Failed to fetch balance')
  }
}

// Get market data (legacy function for compatibility)
export async function getMarketData(symbol: string): Promise<any> {
  try {
    const response = await axios.get(`https://www.okx.com/api/v5/market/ticker?instId=${symbol}`)
    return response.data
  } catch (error: any) {
    console.error('Market data fetch error:', error)
    throw new Error(error.response?.data?.msg || error.message || 'Failed to fetch market data')
  }
} 

// Test function to check supported tokens on XLayer
export const testXLayerTokens = async () => {
  try {
    console.log('Testing XLayer token combinations...')
    
    // Test different token combinations
    const testCases = [
      {
        name: 'ETH to USDT',
        fromToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        toToken: '0x1c17e32e23437d63e2f91fd546a000f261e0b8fd',
        amount: '1000000000000000000' // 1 ETH in wei
      },
      {
        name: 'USDT to ETH',
        fromToken: '0x1c17e32e23437d63e2f91fd546a000f261e0b8fd',
        toToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        amount: '1000000' // 1 USDT (6 decimals)
      },
      {
        name: 'ETH to USDC',
        fromToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        toToken: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff',
        amount: '1000000000000000000' // 1 ETH in wei
      }
    ]
    
    const results = []
    
    for (const testCase of testCases) {
      try {
        const timestamp = new Date().toISOString()
        const queryParams = new URLSearchParams({
          chainIndex: '196',
          chainId: '196',
          amount: testCase.amount,
          swapMode: 'exactIn',
          fromTokenAddress: testCase.fromToken,
          toTokenAddress: testCase.toToken,
          slippage: '0.05',
          userWalletAddress: '0x71197e7a1CA5A2cb2AD82432B924F69B1E3dB123'
        })
        
        const requestPath = `/api/v5/dex/aggregator/quote?${queryParams.toString()}`
        const signature = await createSignature(timestamp, 'GET', requestPath)
        
        const response = await axios.get(`${OKX_DEX_API_BASE}/quote?${queryParams.toString()}`, {
          headers: {
            'OK-ACCESS-KEY': OKX_API_KEY,
            'OK-ACCESS-SIGN': signature,
            'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
            'OK-ACCESS-TIMESTAMP': timestamp
          }
        })
        
        results.push({
          testCase: testCase.name,
          success: true,
          data: response.data
        })
        
        console.log(`✅ ${testCase.name} - SUCCESS:`, response.data)
      } catch (error: any) {
        results.push({
          testCase: testCase.name,
          success: false,
          error: error.response?.data || error.message
        })
        
        console.log(`❌ ${testCase.name} - FAILED:`, error.response?.data || error.message)
      }
    }
    
    console.log('XLayer token test results:', results)
    return results
  } catch (error) {
    console.error('XLayer tokens test error:', error)
    return null
  }
} 