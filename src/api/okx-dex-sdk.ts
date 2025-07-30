import { OKXDexClient } from '@okx-dex/okx-dex-sdk'

// OKX DEX SDK configuration
const OKX_API_KEY = process.env.NEXT_PUBLIC_OKX_API_KEY || ''
const OKX_SECRET_KEY = process.env.NEXT_PUBLIC_OKX_SECRET_KEY || ''
const OKX_PASSPHRASE = process.env.NEXT_PUBLIC_OKX_PASSPHRASE || ''

// Initialize OKX DEX Client
const initializeOKXDexClient = () => {
  try {
    const client = new OKXDexClient({
      apiKey: OKX_API_KEY,
      secretKey: OKX_SECRET_KEY,
      apiPassphrase: OKX_PASSPHRASE,
      projectId: 'test-project' // Required by SDK
    })
    return client
  } catch (error) {
    console.error('Failed to initialize OKX DEX client:', error)
    return null
  }
}

// 1. Get Quote using OKX DEX SDK
export const getQuote = async (params: {
  chainIndex: string
  fromTokenAddress: string
  toTokenAddress: string
  amount: string
  slippage?: string
  userWalletAddress?: string
}) => {
  try {
    console.log('🔍 Getting quote from OKX DEX SDK...', params)
    const client = initializeOKXDexClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Failed to initialize client',
        message: 'OKX DEX client initialization failed'
      }
    }

    // Use the correct SDK method as per documentation
    const response = await client.dex.getQuote({
      chainId: params.chainIndex,
      fromTokenAddress: params.fromTokenAddress,
      toTokenAddress: params.toTokenAddress,
      amount: params.amount,
      slippage: params.slippage || '0.5'
    })
    
    console.log('✅ Quote from SDK:', response)
    return {
      success: true,
      data: response,
      message: 'Quote fetched successfully from SDK'
    }
  } catch (error: any) {
    console.error('❌ Failed to get quote from SDK:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Failed to get quote from SDK'
    }
  }
}

// 2. Execute Swap using OKX DEX SDK
export const executeSwap = async (params: {
  chainIndex: string
  fromTokenAddress: string
  toTokenAddress: string
  amount: string
  slippage?: string
  userWalletAddress: string
  quoteId?: string
}) => {
  try {
    console.log('🔍 Executing swap via OKX DEX SDK...', params)
    const client = initializeOKXDexClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Failed to initialize client',
        message: 'OKX DEX client initialization failed'
      }
    }

    // Use the correct SDK method as per documentation
    const response = await client.dex.executeSwap({
      chainId: params.chainIndex,
      fromTokenAddress: params.fromTokenAddress,
      toTokenAddress: params.toTokenAddress,
      amount: params.amount,
      slippage: params.slippage || '0.5',
      userWalletAddress: params.userWalletAddress
    })
    
    console.log('✅ Swap executed via SDK:', response)
    return {
      success: true,
      data: response,
      message: 'Swap executed successfully via SDK'
    }
  } catch (error: any) {
    console.error('❌ Failed to execute swap via SDK:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Failed to execute swap via SDK'
    }
  }
}

// 3. Get Supported Chains
export const getSupportedChains = async () => {
  try {
    console.log('🔍 Getting supported chains from OKX DEX SDK...')
    const client = initializeOKXDexClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Failed to initialize client',
        message: 'OKX DEX client initialization failed'
      }
    }

    // Try to get supported chains - this method might not exist
    const response = await client.dex.getChains()
    console.log('✅ Supported chains from SDK:', response)
    
    return {
      success: true,
      data: response,
      message: 'Supported chains fetched successfully from SDK'
    }
  } catch (error: any) {
    console.error('❌ Failed to get supported chains from SDK:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Failed to get supported chains from SDK'
    }
  }
}

// 4. Get Tokens for Chain
export const getTokensForChain = async (chainIndex: string) => {
  try {
    console.log(`🔍 Getting tokens for chain ${chainIndex} from OKX DEX SDK...`)
    const client = initializeOKXDexClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Failed to initialize client',
        message: 'OKX DEX client initialization failed'
      }
    }

    // Try to get tokens for the chain
    const response = await client.dex.getTokens(chainIndex)
    console.log(`✅ Tokens for chain ${chainIndex} from SDK:`, response)
    
    return {
      success: true,
      data: response,
      message: 'Tokens fetched successfully from SDK'
    }
  } catch (error: any) {
    console.error(`❌ Failed to get tokens for chain ${chainIndex} from SDK:`, error.message)
    return {
      success: false,
      error: error.message,
      message: 'Failed to get tokens from SDK'
    }
  }
}

// 5. Get SDK Client Info
export const getSDKClientInfo = async () => {
  try {
    console.log('🔍 Getting OKX DEX SDK client info...')
    const client = initializeOKXDexClient()
    
    if (!client) {
      return {
        success: false,
        error: 'Failed to initialize client',
        message: 'OKX DEX client initialization failed'
      }
    }

    // Explore client structure safely
    const clientInfo: any = {
      clientType: typeof client,
      clientKeys: Object.keys(client),
      hasDex: 'dex' in client,
      dexType: client.dex ? typeof client.dex : 'undefined'
    }
    
    // Safely explore dex properties
    if (client.dex) {
      try {
        clientInfo.dexKeys = Object.keys(client.dex)
        clientInfo.dexMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client.dex))
      } catch (error: any) {
        clientInfo.dexError = error.message
      }
    }
    
    console.log('✅ SDK Client info:', clientInfo)
    return {
      success: true,
      data: clientInfo,
      message: 'SDK client info fetched successfully'
    }
  } catch (error: any) {
    console.error('❌ Failed to get SDK client info:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Failed to get SDK client info'
    }
  }
}

// 6. Complete OKX DEX SDK Test
export const testCompleteOKXDEXSDK = async () => {
  try {
    console.log('🔍 Testing complete OKX DEX SDK functionality...')
    
    // Test 1: Get client info
    console.log('📋 Test 1: Getting client info...')
    const clientInfoResult = await getSDKClientInfo()
    
    // Test 2: Get supported chains
    console.log('🔗 Test 2: Getting supported chains...')
    const chainsResult = await getSupportedChains()
    
    // Test 3: Get tokens for Ethereum (chain 1)
    console.log('🪙 Test 3: Getting tokens for Ethereum...')
    const tokensResult = await getTokensForChain('1')
    
    // Test 4: Get quote for ETH to USDC
    console.log('💱 Test 4: Getting quote for ETH to USDC...')
    const quoteResult = await getQuote({
      chainIndex: '1',
      fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
      toTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      amount: '1000000000000000000', // 1 ETH
      slippage: '0.5'
    })
    
    return {
      success: true,
      clientInfo: clientInfoResult,
      chains: chainsResult,
      tokens: tokensResult,
      quote: quoteResult,
      message: 'Complete OKX DEX SDK test completed successfully!'
    }
  } catch (error: any) {
    console.error('❌ Complete OKX DEX SDK test failed:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'Complete OKX DEX SDK test failed. Check console for details.'
    }
  }
} 

// 7. Test XLayer Testnet Support
export const testXLayerSupport = async () => {
  try {
    console.log('🔍 Testing XLayer testnet support...')
    
    // Test 1: Get supported chains
    console.log('📋 Test 1: Getting supported chains...')
    const chainsResult = await getSupportedChains()
    
    // Test 2: Try to get tokens for XLayer testnet (chain 195)
    console.log('🪙 Test 2: Getting tokens for XLayer testnet (chain 195)...')
    const xlayerTokensResult = await getTokensForChain('195')
    
    // Test 3: Try to get quote for XLayer testnet
    console.log('💱 Test 3: Getting quote for XLayer testnet...')
    const xlayerQuoteResult = await getQuote({
      chainIndex: '195',
      fromTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // OKB (native)
      toTokenAddress: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', // USDC
      amount: '1000000000000000000', // 1 OKB
      slippage: '0.5'
    })
    
    return {
      success: true,
      chains: chainsResult,
      xlayerTokens: xlayerTokensResult,
      xlayerQuote: xlayerQuoteResult,
      message: 'XLayer testnet support test completed!'
    }
  } catch (error: any) {
    console.error('❌ XLayer testnet support test failed:', error.message)
    return {
      success: false,
      error: error.message,
      message: 'XLayer testnet support test failed. Check console for details.'
    }
  }
} 