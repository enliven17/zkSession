'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { 
  getQuote, 
  executeSwap, 
  testCompleteOKXDEXSDK,
  getSDKClientInfo,
  testXLayerSupport
} from '@/api/okx-dex-sdk'
import { testXLayerMainnetSupport } from '@/api/okx'


interface TradeResult {
  success: boolean
  message: string
  data?: any
}

interface TradingPair {
  instId: string
  baseCcy: string
  quoteCcy: string
  last: string
  lastSz: string
  askPx: string
  askSz: string
  bidPx: string
  bidSz: string
  open24h: string
  high24h: string
  low24h: string
  volCcy24h: string
  vol24h: string
  ts: string
  sodUtc0: string
  sodUtc8: string
}

interface MarketData {
  instId: string
  last: string
  lastSz: string
  askPx: string
  askSz: string
  bidPx: string
  bidSz: string
  open24h: string
  high24h: string
  low24h: string
  volCcy24h: string
  vol24h: string
  ts: string
}

export default function TradeInterface() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('0.1')
  const [symbol, setSymbol] = useState('OKB-USDT')
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedChain, setSelectedChain] = useState('196') // XLayer mainnet
  const [sdkInfo, setSdkInfo] = useState<any>(null)


  // Fetch SDK info on component mount
  useEffect(() => {
    fetchSDKInfo()
  }, [])

  const fetchSDKInfo = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching OKX DEX SDK info...')
      
      const result = await getSDKClientInfo()
      if (result.success) {
        setSdkInfo(result.data)
        console.log('✅ SDK info loaded:', result.data)
      }
    } catch (error) {
      console.error('Error fetching SDK info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteTrade = async () => {
    if (!symbol || !amount || !selectedChain) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const fromTokenAddress = getTokenAddress(symbol.split('-')[0])
      const toTokenAddress = getTokenAddress(symbol.split('-')[1])
      const amountInWei = convertToWei(amount, symbol.split('-')[0])

      console.log('🔍 Trade Parameters:', {
        chainIndex: selectedChain,
        fromTokenAddress,
        toTokenAddress,
        amount: amountInWei
      })

      const result = await getQuote({
        chainIndex: selectedChain,
        fromTokenAddress,
        toTokenAddress,
        amount: amountInWei,
        slippage: '0.5'
      })

      if (result.success) {
        console.log('✅ Quote received:', result.data)
        setTradeResult(result)
      } else {
        console.error('❌ Quote failed:', result.error)
        setTradeResult(result)
      }

      if (result.data && result.data.data && result.data.data[0]) {
        console.log('🔍 Quote Data Structure:')
        const quoteData = result.data.data[0] as any
        console.log('- Chain ID:', quoteData.chainId)
        console.log('- Chain Index:', quoteData.chainIndex)
        console.log('- All available fields:', Object.keys(quoteData))
        
        // Check for price-related fields
        console.log('💰 Price-related fields:')
        console.log('- price:', quoteData.price)
        console.log('- estimatedOutput:', quoteData.estimatedOutput)
        console.log('- outputAmount:', quoteData.outputAmount)
        console.log('- toAmount:', quoteData.toAmount)
        console.log('- rate:', quoteData.rate)
        console.log('- exchangeRate:', quoteData.exchangeRate)
        console.log('- All fields with values:', Object.entries(quoteData).filter(([key, value]) => value !== undefined && value !== null))
      }

      setTradeResult(result)
    } catch (error) {
      console.error('Trade execution failed:', error)
      setTradeResult({
        success: false,
        message: 'Failed to execute trade'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteSwap = async () => {
    if (!symbol || !amount || !selectedChain || !address) {
      alert('Please fill in all fields and connect wallet')
      return
    }

    setLoading(true)
    try {
      const fromTokenAddress = getTokenAddress(symbol.split('-')[0])
      const toTokenAddress = getTokenAddress(symbol.split('-')[1])
      const amountInWei = convertToWei(amount, symbol.split('-')[0])

      console.log('🚀 Executing swap with parameters:', {
        chainIndex: selectedChain,
        fromTokenAddress,
        toTokenAddress,
        amount: amountInWei,
        userWalletAddress: address
      })

      const result = await executeSwap({
        chainIndex: selectedChain,
        fromTokenAddress,
        toTokenAddress,
        amount: amountInWei,
        slippage: '0.5',
        userWalletAddress: address
      })

      if (result.success) {
        console.log('✅ Swap executed successfully:', result.data)
        setTradeResult({
          success: true,
          message: 'Swap executed successfully! Check your wallet for the transaction.',
          data: result.data
        })
      } else {
        console.error('❌ Swap failed:', result.error)
        setTradeResult({
          success: false,
          message: result.message || 'Failed to execute swap'
        })
      }
    } catch (error) {
      console.error('Swap execution failed:', error)
      setTradeResult({
        success: false,
        message: 'Failed to execute swap'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestSDK = async () => {
    try {
      setLoading(true)
      setTradeResult({
        success: false,
        message: 'Testing OKX DEX SDK...'
      })

      const result = await testCompleteOKXDEXSDK()
      
      if (result && result.success) {
        setTradeResult({
          success: true,
          message: 'OKX DEX SDK test successful!',
          data: result
        })
      } else {
        setTradeResult({
          success: false,
          message: result?.message || 'OKX DEX SDK test failed'
        })
      }
    } catch (error: any) {
      console.error('SDK test error:', error)
      setTradeResult({
        success: false,
        message: error.message || 'Failed to test SDK'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestXLayer = async () => {
    try {
      setLoading(true)
      setTradeResult({
        success: false,
        message: 'Testing XLayer mainnet support...'
      })

      const result = await testXLayerSupport()
      
      if (result && result.success) {
        setTradeResult({
          success: true,
          message: 'XLayer support test successful!',
          data: result
        })
      } else {
        setTradeResult({
          success: false,
          message: result?.message || 'XLayer mainnet support test failed'
        })
      }
    } catch (error: any) {
      console.error('XLayer test error:', error)
      setTradeResult({
        success: false,
        message: error.message || 'Failed to test XLayer mainnet support'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestXLayerMainnet = async () => {
    try {
      setLoading(true)
      setTradeResult({
        success: false,
        message: 'Testing XLayer mainnet API support...'
      })

      const result = await testXLayerMainnetSupport()
      
      if (result && result.success) {
        setTradeResult({
          success: true,
          message: 'XLayer mainnet API test successful!',
          data: result
        })
      } else {
        setTradeResult({
          success: false,
          message: result?.message || 'XLayer mainnet API test failed'
        })
      }
    } catch (error: any) {
      console.error('XLayer API test error:', error)
      setTradeResult({
        success: false,
        message: error.message || 'Failed to test XLayer mainnet API'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshSDKInfo = async () => {
    await fetchSDKInfo()
  }

  // Helper functions
  const getTokenAddress = (token: string): string => {
    // Token addresses for different blockchains
    const addresses: { [key: string]: { [chainId: string]: string } } = {
      'ETH': {
        '1': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Ethereum
        '137': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Polygon (MATIC native)
        '56': '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // BSC (WETH)
        '42161': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // Arbitrum (WETH)
        '10': '0x4200000000000000000000000000000000000006', // Optimism (WETH)
        '196': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'  // XLayer Mainnet (OKB)
      },
      'USDC': {
        '1': '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8', // Ethereum
        '137': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
        '56': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // BSC
        '42161': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // Arbitrum
        '10': '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // Optimism
        '195': '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',  // XLayer Testnet
        '196': '0x176211869cA2b568f2A7D4EE941E073a821EE1ff'  // XLayer Mainnet
      },
      'USDT': {
        '1': '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum
        '137': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon
        '56': '0x55d398326f99059fF775485246999027B3197955', // BSC
        '42161': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum
        '10': '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // Optimism
        '195': '0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3',  // XLayer Testnet
        '196': '0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3'  // XLayer Mainnet
      },
      'BTC': {
        '1': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // Ethereum (WBTC)
        '137': '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // Polygon (WBTC)
        '56': '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', // BSC (BTCB)
        '42161': '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // Arbitrum (WBTC)
        '10': '0x68f180fcCe6836688e9084f035309E29Bf0A2095', // Optimism (WBTC)
        '196': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'  // XLayer Mainnet (WBTC)
      },
      'WBTC': {
        '1': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // Ethereum
        '137': '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // Polygon
        '56': '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', // BSC
        '42161': '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // Arbitrum
        '10': '0x68f180fcCe6836688e9084f035309E29Bf0A2095', // Optimism
        '196': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'  // XLayer Mainnet
      },
      'OKB': {
        '195': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',  // XLayer Testnet (Native)
        '196': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'  // XLayer Mainnet (Native)
      },
      'MATIC': {
        '137': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' // Polygon (Native)
      },
      'BNB': {
        '56': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' // BSC (Native)
      }
    }
    
    // Get the token addresses for the selected chain
    const tokenAddresses = addresses[token]
    if (!tokenAddresses) {
      // Fallback to ETH address for unknown tokens
      return '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    }
    
    // Return the address for the selected chain, or fallback to Ethereum
    return tokenAddresses[selectedChain] || tokenAddresses['1'] || '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  }

  const convertToWei = (amount: string, token: string): string => {
    const decimals: { [key: string]: number } = {
      'ETH': 18,
      'USDC': 6,
      'USDT': 6,
      'BTC': 8,
      'WBTC': 8
    }
    const decimal = decimals[token] || 18
    return (parseFloat(amount) * Math.pow(10, decimal)).toString()
  }

  const formatPrice = (price: string) => {
    const num = parseFloat(price)
    if (isNaN(num)) return '0.00'
    if (num >= 1) {
      return num.toFixed(2)
    } else if (num >= 0.01) {
      return num.toFixed(4)
    } else {
      return num.toFixed(8)
    }
  }

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume)
    if (isNaN(num)) return '0'
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`
    } else {
      return num.toFixed(2)
    }
  }

  const getChainName = (chainId: string) => {
    const chains: { [key: string]: string } = {
      '1': 'Ethereum',
      '137': 'Polygon',
      '56': 'BSC',
      '42161': 'Arbitrum',
      '10': 'Optimism',
      '195': 'XLayer Testnet',
      '196': 'XLayer Mainnet'
    }
    return chains[chainId] || `Chain ${chainId}`
  }

  // Calculate token price based on trading pair
  const calculateTokenPrice = (fromToken: string, toToken: string, amount: string, estimatedOutput?: string) => {
    if (!estimatedOutput || !amount) return null
    
    const fromAmount = parseFloat(amount)
    const toAmount = parseFloat(estimatedOutput)
    
    if (fromAmount === 0) return null
    
    // Calculate price: how much quote token for 1 base token
    const price = toAmount / fromAmount
    
    return {
      price,
      formattedPrice: price.toFixed(6),
      unit: `${fromToken}/${toToken}`,
      description: `1 ${fromToken} = ${price.toFixed(6)} ${toToken}`
    }
  }

  // Get token symbol for display
  const getTokenSymbol = (token: string) => {
    const symbols: { [key: string]: string } = {
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ETH',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'BTC'
    }
    return symbols[token] || token
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">OKX DEX Trading Interface</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleRefreshSDKInfo}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              🔄 Refresh SDK Info
            </button>
            <button
              onClick={handleTestSDK}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              🧪 Test SDK
            </button>
            <button
              onClick={handleTestXLayer}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              🧪 Test XLayer Mainnet
            </button>
            <button
              onClick={handleTestXLayerMainnet}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              🔍 Test XLayer API
            </button>
          </div>
        </div>

        {/* SDK Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">OKX DEX SDK Information</h3>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading SDK info...</p>
            </div>
          ) : sdkInfo ? (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Client Structure</h4>
                  <div className="space-y-1 text-sm">
                    <div className="text-gray-300">Client Type: <span className="text-blue-400">{sdkInfo.clientType}</span></div>
                    <div className="text-gray-300">Has DEX: <span className="text-green-400">{sdkInfo.hasDex ? 'Yes' : 'No'}</span></div>
                    <div className="text-gray-300">DEX Type: <span className="text-purple-400">{sdkInfo.dexType}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Available Methods</h4>
                  <div className="text-sm text-gray-300">
                    {sdkInfo.dexMethods ? (
                      <div className="space-y-1">
                        {sdkInfo.dexMethods.slice(0, 5).map((method: string, index: number) => (
                          <div key={index} className="text-green-400">• {method}</div>
                        ))}
                        {sdkInfo.dexMethods.length > 5 && (
                          <div className="text-gray-500">... and {sdkInfo.dexMethods.length - 5} more</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-400">No methods available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              No SDK info available. Click "Refresh SDK Info" to load.
            </div>
          )}
        </div>

        {/* Chain Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Select Blockchain</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: '196', name: 'XLayer Mainnet', currency: 'OKB', featured: true },
              { id: '1', name: 'Ethereum', currency: 'ETH' },
              { id: '137', name: 'Polygon', currency: 'MATIC' },
              { id: '56', name: 'BSC', currency: 'BNB' },
              { id: '42161', name: 'Arbitrum', currency: 'ETH' },
              { id: '10', name: 'Optimism', currency: 'ETH' }
            ].map((chain) => (
              <button
                key={chain.id}
                onClick={() => setSelectedChain(chain.id)}
                className={`p-3 border rounded-lg transition-all ${
                  selectedChain === chain.id
                    ? chain.featured 
                      ? 'border-green-500 bg-green-900/20 text-green-400'
                      : 'border-blue-500 bg-blue-900/20 text-blue-400'
                    : chain.featured
                      ? 'border-green-600 bg-green-900/10 text-green-300 hover:border-green-500'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="font-semibold">{chain.name}</div>
                <div className="text-xs opacity-75">{chain.currency}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Trade Form */}
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Execute Trade</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Trading Pair
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                  placeholder="e.g., BTC-USDT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                  placeholder="Enter amount"
                  step="0.000001"
                  min="0"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleExecuteTrade}
                disabled={!isConnected || loading}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  !isConnected || loading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? 'Processing...' : 'Get Quote'}
              </button>
              <button
                onClick={handleExecuteSwap}
                disabled={!isConnected || loading || !tradeResult?.success}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  !isConnected || loading || !tradeResult?.success
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loading ? 'Processing...' : 'Execute Swap'}
              </button>
            </div>
          </div>
        </div>



        {/* Trade Result */}
        {tradeResult && (
          <div className={`mt-6 p-4 rounded-lg ${
            tradeResult.success 
              ? 'bg-green-900/20 border border-green-700' 
              : 'bg-red-900/20 border border-red-700'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              tradeResult.success ? 'text-green-400' : 'text-red-400'
            }`}>
              {tradeResult.success ? 'Quote Received!' : 'Error'}
            </h4>
            <p className={`${
              tradeResult.success ? 'text-green-300' : 'text-red-300'
            }`}>
              {tradeResult.message}
            </p>
            
            {tradeResult.data && tradeResult.success && (
              <div className="mt-4 space-y-4">
                {/* Check if it's a quote result or SDK test result */}
                {tradeResult.data.code === '0' && tradeResult.data.data ? (
                  // Quote Result Display
                  <>
                    {/* Quote Summary */}
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <h5 className="font-semibold text-white mb-3">Quote Summary</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Chain ID:</span>
                            <span className="text-white font-medium">{tradeResult.data.data[0]?.chainId || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Chain Index:</span>
                            <span className="text-white font-medium">{tradeResult.data.data[0]?.chainIndex || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Context Slot:</span>
                            <span className="text-white font-medium">{tradeResult.data.data[0]?.contextSlot || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className="text-green-400 font-medium">✓ Available</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">DEX Routers:</span>
                            <span className="text-white font-medium">
                              {tradeResult.data.data[0]?.dexRouterList ? tradeResult.data.data[0].dexRouterList.length : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DEX Router Details */}
                    {tradeResult.data.data[0]?.dexRouterList && tradeResult.data.data[0].dexRouterList.length > 0 && (
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">Available DEX Routers</h5>
                        <div className="space-y-3">
                          {tradeResult.data.data[0].dexRouterList.map((router: any, index: number) => (
                            <div key={index} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-blue-400 font-medium">Router {index + 1}</span>
                                <span className="text-green-400 font-medium">
                                  {router.routerPercent}% Share
                                </span>
                              </div>
                              <div className="text-sm text-gray-300 break-all">
                                {router.router}
                              </div>
                              {/* Sub Router List */}
                              {router.subRouterList && router.subRouterList.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-600">
                                  <div className="text-xs text-gray-400 mb-1">Sub Routers:</div>
                                  {router.subRouterList.map((subRouter: any, subIndex: number) => (
                                    <div key={subIndex} className="text-xs text-gray-300 ml-2">
                                      • {subRouter.router || 'N/A'} ({subRouter.routerPercent || 'N/A'}%)
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trading Information */}
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <h5 className="font-semibold text-white mb-3">Trading Information</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">From Token:</span>
                            <span className="text-white font-medium">{symbol.split('-')[0]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">To Token:</span>
                            <span className="text-white font-medium">{symbol.split('-')[1]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Amount:</span>
                            <span className="text-white font-medium">{amount}</span>
                          </div>
                          {/* Price Information */}
                          {(() => {
                            const fromToken = symbol.split('-')[0]
                            const toToken = symbol.split('-')[1]
                            const quoteData = tradeResult.data.data[0] as any
                            
                            // Check multiple possible fields for output amount
                            const estimatedOutput = quoteData?.estimatedOutput || 
                                                   quoteData?.outputAmount || 
                                                   quoteData?.toAmount || 
                                                   quoteData?.amountOut
                            
                            // Get tokenUnitPrice directly from API response
                            const tokenUnitPrice = quoteData?.tokenUnitPrice
                            
                            return (
                              <>
                                {tokenUnitPrice && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Token Price:</span>
                                    <span className="text-green-400 font-medium">
                                      {parseFloat(tokenUnitPrice).toFixed(6)} {toToken} 
                                      <span className="text-xs text-blue-400 ml-1">(Raw API)</span>
                                    </span>
                                  </div>
                                )}

                                {estimatedOutput && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Estimated Output:</span>
                                    <span className="text-blue-400 font-medium">
                                      {parseFloat(estimatedOutput).toFixed(6)} {toToken}
                                    </span>
                                  </div>
                                )}
                                {quoteData?.dexRouterList?.length > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Available Routers:</span>
                                    <span className="text-green-400 font-medium">
                                      {quoteData.dexRouterList.length} DEX
                                    </span>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                          {tradeResult.data.data[0]?.priceImpact && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Price Impact:</span>
                              <span className={`font-medium ${
                                Math.abs(parseFloat(tradeResult.data.data[0].priceImpact)) < 1 
                                  ? 'text-green-400' 
                                  : 'text-yellow-400'
                              }`}>
                                {parseFloat(tradeResult.data.data[0].priceImpact).toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Selected Chain:</span>
                            <span className="text-blue-400 font-medium">
                              {getChainName(selectedChain)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Slippage:</span>
                            <span className="text-yellow-400 font-medium">0.5%</span>
                          </div>
                          {tradeResult.data.data[0]?.gasEstimate && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Gas Estimate:</span>
                              <span className="text-orange-400 font-medium">
                                {tradeResult.data.data[0].gasEstimate} GWEI
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-400">Quote Time:</span>
                            <span className="text-white font-medium">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={handleExecuteSwap}
                        disabled={!isConnected || loading}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                          !isConnected || loading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {loading ? 'Processing...' : '🚀 Execute Swap'}
                      </button>
                      <button
                        onClick={() => setTradeResult(null)}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        ✕ Clear
                      </button>
                    </div>
                  </>
                ) : tradeResult.data.quoteResults ? (
                  // XLayer Test Result Display
                  <>
                    {/* XLayer Test Summary */}
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <h5 className="font-semibold text-white mb-3">XLayer Mainnet Support Test Results</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Supported Chains:</span>
                            <span className={`font-medium ${tradeResult.data.chains?.success ? 'text-green-400' : 'text-red-400'}`}>
                              {tradeResult.data.chains?.success ? '✓ Success' : '✗ Failed'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">XLayer Mainnet Tokens:</span>
                            <span className={`font-medium ${tradeResult.data.xlayerMainnetTokens?.success ? 'text-green-400' : 'text-red-400'}`}>
                              {tradeResult.data.xlayerMainnetTokens?.success ? '✓ Success' : '✗ Failed'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Liquidity Sources:</span>
                            <span className={`font-medium ${tradeResult.data.xlayerLiquidity?.code === '0' ? 'text-green-400' : 'text-red-400'}`}>
                              {tradeResult.data.xlayerLiquidity?.code === '0' ? '✓ Available' : '✗ Failed'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Test Time:</span>
                            <span className="text-white font-medium">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Liquidity Sources */}
                    {tradeResult.data.xlayerLiquidity?.code === '0' && tradeResult.data.xlayerLiquidity?.data && (
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">Available Liquidity Sources on XLayer Mainnet</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {tradeResult.data.xlayerLiquidity.data.slice(0, 8).map((source: any, index: number) => (
                            <div key={index} className="bg-gray-800/50 rounded-lg p-2 border border-gray-700">
                              <div className="text-sm text-blue-400 font-medium">{source.name}</div>
                              <div className="text-xs text-gray-400">ID: {source.id}</div>
                            </div>
                          ))}
                          {tradeResult.data.xlayerLiquidity.data.length > 8 && (
                            <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 flex items-center justify-center">
                              <div className="text-sm text-gray-400">
                                +{tradeResult.data.xlayerLiquidity.data.length - 8} more
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-sm text-gray-400">
                          Total: {tradeResult.data.xlayerLiquidity.data.length} liquidity sources available
                        </div>
                      </div>
                    )}

                    {/* Trading Pairs Test Results */}
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <h5 className="font-semibold text-white mb-3">Trading Pairs Test Results</h5>
                      <div className="space-y-3">
                        {tradeResult.data.quoteResults.map((result: any, index: number) => (
                          <div key={index} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-blue-400 font-medium">{result.pair}</span>
                              <span className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                                {result.success ? '✓ Success' : '✗ Failed'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-300">
                              {result.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  // SDK Test Result Display
                  <>
                    {/* SDK Test Summary */}
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <h5 className="font-semibold text-white mb-3">SDK Test Results</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Client Info:</span>
                            <span className={`font-medium ${tradeResult.data.clientInfo?.success ? 'text-green-400' : 'text-red-400'}`}>
                              {tradeResult.data.clientInfo?.success ? '✓ Success' : '✗ Failed'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Supported Chains:</span>
                            <span className={`font-medium ${tradeResult.data.chains?.success ? 'text-green-400' : 'text-red-400'}`}>
                              {tradeResult.data.chains?.success ? '✓ Success' : '✗ Failed'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tokens:</span>
                            <span className={`font-medium ${tradeResult.data.tokens?.success ? 'text-green-400' : 'text-red-400'}`}>
                              {tradeResult.data.tokens?.success ? '✓ Success' : '✗ Failed'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Quote Test:</span>
                            <span className={`font-medium ${tradeResult.data.quote?.success ? 'text-green-400' : 'text-red-400'}`}>
                              {tradeResult.data.quote?.success ? '✓ Success' : '✗ Failed'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">SDK Status:</span>
                            <span className="text-blue-400 font-medium">Connected</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Test Time:</span>
                            <span className="text-white font-medium">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SDK Client Info Details */}
                    {tradeResult.data.clientInfo?.data && (
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-3">SDK Client Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Client Type:</span>
                              <span className="text-white font-medium">{tradeResult.data.clientInfo.data.clientType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Has DEX:</span>
                              <span className={`font-medium ${tradeResult.data.clientInfo.data.hasDex ? 'text-green-400' : 'text-red-400'}`}>
                                {tradeResult.data.clientInfo.data.hasDex ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">DEX Type:</span>
                              <span className="text-white font-medium">{tradeResult.data.clientInfo.data.dexType}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Available Methods:</span>
                              <span className="text-white font-medium">
                                {tradeResult.data.clientInfo.data.dexMethods?.length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Client Keys:</span>
                              <span className="text-white font-medium">
                                {tradeResult.data.clientInfo.data.clientKeys?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setTradeResult(null)}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        ✕ Clear Results
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Raw JSON (Collapsible) */}
            {tradeResult.data && (
              <div className="mt-4">
                <details className="bg-gray-900/30 rounded-lg">
                  <summary className="p-3 cursor-pointer text-gray-400 hover:text-white font-medium">
                    📄 View Raw JSON Data
                  </summary>
                  <div className="p-3 border-t border-gray-700">
                    <pre className="text-xs text-gray-300 overflow-auto max-h-60 bg-gray-900 p-3 rounded">
                      {JSON.stringify(tradeResult.data, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Data Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Selected Chain</h4>
            <div className="text-2xl font-bold text-blue-400">{selectedChain}</div>
            <div className="text-sm text-gray-400">Chain ID</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Trading Pair</h4>
            <div className="text-2xl font-bold text-green-400">{symbol}</div>
            <div className="text-sm text-gray-400">Current selection</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">SDK Status</h4>
            <div className="text-2xl font-bold text-purple-400">
              {sdkInfo?.hasDex ? 'Connected' : 'Disconnected'}
            </div>
            <div className="text-sm text-gray-400">OKX DEX SDK</div>
          </div>
        </div>
      </div>
    </div>
  )
} 