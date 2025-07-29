import axios from 'axios'

// OKX DEX API Configuration
const OKX_DEX_API_BASE = 'https://web3.okx.com/api/v5/dex/aggregator'
const OKX_API_KEY = process.env.NEXT_PUBLIC_OKX_API_KEY || ''
const OKX_SECRET_KEY = process.env.NEXT_PUBLIC_OKX_SECRET_KEY || ''
const OKX_PASSPHRASE = process.env.NEXT_PUBLIC_OKX_PASSPHRASE || ''

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

// Token addresses for common tokens (Ethereum mainnet)
export const TOKENS: { [key: string]: TokenInfo } = {
  'ETH': {
    symbol: 'ETH',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    decimals: 18
  },
  'USDT': {
    symbol: 'USDT',
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6
  },
  'USDC': {
    symbol: 'USDC',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6
  },
  'WBTC': {
    symbol: 'WBTC',
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
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
export const createSignature = async (timestamp: string, method: string, requestPath: string, body: string = ''): Promise<string> => {
  const message = timestamp + method + requestPath + body
  // In production, this would use the actual secret key to create HMAC signature
  const signatureData = {
    message: message,
    timestamp: timestamp,
    signature: 'mock_signature_' + Math.random().toString(36).substring(7)
  }
  return Buffer.from(JSON.stringify(signatureData)).toString('base64')
}

// Get swap quote from OKX DEX
export const getSwapQuote = async (request: SwapRequest): Promise<SwapResponse> => {
  try {
    const timestamp = new Date().toISOString()
    const queryParams = new URLSearchParams({
      chainIndex: request.chainIndex,
      amount: request.amount,
      swapMode: request.swapMode,
      fromTokenAddress: request.fromTokenAddress,
      toTokenAddress: request.toTokenAddress,
      slippage: request.slippage,
      userWalletAddress: request.userWalletAddress,
      ...(request.swapReceiverAddress && { swapReceiverAddress: request.swapReceiverAddress }),
      ...(request.gasLevel && { gasLevel: request.gasLevel })
    })

    const signature = await createSignature(timestamp, 'GET', `/swap?${queryParams.toString()}`)

    const response = await axios.get(`${OKX_DEX_API_BASE}/swap?${queryParams.toString()}`, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'X-Layer-Proof': await generateXLayerProof(request)
      }
    })

    if (response.data.code === '0') {
      return {
        success: true,
        tx: response.data.data[0]?.tx,
        routerResult: response.data.data[0]?.routerResult,
        message: 'Quote received successfully'
      }
    } else {
      return {
        success: false,
        message: response.data.msg || 'Failed to get quote'
      }
    }
  } catch (error) {
    console.error('Swap quote error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get swap quote'
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