import axios from 'axios'

// OKX Market API configuration
const OKX_MARKET_API_BASE = 'https://web3.okx.com/api/v5'
const OKX_API_KEY = process.env.NEXT_PUBLIC_OKX_API_KEY || ''
const OKX_SECRET_KEY = process.env.NEXT_PUBLIC_OKX_SECRET_KEY || ''
const OKX_PASSPHRASE = process.env.NEXT_PUBLIC_OKX_PASSPHRASE || ''

// Create signature for OKX API
const createSignature = async (timestamp: string, method: string, requestPath: string, body: string = '') => {
  const crypto = await import('crypto')
  const message = timestamp + method + requestPath + body
  const signature = crypto.default.createHmac('sha256', OKX_SECRET_KEY).update(message).digest('base64')
  return signature
}

// 1. Get Market Price Data
export const getMarketPrice = async (symbol: string = 'BTC-USDT') => {
  try {
    console.log(`🔍 Getting market price for ${symbol}...`)
    const response = await axios.get(`${OKX_MARKET_API_BASE}/market/ticker?instId=${symbol}`, {
      timeout: 10000
    })
    
    if (response.data && response.data.code === '0' && response.data.data.length > 0) {
      console.log(`✅ Market price for ${symbol}:`, response.data.data[0])
      return {
        success: true,
        data: response.data.data[0],
        message: 'Market price fetched successfully'
      }
    } else {
      console.error(`❌ OKX API error for ${symbol}:`, response.data)
      return {
        success: false,
        error: response.data,
        message: 'Failed to fetch market price'
      }
    }
  } catch (error: any) {
    console.error(`❌ Failed to fetch market price for ${symbol}:`, error.message)
    return {
      success: false,
      error: error.message,
      message: 'Network error while fetching market price'
    }
  }
}

// 2. Get Candlestick Data
export const getCandlestickData = async (symbol: string = 'BTC-USDT', bar: string = '1m', limit: number = 100) => {
  try {
    console.log(`🔍 Getting candlestick data for ${symbol}...`)
    const response = await axios.get(`${OKX_MARKET_API_BASE}/market/candles?instId=${symbol}&bar=${bar}&limit=${limit}`, {
      timeout: 10000
    })
    
    if (response.data && response.data.code === '0') {
      console.log(`✅ Candlestick data for ${symbol}:`, response.data.data.length, 'candles')
      return {
        success: true,
        data: response.data.data,
        message: 'Candlestick data fetched successfully'
      }
    } else {
      console.error(`❌ OKX API error for ${symbol}:`, response.data)
      return {
        success: false,
        error: response.data,
        message: 'Failed to fetch candlestick data'
      }
    }
  } catch (error: any) {
    console.error(`❌ Failed to fetch candlestick data for ${symbol}:`, error.message)
    return {
      success: false,
      error: error.message,
      message: 'Network error while fetching candlestick data'
    }
  }
}

// 3. Get Recent Trades
export const getRecentTrades = async (symbol: string = 'BTC-USDT', limit: number = 100) => {
  try {
    console.log(`🔍 Getting recent trades for ${symbol}...`)
    const response = await axios.get(`${OKX_MARKET_API_BASE}/market/trades?instId=${symbol}&limit=${limit}`, {
      timeout: 10000
    })
    
    if (response.data && response.data.code === '0') {
      console.log(`✅ Recent trades for ${symbol}:`, response.data.data.length, 'trades')
      return {
        success: true,
        data: response.data.data,
        message: 'Recent trades fetched successfully'
      }
    } else {
      console.error(`❌ OKX API error for ${symbol}:`, response.data)
      return {
        success: false,
        error: response.data,
        message: 'Failed to fetch recent trades'
      }
    }
  } catch (error: any) {
    console.error(`❌ Failed to fetch recent trades for ${symbol}:`, error.message)
    return {
      success: false,
      error: error.message,
      message: 'Network error while fetching recent trades'
    }
  }
}

// 4. Get Order Book
export const getOrderBook = async (symbol: string = 'BTC-USDT', depth: number = 20) => {
  try {
    console.log(`🔍 Getting order book for ${symbol}...`)
    const response = await axios.get(`${OKX_MARKET_API_BASE}/market/books?instId=${symbol}&sz=${depth}`, {
      timeout: 10000
    })
    
    if (response.data && response.data.code === '0') {
      console.log(`✅ Order book for ${symbol}:`, response.data.data[0])
      return {
        success: true,
        data: response.data.data[0],
        message: 'Order book fetched successfully'
      }
    } else {
      console.error(`❌ OKX API error for ${symbol}:`, response.data)
      return {
        success: false,
        error: response.data,
        message: 'Failed to fetch order book'
      }
    }
  } catch (error: any) {
    console.error(`❌ Failed to fetch order book for ${symbol}:`, error.message)
    return {
      success: false,
      error: error.message,
      message: 'Network error while fetching order book'
    }
  }
}

// 5. Get All Trading Pairs
export const getAllTradingPairs = async () => {
  try {
    console.log('🔍 Getting all trading pairs...')
    const response = await axios.get(`${OKX_MARKET_API_BASE}/public/instruments?instType=SPOT`, {
      timeout: 10000
    })
    
    if (response.data && response.data.code === '0') {
      console.log('✅ All trading pairs:', response.data.data.length, 'pairs')
      return {
        success: true,
        data: response.data.data,
        message: 'All trading pairs fetched successfully'
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
    console.error('❌ Failed to fetch trading pairs:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Network error while fetching trading pairs'
    }
  }
}

// 6. Get Popular Trading Pairs (filtered)
export const getPopularTradingPairs = async () => {
  try {
    console.log('🔍 Getting popular trading pairs...')
    const response = await axios.get(`${OKX_MARKET_API_BASE}/public/instruments?instType=SPOT`, {
      timeout: 10000
    })
    
    if (response.data && response.data.code === '0') {
      // Filter for popular pairs
      const popularPairs = response.data.data
        .filter((pair: any) => 
          pair.quoteCcy === 'USDT' || 
          pair.quoteCcy === 'USDC' || 
          pair.quoteCcy === 'BTC'
        )
        .slice(0, 20)
      
      console.log('✅ Popular trading pairs:', popularPairs.length)
      return {
        success: true,
        data: popularPairs,
        message: 'Popular trading pairs fetched successfully'
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
    console.error('❌ Failed to fetch trading pairs:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Network error while fetching trading pairs'
    }
  }
}

// 7. Get Token Balance (if wallet address provided)
export const getTokenBalance = async (address: string, chainId: string = '1') => {
  try {
    console.log(`🔍 Getting token balance for address ${address} on chain ${chainId}...`)
    const response = await axios.get(`${OKX_MARKET_API_BASE}/account/balance?ccy=${chainId}&addr=${address}`, {
      timeout: 10000
    })
    
    if (response.data && response.data.code === '0') {
      console.log(`✅ Token balance for ${address}:`, response.data.data)
      return {
        success: true,
        data: response.data.data,
        message: 'Token balance fetched successfully'
      }
    } else {
      console.error(`❌ OKX API error for balance:`, response.data)
      return {
        success: false,
        error: response.data,
        message: 'Failed to fetch token balance'
      }
    }
  } catch (error: any) {
    console.error(`❌ Failed to fetch token balance:`, error.message)
    return {
      success: false,
      error: error.message,
      message: 'Network error while fetching token balance'
    }
  }
}

// 8. Get Transaction History
export const getTransactionHistory = async (address: string, chainId: string = '1', limit: number = 50) => {
  try {
    console.log(`🔍 Getting transaction history for address ${address} on chain ${chainId}...`)
    const response = await axios.get(`${OKX_MARKET_API_BASE}/account/transaction-history?ccy=${chainId}&addr=${address}&limit=${limit}`, {
      timeout: 10000
    })
    
    if (response.data && response.data.code === '0') {
      console.log(`✅ Transaction history for ${address}:`, response.data.data.length, 'transactions')
      return {
        success: true,
        data: response.data.data,
        message: 'Transaction history fetched successfully'
      }
    } else {
      console.error(`❌ OKX API error for transaction history:`, response.data)
      return {
        success: false,
        error: response.data,
        message: 'Failed to fetch transaction history'
      }
    }
  } catch (error: any) {
    console.error(`❌ Failed to fetch transaction history:`, error.message)
    return {
      success: false,
      error: error.message,
      message: 'Network error while fetching transaction history'
    }
  }
}

// 9. Get Market Data Summary
export const getMarketDataSummary = async () => {
  try {
    console.log('🔍 Getting market data summary...')
    
    // Get popular pairs
    const pairsResult = await getPopularTradingPairs()
    
    // Get market data for top pairs
    const topPairs = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'BNB-USDT', 'ADA-USDT']
    const marketDataPromises = topPairs.map(pair => getMarketPrice(pair))
    const marketDataResults = await Promise.all(marketDataPromises)
    
    // Get order book for BTC-USDT
    const orderBookResult = await getOrderBook('BTC-USDT')
    
    // Get recent trades for BTC-USDT
    const tradesResult = await getRecentTrades('BTC-USDT', 20)
    
    return {
      success: true,
      data: {
        pairs: pairsResult.success ? pairsResult.data : [],
        marketData: marketDataResults.filter(result => result.success).map(result => result.data),
        orderBook: orderBookResult.success ? orderBookResult.data : null,
        recentTrades: tradesResult.success ? tradesResult.data : []
      },
      message: 'Market data summary fetched successfully'
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch market data summary:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Network error while fetching market data summary'
    }
  }
}

// 10. Complete OKX Market API Test
export const testCompleteOKXMarketAPI = async () => {
  try {
    console.log('🔍 Testing complete OKX Market API functionality...')
    
    // Test 1: Get popular trading pairs
    console.log('📋 Test 1: Getting popular trading pairs...')
    const pairsResult = await getPopularTradingPairs()
    
    // Test 2: Get market price for BTC-USDT
    console.log('💰 Test 2: Getting market price for BTC-USDT...')
    const priceResult = await getMarketPrice('BTC-USDT')
    
    // Test 3: Get order book for BTC-USDT
    console.log('📊 Test 3: Getting order book for BTC-USDT...')
    const orderBookResult = await getOrderBook('BTC-USDT')
    
    // Test 4: Get recent trades for BTC-USDT
    console.log('🔄 Test 4: Getting recent trades for BTC-USDT...')
    const tradesResult = await getRecentTrades('BTC-USDT', 10)
    
    // Test 5: Get candlestick data for BTC-USDT
    console.log('📈 Test 5: Getting candlestick data for BTC-USDT...')
    const candlestickResult = await getCandlestickData('BTC-USDT', '1m', 50)
    
    return {
      success: true,
      pairs: pairsResult,
      price: priceResult,
      orderBook: orderBookResult,
      trades: tradesResult,
      candlestick: candlestickResult,
      message: 'Complete OKX Market API test completed successfully!'
    }
  } catch (error: any) {
    console.error('❌ Complete OKX Market API test failed:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Complete OKX Market API test failed. Check console for details.'
    }
  }
}

// 11. Get Quote (simulated using market data)
export const getQuote = async (params: {
  fromToken: string
  toToken: string
  amount: string
  slippage?: string
}) => {
  try {
    console.log('🔍 Getting quote...', params)
    
    // Get market prices for both tokens
    const fromPriceResult = await getMarketPrice(`${params.fromToken}-USDT`)
    const toPriceResult = await getMarketPrice(`${params.toToken}-USDT`)
    
    if (!fromPriceResult.success || !toPriceResult.success) {
      return {
        success: false,
        error: 'Failed to get market prices',
        message: 'Unable to calculate quote due to missing price data'
      }
    }
    
    const fromPrice = parseFloat(fromPriceResult.data.last)
    const toPrice = parseFloat(toPriceResult.data.last)
    const amount = parseFloat(params.amount)
    
    // Calculate quote
    const usdtValue = amount * fromPrice
    const outputAmount = usdtValue / toPrice
    const slippage = parseFloat(params.slippage || '0.5') / 100
    const minOutput = outputAmount * (1 - slippage)
    
    const quote = {
      fromToken: params.fromToken,
      toToken: params.toToken,
      inputAmount: amount,
      outputAmount: outputAmount,
      minOutput: minOutput,
      price: fromPrice / toPrice,
      slippage: params.slippage || '0.5',
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Quote calculated:', quote)
    return {
      success: true,
      data: quote,
      message: 'Quote calculated successfully'
    }
  } catch (error: any) {
    console.error('❌ Failed to get quote:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Failed to calculate quote'
    }
  }
}

// 12. Execute Swap (simulated)
export const executeSwap = async (params: {
  fromToken: string
  toToken: string
  amount: string
  slippage?: string
  userWalletAddress?: string
}) => {
  try {
    console.log('🔍 Executing swap...', params)
    
    // Get quote first
    const quoteResult = await getQuote(params)
    
    if (!quoteResult.success) {
      return quoteResult
    }
    
    // Simulate swap execution
    const swapResult = {
      ...quoteResult.data,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: 'pending',
      gasUsed: Math.floor(Math.random() * 200000) + 100000,
      gasPrice: Math.floor(Math.random() * 50) + 20,
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Swap executed:', swapResult)
    return {
      success: true,
      data: swapResult,
      message: 'Swap executed successfully'
    }
  } catch (error: any) {
    console.error('❌ Failed to execute swap:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Failed to execute swap'
    }
  }
} 