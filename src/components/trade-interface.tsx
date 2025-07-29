'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Clock, Zap } from 'lucide-react'
import { TOKENS, getSwapQuote, SwapRequest, testXLayerTokens } from '@/api/okx'

interface TradeInterfaceProps {
  session: any
}

export function TradeInterface({ session }: TradeInterfaceProps) {
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useAccount()
  const [symbol, setSymbol] = useState('BTC-USDT')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [tradeResult, setTradeResult] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <div className="w-10 h-10 bg-gray-600 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-600 rounded w-48 mx-auto"></div>
          <div className="h-4 bg-gray-600 rounded w-64 mx-auto"></div>
        </div>
      </div>
    )
  }

  const getRemainingBudget = () => {
    if (!session) return 0
    return session.spendLimit - session.spent
  }

  const handleExecuteTrade = async () => {
    if (!amount || !session) return
    
    // Validate amount
    const amountValue = parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      setTradeResult({
        success: false,
        message: 'Please enter a valid amount'
      })
      return
    }
    
    // Check if amount exceeds remaining budget
    const remainingBudget = getRemainingBudget()
    if (amountValue > remainingBudget) {
      setTradeResult({
        success: false,
        message: `Amount exceeds remaining budget. You have $${remainingBudget.toFixed(2)} available.`
      })
      return
    }
    
    setIsExecuting(true)
    setTradeResult(null)
    
    try {
      // Convert symbol to token addresses
      const [baseToken, quoteToken] = symbol.split('-')
      const fromToken = side === 'buy' ? quoteToken : baseToken
      const toToken = side === 'buy' ? baseToken : quoteToken
      
      // Debug: Log token conversion
      console.log('Token conversion:', {
        symbol,
        baseToken,
        quoteToken,
        side,
        fromToken,
        toToken,
        fromTokenAddress: TOKENS[fromToken]?.address,
        toTokenAddress: TOKENS[toToken]?.address,
        chainIndex: '196' // XLayer
      })
      
      // Create swap request
      const swapRequest: SwapRequest = {
        chainIndex: '196', // XLayer mainnet (OKX DEX supported)
        amount: (parseFloat(amount) * Math.pow(10, TOKENS[fromToken]?.decimals || 18)).toString(),
        swapMode: 'exactIn',
        fromTokenAddress: TOKENS[fromToken]?.address || TOKENS.ETH.address,
        toTokenAddress: TOKENS[toToken]?.address || TOKENS.USDT.address,
        slippage: '0.05', // 5% slippage
        userWalletAddress: session.user || '0x0000000000000000000000000000000000000000',
        gasLevel: 'average'
      }

      console.log('Swap request:', swapRequest)

      // Get quote first
      const quote = await getSwapQuote(swapRequest)
      
      if (quote.success) {
        setTradeResult({
          success: true,
          message: `Quote received: ${quote.routerResult?.toTokenAmount || '0'} ${toToken} for ${amount} ${fromToken}`,
          quote: quote
        })
      } else {
        setTradeResult({
          success: false,
          message: quote.message || 'Failed to get quote'
        })
      }
    } catch (error) {
      console.error('Trade execution error:', error)
      setTradeResult({
        success: false,
        message: error instanceof Error ? error.message : 'Trade execution failed'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleTestXLayerTokens = async () => {
    try {
      console.log('Testing XLayer tokens...')
      const result = await testXLayerTokens()
      console.log('XLayer tokens test result:', result)
      
      setTradeResult({
        success: true,
        message: `XLayer tokens test completed. Check console for details.`
      })
    } catch (error) {
      console.error('XLayer tokens test error:', error)
      setTradeResult({
        success: false,
        message: 'Failed to test XLayer tokens'
      })
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">Wallet Not Connected</h3>
        <p className="text-gray-400 text-sm mb-6">Connect your wallet to start trading on OKX DEX</p>
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-6 max-w-md mx-auto">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-blue-400 text-sm font-medium">Trading Features</span>
          </div>
          <ul className="text-sm text-gray-300 space-y-2">
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span>Real-time market data</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span>Secure order execution</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span>Low gas fees on XLayer</span>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  // Check if session is active
  const isSessionActive = session && Date.now() < session.expiry

  // Debug: Log session info
  console.log('TradeInterface - Session:', session)
  console.log('TradeInterface - isSessionActive:', isSessionActive)
  console.log('TradeInterface - Current time:', Date.now())
  console.log('TradeInterface - Session expiry:', session?.expiry)
  console.log('TradeInterface - Session user:', session?.user)
  console.log('TradeInterface - Session spendLimit:', session?.spendLimit)
  console.log('TradeInterface - Session spent:', session?.spent)

  if (!isSessionActive) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">
          {!session ? 'No Active Session' : 'Session Expired'}
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          {!session ? 'Create a trading session first to start trading' : 'Your trading session has expired'}
        </p>
        <div className="bg-orange-900/20 border border-orange-700/30 rounded-xl p-6 max-w-md mx-auto">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span className="text-orange-400 text-sm font-medium">Next Steps</span>
          </div>
          <p className="text-sm text-gray-300">
            {!session 
              ? 'Go to the Session panel and create a new trading session with your desired limits.'
              : 'Create a new session to continue trading with updated limits.'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trading Status */}
      <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-700/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-blue-400">Trading Enabled</h4>
              <p className="text-blue-300 text-sm">Session active and ready</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-400">Remaining Budget</div>
            <div className="font-bold text-blue-300 text-lg">${getRemainingBudget().toFixed(2)}</div>
          </div>
        </div>
        
        {/* Session Details */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-900/20 rounded-lg p-3">
            <div className="text-blue-300 mb-1">Total Limit</div>
            <div className="text-white font-semibold">${session.spendLimit.toFixed(2)}</div>
          </div>
          <div className="bg-blue-900/20 rounded-lg p-3">
            <div className="text-blue-300 mb-1">Amount Used</div>
            <div className="text-white font-semibold">${session.spent.toFixed(2)}</div>
          </div>
          <div className="bg-blue-900/20 rounded-lg p-3">
            <div className="text-blue-300 mb-1">Time Left</div>
            <div className="text-white font-semibold">
              {Math.max(0, Math.floor((session.expiry - Date.now()) / (1000 * 60 * 60)))}h {Math.max(0, Math.floor(((session.expiry - Date.now()) % (1000 * 60 * 60)) / (1000 * 60)))}m
            </div>
          </div>
        </div>
      </div>

      {/* Trading Form */}
      <div className="bg-gray-700/50 rounded-xl p-6">
        <h4 className="font-semibold text-white mb-4">Place Order</h4>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Trading Pair */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trading Pair
            </label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="WBTC-USDT">WBTC/USDT</option>
              <option value="ETH-USDT">ETH/USDT</option>
              <option value="ETH-USDC">ETH/USDC</option>
              <option value="USDC-USDT">USDC/USDT</option>
            </select>
          </div>

          {/* Buy/Sell Side */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Order Side
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSide('buy')}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  side === 'buy'
                    ? 'bg-green-900/20 border-green-500 text-green-400 shadow-lg'
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Buy</span>
                </div>
              </button>
              <button
                onClick={() => setSide('sell')}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  side === 'sell'
                    ? 'bg-red-900/20 border-red-500 text-red-400 shadow-lg'
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Sell</span>
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100"
              min="0"
              max={getRemainingBudget()}
            />
            <p className="text-xs text-gray-400 mt-1">
              Max: ${getRemainingBudget().toFixed(2)}
            </p>
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecuteTrade}
          disabled={isExecuting || !amount || parseFloat(amount) > getRemainingBudget()}
          className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
        >
          {isExecuting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Getting Quote...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Get Quote for {side === 'buy' ? 'Buy' : 'Sell'} {symbol}</span>
            </div>
          )}
        </button>

        {/* Test Button */}
        <div className="mt-4">
          <button
            onClick={handleTestXLayerTokens}
            className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
          >
            Test XLayer Token Support
          </button>
        </div>
      </div>

      {/* Trade Result */}
      {tradeResult && (
        <div className="bg-gray-700/50 rounded-xl p-6 mt-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              tradeResult.success ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {tradeResult.success ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <h4 className={`font-semibold ${
                tradeResult.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {tradeResult.success ? 'Quote Received' : 'Quote Failed'}
              </h4>
              <p className="text-sm text-gray-400">
                {tradeResult.message}
              </p>
            </div>
          </div>
          
          {tradeResult.success && tradeResult.quote && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
              <h5 className="text-sm font-medium text-white mb-3">Quote Details</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Price Impact:</span>
                  <span className="text-white ml-2">
                    {tradeResult.quote.routerResult?.priceImpactPercentage || '0'}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Trade Fee:</span>
                  <span className="text-white ml-2">
                    ${tradeResult.quote.routerResult?.tradeFee || '0'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Gas Estimate:</span>
                  <span className="text-white ml-2">
                    {tradeResult.quote.routerResult?.estimateGasFee || '0'} wei
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">DEX Route:</span>
                  <span className="text-white ml-2">
                    {tradeResult.quote.routerResult?.dexRouterList?.[0]?.subRouterList?.[0]?.dexProtocol?.[0]?.dexName || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trading Info */}
      <div className="bg-gray-700/50 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-3">
          <DollarSign className="h-5 w-5 text-gray-400" />
          <span className="font-semibold text-white">Platform Information</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Platform:</span>
            <span className="font-medium">OKX DEX</span>
          </div>
          <div className="flex justify-between">
            <span>Network:</span>
            <span className="font-medium">XLayer (L2)</span>
          </div>
          <div className="flex justify-between">
            <span>Gas Savings:</span>
            <span className="font-medium text-green-400">90% vs Ethereum</span>
          </div>
        </div>
      </div>
    </div>
  )
} 