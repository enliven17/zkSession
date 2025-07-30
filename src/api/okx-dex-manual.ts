import axios from 'axios'

// OKX DEX API configuration
const OKX_DEX_API_BASE = 'https://web3.okx.com'
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

// Get supported chains
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
    
    console.log('✅ Supported chains:', response.data)
    return {
      success: true,
      data: response.data,
      message: 'Supported chains fetched successfully'
    }
  } catch (error: any) {
    console.error('❌ Failed to get supported chains:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to get supported chains'
    }
  }
}

// Get tokens for a chain
export const getTokensForChain = async (chainIndex: string) => {
  try {
    console.log(`🔍 Getting tokens for chain ${chainIndex}...`)
    const timestamp = new Date().toISOString()
    const requestPath = `/aggregator/all-tokens?chainIndex=${chainIndex}`
    const signature = await createSignature(timestamp, 'GET', requestPath)
    
    const response = await axios.get(`${OKX_DEX_API_BASE}${requestPath}`, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'OK-ACCESS-TIMESTAMP': timestamp
      }
    })
    
    console.log(`✅ Tokens for chain ${chainIndex}:`, response.data)
    return {
      success: true,
      data: response.data,
      message: 'Tokens fetched successfully'
    }
  } catch (error: any) {
    console.error(`❌ Failed to get tokens for chain ${chainIndex}:`, error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to get tokens'
    }
  }
}

// Get quote
export const getQuote = async (params: {
  chainIndex: string
  fromTokenAddress: string
  toTokenAddress: string
  amount: string
  slippage?: string
}) => {
  try {
    console.log('🔍 Getting quote...', params)
    const timestamp = new Date().toISOString()
    const queryParams = new URLSearchParams({
      chainIndex: params.chainIndex,
      fromTokenAddress: params.fromTokenAddress,
      toTokenAddress: params.toTokenAddress,
      amount: params.amount,
      slippage: params.slippage || '0.5'
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
    
    console.log('✅ Quote received:', response.data)
    return {
      success: true,
      data: response.data,
      message: 'Quote fetched successfully'
    }
  } catch (error: any) {
    console.error('❌ Failed to get quote:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to get quote'
    }
  }
}

// Execute swap
export const executeSwap = async (params: {
  chainIndex: string
  fromTokenAddress: string
  toTokenAddress: string
  amount: string
  slippage?: string
  userWalletAddress: string
}) => {
  try {
    console.log('🔍 Executing swap...', params)
    const timestamp = new Date().toISOString()
    const body = JSON.stringify({
      chainIndex: params.chainIndex,
      fromTokenAddress: params.fromTokenAddress,
      toTokenAddress: params.toTokenAddress,
      amount: params.amount,
      slippage: params.slippage || '0.5',
      userWalletAddress: params.userWalletAddress
    })
    const requestPath = '/swap'
    const signature = await createSignature(timestamp, 'POST', requestPath, body)
    
    const response = await axios.post(`${OKX_DEX_API_BASE}${requestPath}`, body, {
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('✅ Swap executed:', response.data)
    return {
      success: true,
      data: response.data,
      message: 'Swap executed successfully'
    }
  } catch (error: any) {
    console.error('❌ Failed to execute swap:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to execute swap'
    }
  }
}

// Test OKX DEX API functionality
export const testOKXDEXAPI = async () => {
  try {
    console.log('🔍 Testing OKX DEX API functionality...')
    
    // Test 1: Get supported chains
    console.log('📋 Test 1: Getting supported chains...')
    const chainsResult = await getSupportedChains()
    
    // Test 2: Get tokens for Ethereum (chain 1)
    console.log('🪙 Test 2: Getting tokens for Ethereum...')
    const tokensResult = await getTokensForChain('1')
    
    // Test 3: Get quote for ETH to USDC
    console.log('💱 Test 3: Getting quote for ETH to USDC...')
    const quoteResult = await getQuote({
      chainIndex: '1',
      fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
      toTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      amount: '1000000000000000000', // 1 ETH
      slippage: '0.5'
    })
    
    return {
      success: true,
      chains: chainsResult,
      tokens: tokensResult,
      quote: quoteResult,
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