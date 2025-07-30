import axios from 'axios'
import CryptoJS from 'crypto-js'

// OKX DEX API Configuration
const OKX_DEX_API_BASE = 'https://web3.okx.com'
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
  userWalletAddress?: string
  swapReceiverAddress?: string
  gasLevel?: 'slow' | 'average' | 'fast'
  priceImpactProtectionPercentage?: string
  feePercent?: string
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

// Token addresses for XLayer (both testnet and mainnet)
export const TOKENS: { [key: string]: TokenInfo } = {
  'ETH': {
    symbol: 'ETH',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    decimals: 18
  },
  'USDT': {
    symbol: 'USDT',
    address: '0x1c17e32e23437d63e2f91fd546a000f261e0b8fd', // XLayer testnet USDT
    decimals: 6
  },
  'USDC': {
    symbol: 'USDC',
    address: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff', // XLayer testnet USDC
    decimals: 6
  },
  'WBTC': {
    symbol: 'WBTC',
    address: '0x9a5b2c5054c3e9c43864736a3cd11a3042aa6c38', // XLayer testnet WBTC
    decimals: 8
  },
  'BTC': {
    symbol: 'BTC',
    address: '0x9a5b2c5054c3e9c43864736a3cd11a3042aa6c38', // XLayer testnet WBTC (same as BTC)
    decimals: 8
  },
  'OKB': {
    symbol: 'OKB',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // XLayer native token
    decimals: 18
  }
}

// XLayer Mainnet Token Addresses
export const XLAYER_MAINNET_TOKENS: { [key: string]: TokenInfo } = {
  'USDT': {
    symbol: 'USDT',
    address: '0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3', // XLayer mainnet USDT
    decimals: 6
  },
  'USDC': {
    symbol: 'USDC',
    address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', // XLayer mainnet USDC
    decimals: 6
  },
  'WBTC': {
    symbol: 'WBTC',
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // XLayer mainnet WBTC
    decimals: 8
  },
  'BTC': {
    symbol: 'BTC',
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // XLayer mainnet WBTC (same as BTC)
    decimals: 8
  },
  'OKB': {
    symbol: 'OKB',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // XLayer mainnet native token
    decimals: 18
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
      ...(request.userWalletAddress && { userWalletAddress: request.userWalletAddress }),
      ...(request.swapReceiverAddress && { swapReceiverAddress: request.swapReceiverAddress }),
      ...(request.gasLevel && { gasLevel: request.gasLevel }),
      ...(request.priceImpactProtectionPercentage && { priceImpactProtectionPercentage: request.priceImpactProtectionPercentage }),
      ...(request.feePercent && { feePercent: request.feePercent })
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
      userWalletAddress: tradeRequest.user,
      gasLevel: 'average',
      priceImpactProtectionPercentage: '0.25'
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

// Get trading pairs from OKX general API
export const getOKXTradingPairs = async () => {
  try {
    console.log('🔍 Fetching trading pairs from OKX API...')
    const response = await axios.get('https://www.okx.com/api/v5/public/instruments?instType=SPOT', {
      timeout: 10000
    })
    
    if (response.data && response.data.code === '0') {
      console.log('✅ OKX trading pairs fetched successfully')
      return {
        success: true,
        data: response.data.data,
        message: 'Trading pairs fetched successfully'
      }
    } else {
      console.error('❌ OKX API error:', response.data)
      return {
        success: false,
        error: response.data,
        message: 'Failed to fetch trading pairs'
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch OKX trading pairs:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Network error while fetching trading pairs'
    }
  }
}

// Get price for a specific trading pair
export const getOKXTradingPairPrice = async (pair: string) => {
  try {
    console.log(`🔍 Fetching price for ${pair}...`)
    const response = await axios.get(`https://www.okx.com/api/v5/market/ticker?instId=${pair}`, {
      timeout: 10000
    })
    
    if (response.data && response.data.code === '0' && response.data.data.length > 0) {
      console.log(`✅ Price for ${pair} fetched successfully`)
      return {
        success: true,
        data: response.data.data[0],
        message: 'Price fetched successfully'
      }
    } else {
      console.error(`❌ OKX API error for ${pair}:`, response.data)
      return {
        success: false,
        error: response.data,
        message: 'Failed to fetch price'
      }
    }
  } catch (error: any) {
    console.error(`❌ Failed to fetch price for ${pair}:`, error.message)
    return {
      success: false,
      error: error.message,
      message: 'Network error while fetching price'
    }
  }
}

// Simulate a quote using OKX general API
export const getSimulatedQuote = async (fromToken: string, toToken: string, amount: string) => {
  try {
    console.log(`🔍 Simulating quote for ${amount} ${fromToken} to ${toToken}...`)
    
    // Create trading pair symbol
    const pair = `${fromToken}-${toToken}`
    
    // Get current price
    const priceResult = await getOKXTradingPairPrice(pair)
    
    if (!priceResult.success) {
      return {
        success: false,
        message: `Failed to get price for ${pair}`
      }
    }
    
    const priceData = priceResult.data
    const currentPrice = parseFloat(priceData.last)
    const amountNum = parseFloat(amount)
    
    // Calculate quote
    const outputAmount = amountNum * currentPrice
    const priceImpact = 0.001 // 0.1% price impact
    const fee = outputAmount * 0.003 // 0.3% fee
    
    const finalOutput = outputAmount * (1 - priceImpact - fee)
    
    return {
      success: true,
      data: {
        fromToken,
        toToken,
        inputAmount: amount,
        outputAmount: finalOutput.toFixed(6),
        price: currentPrice,
        priceImpact: (priceImpact * 100).toFixed(2) + '%',
        fee: (fee / outputAmount * 100).toFixed(2) + '%',
        timestamp: new Date().toISOString()
      },
      message: 'Quote simulated successfully'
    }
  } catch (error: any) {
    console.error('❌ Failed to simulate quote:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Failed to simulate quote'
    }
  }
} 

// Get supported chains from OKX DEX API
export const getSupportedChains = async () => {
  try {
    console.log('🔍 Getting supported chains from OKX DEX API...')
    const timestamp = new Date().toISOString()
    const requestPath = '/supported/chain'
    const signature = await createSignature(timestamp, 'GET', requestPath)
    const response = await axios.get(`${OKX_DEX_API_BASE}${requestPath}`, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'OK-ACCESS-TIMESTAMP': timestamp
      }
    })
    console.log('✅ OKX DEX supported chains response:', response.data)
    
    // Check if XLayer mainnet (196) is in the supported chains
    if (response.data && response.data.data) {
      const xlayerMainnet = response.data.data.find((chain: any) => chain.chainId === '196' || chain.chainIndex === '196')
      console.log('🔍 XLayer Mainnet (196) support status:', xlayerMainnet ? '✓ Supported' : '✗ Not Supported')
      if (xlayerMainnet) {
        console.log('📋 XLayer Mainnet details:', xlayerMainnet)
      }
    }
    
    return response.data
  } catch (error: any) {
    console.error('❌ Failed to get supported chains:', error.response?.data || error.message)
    return null
  }
}

// Get all supported tokens from OKX DEX API
export const getAllSupportedTokens = async () => {
  try {
    console.log('🔍 Getting all supported tokens from OKX DEX API...')
    const timestamp = new Date().toISOString()
    const requestPath = '/aggregator/all-tokens'
    const signature = await createSignature(timestamp, 'GET', requestPath)
    const response = await axios.get(`${OKX_DEX_API_BASE}${requestPath}`, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'OK-ACCESS-TIMESTAMP': timestamp
      }
    })
    console.log('✅ OKX DEX all tokens response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Failed to get all tokens:', error.response?.data || error.message)
    return null
  }
}

// Get quote from OKX DEX API using correct endpoint
export const getDEXQuote = async (fromToken: string, toToken: string, amount: string, chainId: string = '1') => {
  try {
    console.log(`🔍 Getting DEX quote for ${amount} ${fromToken} to ${toToken} on chain ${chainId}...`)
    const timestamp = new Date().toISOString()
    
    const queryParams = new URLSearchParams({
      chainId: chainId,
      amount: amount,
      fromToken: fromToken,
      toToken: toToken,
      slippage: '0.5' // 0.5% slippage
    })
    
    const requestPath = `/quote?${queryParams.toString()}`
    const signature = await createSignature(timestamp, 'GET', requestPath)
    const response = await axios.get(`${OKX_DEX_API_BASE}${requestPath}`, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'OK-ACCESS-TIMESTAMP': timestamp
      }
    })
    console.log('✅ OKX DEX quote response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Failed to get DEX quote:', error.response?.data || error.message)
    return null
  }
}

// Get liquidity sources for a specific chain
export const getLiquiditySources = async (chainIndex: string) => {
  try {
    console.log(`🔍 Getting liquidity sources for chain ${chainIndex}...`)
    const timestamp = new Date().toISOString()
    const requestPath = `/api/v5/dex/aggregator/get-liquidity?chainIndex=${chainIndex}`
    const signature = await createSignature(timestamp, 'GET', requestPath)
    
    const response = await axios.get(`${OKX_DEX_API_BASE}${requestPath}`, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'OK-ACCESS-TIMESTAMP': timestamp
      }
    })
    
    console.log(`✅ Liquidity sources for chain ${chainIndex}:`, response.data)
    return response.data
  } catch (error: any) {
    console.error(`❌ Failed to get liquidity sources for chain ${chainIndex}:`, error.response?.data || error.message)
    return null
  }
}

// Test XLayer Mainnet specifically
export const testXLayerMainnetSupport = async () => {
  try {
    console.log('🔍 Testing XLayer Mainnet support specifically...')
    
    // Test 1: Get supported chains and check XLayer
    console.log('📋 Test 1: Checking if XLayer mainnet is supported...')
    const chainsResult = await getSupportedChains()
    
    // Test 2: Try to get tokens for XLayer mainnet
    console.log('🪙 Test 2: Getting tokens for XLayer mainnet...')
    const tokensResult = await getAllSupportedTokens()
    
    // Test 3: Get liquidity sources for XLayer mainnet
    console.log('💧 Test 3: Getting liquidity sources for XLayer mainnet...')
    const xlayerLiquidityResult = await getLiquiditySources('196')
    
    // Test 4: Try different quote approaches for XLayer mainnet
    console.log('💱 Test 4: Testing different quote approaches...')
    
    const quoteTests = [
      {
        name: 'OKB-USDT (Native)',
        fromToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        toToken: '0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3',
        amount: '100000000000000000' // 0.1 OKB
      },
      {
        name: 'OKB-USDC (Native)',
        fromToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        toToken: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
        amount: '100000000000000000' // 0.1 OKB
      },
      {
        name: 'WETH-USDT (Wrapped)',
        fromToken: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC as WETH proxy
        toToken: '0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3',
        amount: '100000000000000000' // 0.1 WETH
      }
    ]
    
    const quoteResults = []
    
    for (const test of quoteTests) {
      console.log(`🔍 Testing ${test.name}...`)
      try {
        const result = await getSwapQuote({
          chainIndex: '196',
          amount: test.amount,
          swapMode: 'exactIn',
          fromTokenAddress: test.fromToken,
          toTokenAddress: test.toToken
        })
        quoteResults.push({
          pair: test.name,
          success: result.success,
          message: result.message,
          data: result.tx
        })
      } catch (error: any) {
        quoteResults.push({
          pair: test.name,
          success: false,
          message: error.message
        })
      }
    }
    
    return {
      success: true,
      chains: chainsResult,
      tokens: tokensResult,
      xlayerLiquidity: xlayerLiquidityResult,
      quoteResults: quoteResults,
      message: 'XLayer Mainnet specific test completed!'
    }
  } catch (error: any) {
    console.error('❌ XLayer Mainnet test failed:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data || error.message,
      message: 'XLayer Mainnet test failed. Check console for details.'
    }
  }
}

// Test OKX DEX API connectivity with correct endpoints
export const testOKXDEXAPI = async () => {
  try {
    console.log('🔍 Testing OKX DEX API with correct endpoints...')
    
    // Test 1: Get supported chains
    console.log('📋 Test 1: Getting supported chains...')
    const chainsResult = await getSupportedChains()
    
    // Test 2: Get all tokens
    console.log('🪙 Test 2: Getting all tokens...')
    const tokensResult = await getAllSupportedTokens()
    
    // Test 3: Get liquidity sources for Ethereum mainnet
    console.log('💧 Test 3: Getting liquidity sources for Ethereum...')
    const ethereumLiquidityResult = await getLiquiditySources('1')
    
    // Test 4: Get liquidity sources for XLayer mainnet
    console.log('💧 Test 4: Getting liquidity sources for XLayer mainnet...')
    const xlayerLiquidityResult = await getLiquiditySources('196')
    
    // Test 5: Get quote for ETH to USDC on Ethereum mainnet
    console.log('💱 Test 5: Getting quote for ETH to USDC...')
    const quoteResult = await getDEXQuote('ETH', 'USDC', '1000000000000000000', '1') // 1 ETH
    
    // Test 6: Get quote for OKB to USDC on XLayer mainnet
    console.log('💱 Test 6: Getting quote for OKB to USDC on XLayer mainnet...')
    const xlayerQuoteResult = await getDEXQuote('OKB', 'USDC', '1000000000000000000', '196') // 1 OKB
    
    return {
      success: true,
      chains: chainsResult,
      tokens: tokensResult,
      ethereumLiquidity: ethereumLiquidityResult,
      xlayerLiquidity: xlayerLiquidityResult,
      quote: quoteResult,
      xlayerQuote: xlayerQuoteResult,
      message: 'All OKX DEX API tests completed successfully!'
    }
  } catch (error: any) {
    console.error('❌ OKX DEX API test failed:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data || error.message,
      message: 'OKX DEX API test failed. Check console for details.'
    }
  }
} 