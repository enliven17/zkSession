'use client'

import { useState, useEffect } from 'react'
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi'
import { ethers } from 'ethers'
import { SESSION_CONTRACT_ABI, SESSION_CONTRACT_ADDRESS } from '@/lib/contracts'
import { AlertCircle, Play, Clock, DollarSign, Zap } from 'lucide-react'

interface Session {
  user: string
  expiry: number
  spendLimit: number
  spent: number
}

interface SessionManagerProps {
  session: Session | null
  onSessionChange: (session: Session | null) => void
}

export function SessionManager({ session, onSessionChange }: SessionManagerProps) {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { address, isConnected, isConnecting, status } = useAccount()
  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()
  const [duration, setDuration] = useState('86400')
  const [spendLimit, setSpendLimit] = useState('500')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  // Enhanced debug logging
  console.log('=== SessionManager Debug ===')
  console.log('SessionManager - Component rendered')
  console.log('SessionManager - status:', status)
  console.log('SessionManager - isConnected:', isConnected)
  console.log('SessionManager - isConnecting:', isConnecting)
  console.log('SessionManager - address:', address)
  console.log('SessionManager - chain:', chain?.id, chain?.name)
  console.log('SessionManager - current session:', session)
  console.log('SessionManager - mounted:', mounted)
  console.log('SessionManager - isLoading:', isLoading)
  console.log('SessionManager - window.ethereum:', typeof window !== 'undefined' ? !!(window as any).ethereum : 'SSR')
  console.log('SessionManager - SESSION_CONTRACT_ADDRESS:', SESSION_CONTRACT_ADDRESS)
  console.log('================================')

  useEffect(() => {
    console.log('SessionManager - useEffect: Setting mounted to true')
    setMounted(true)
    // Set loading to false after a short delay to show proper UI
    const timer = setTimeout(() => {
      console.log('SessionManager - Timer: Setting isLoading to false')
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Auto-switch to XLayer testnet when wallet connects
  useEffect(() => {
    if (isConnected && chain && chain.id !== 195 && switchNetwork) {
      console.log('SessionManager - Auto-switching to XLayer testnet (Chain ID: 195)')
      console.log('SessionManager - Current chain:', chain.id, chain.name)
      switchNetwork(195)
    }
  }, [isConnected, chain, switchNetwork])

  useEffect(() => {
    // Check for existing session when address changes (wallet connects/disconnects)
    console.log('SessionManager - useEffect: Address/status changed')
    console.log('SessionManager - Address changed:', address)
    console.log('SessionManager - Status changed:', status)
    console.log('SessionManager - Chain:', chain?.id, chain?.name)
    console.log('SessionManager - Ethereum available:', !!(window as any).ethereum)
    
    if (address && typeof window !== 'undefined' && (window as any).ethereum && !isConnecting && status === 'connected') {
      console.log('SessionManager - Wallet connected, checking for existing session:', address)
      checkExistingSession()
    } else if (!address && !isConnecting && status === 'disconnected') {
      // Clear session when wallet disconnects
      console.log('SessionManager - Wallet disconnected, clearing session')
      onSessionChange(null)
      setIsLoading(false)
    } else {
      console.log('SessionManager - Waiting for wallet connection...')
      console.log('SessionManager - Status:', status)
      console.log('SessionManager - isConnecting:', isConnecting)
    }
  }, [address, isConnecting, status, chain])

  const checkExistingSession = async () => {
    try {
      setIsLoading(true)
      console.log('SessionManager - checkExistingSession: Starting...')
      console.log('SessionManager - Checking existing session for address:', address)
      console.log('SessionManager - Contract address:', SESSION_CONTRACT_ADDRESS)
      
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      
      // Ensure we're on the correct network
      const network = await provider.getNetwork()
      console.log('SessionManager - Current network:', network)
      
      if (network.chainId !== 195) {
        console.log('SessionManager - Wrong network, switching to XLayer testnet...')
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xC3' }], // 195 in hex
          })
        } catch (error) {
          console.error('SessionManager - Failed to switch network:', error)
          setError('Please switch to XLayer Testnet to use sessions')
          return
        }
      }
      
      const contract = new ethers.Contract(SESSION_CONTRACT_ADDRESS, SESSION_CONTRACT_ABI, provider)
      
      console.log('SessionManager - Calling getSession...')
      const existingSession = await contract.getSession(address)
      
      console.log('SessionManager - Raw session data from contract:', existingSession)
      
      if (existingSession && existingSession.isActive && address) {
        console.log('SessionManager - Active session found!')
        const sessionData = {
          user: address,
          expiry: existingSession.expiry.toNumber() * 1000, // Convert to milliseconds
          spendLimit: parseFloat(ethers.utils.formatEther(existingSession.spendLimit)),
          spent: parseFloat(ethers.utils.formatEther(existingSession.spent)),
        }
        console.log('SessionManager - Processed session data:', sessionData)
        onSessionChange(sessionData)
      } else {
        console.log('SessionManager - No active session found or session is inactive')
        console.log('SessionManager - existingSession:', existingSession)
        console.log('SessionManager - existingSession.isActive:', existingSession?.isActive)
        onSessionChange(null)
      }
    } catch (error: any) {
      console.error('SessionManager - Error checking existing session:', error)
      console.error('SessionManager - Error details:', {
        message: error.message,
        code: error.code,
        data: error.data
      })
      // Don't show error for session check, just set to null
      onSessionChange(null)
    } finally {
      console.log('SessionManager - checkExistingSession: Setting isLoading to false')
      setIsLoading(false)
    }
  }

  const createSessionWithEthers = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum || !address) return

    try {
      setIsCreating(true)
      setError(null)
      
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      
      // Ensure we're on the correct network
      const network = await provider.getNetwork()
      console.log('SessionManager - Creating session on network:', network)
      
      if (network.chainId !== 195) {
        console.log('SessionManager - Wrong network for session creation, switching to XLayer testnet...')
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xC3' }], // 195 in hex
          })
        } catch (error) {
          console.error('SessionManager - Failed to switch network for session creation:', error)
          setError('Please switch to XLayer Testnet to create sessions')
          return
        }
      }
      
      const signer = provider.getSigner()
      const contract = new ethers.Contract(SESSION_CONTRACT_ADDRESS, SESSION_CONTRACT_ABI, signer)

      // Convert duration to seconds and ensure it's a valid number
      const durationInSeconds = parseInt(duration) * 60 // Convert minutes to seconds
      const spendLimitInWei = ethers.utils.parseEther(spendLimit.toString()) // Convert to wei

      console.log('SessionManager - Creating session with ethers:', {
        duration: durationInSeconds,
        spendLimit: spendLimitInWei.toString(),
        address: SESSION_CONTRACT_ADDRESS
      })

      // Call createSession with proper parameters
      const tx = await contract.createSession(durationInSeconds, spendLimitInWei)
      setTransactionHash(tx.hash)
      
      console.log('SessionManager - Transaction sent:', tx.hash)
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      console.log('SessionManager - Transaction confirmed:', receipt)
      
      setIsCreating(false)
      setError(null)
      
      // Create session data
      const sessionData = {
        user: address,
        expiry: Date.now() + parseInt(duration) * 60 * 1000, // Convert to milliseconds
        spendLimit: parseInt(spendLimit),
        spent: 0,
      }
      onSessionChange(sessionData)
      
    } catch (error: any) {
      console.error('SessionManager - Error creating session:', error)
      
      // Check if session already exists
      if (error.message && error.message.includes('Session already exists')) {
        setError('Session already exists for this address. Please use a different wallet or wait for the current session to expire.')
        
        // Try to get existing session
        try {
          const provider = new ethers.providers.Web3Provider((window as any).ethereum)
          const contract = new ethers.Contract(SESSION_CONTRACT_ADDRESS, SESSION_CONTRACT_ABI, provider)
          const existingSession = await contract.getSession(address)
          
          console.log('SessionManager - Existing session found:', existingSession)
          
          if (existingSession && existingSession.isActive) {
            const sessionData = {
              user: address,
              expiry: existingSession.expiry.toNumber() * 1000, // Convert to milliseconds
              spendLimit: parseFloat(ethers.utils.formatEther(existingSession.spendLimit)),
              spent: parseFloat(ethers.utils.formatEther(existingSession.spent)),
            }
            onSessionChange(sessionData)
          }
        } catch (getSessionError) {
          console.error('SessionManager - Error getting existing session:', getSessionError)
        }
      } else {
        setError(`Failed to create session: ${error.message}`)
      }
      
      setIsCreating(false)
    }
  }

  if (!mounted || isLoading) {
    console.log('SessionManager - Rendering loading state')
    return (
      <div className="space-y-6">
        <div className="bg-gray-700/50 rounded-xl p-4 animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-600 rounded"></div>
            <div className="h-10 bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const handleCreateSession = () => {
    if (!duration || !spendLimit) return
    
    setError(null)
    createSessionWithEthers()
  }

  const getTimeRemaining = () => {
    if (!session) return '0h 0m'
    const remaining = session.expiry - Date.now()
    if (remaining <= 0) return 'Expired'
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const getSpentPercentage = () => {
    if (!session) return 0
    return (session.spent / session.spendLimit) * 100
  }

  const isSessionActive = session && Date.now() < session.expiry

  console.log('SessionManager - Rendering main UI')
  console.log('SessionManager - isConnecting:', isConnecting)
  console.log('SessionManager - isConnected:', isConnected)
  console.log('SessionManager - status:', status)

  if (isConnecting) {
    console.log('SessionManager - Rendering connecting state')
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Connecting Wallet...</h3>
        <p className="text-gray-400 text-sm">Please approve the connection in your wallet</p>
      </div>
    )
  }

  if (!isConnected) {
    console.log('SessionManager - Rendering not connected state')
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Wallet Not Connected</h3>
        <p className="text-gray-400 text-sm mb-4">Connect your wallet to create a trading session</p>
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-blue-400 text-sm font-medium">Why Connect?</span>
          </div>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Create time-limited trading sessions</li>
            <li>• Set spending limits for security</li>
            <li>• Trade on OKX DEX through XLayer</li>
          </ul>
        </div>
      </div>
    )
  }

  if (isSessionActive) {
    console.log('SessionManager - Rendering active session state')
    return (
      <div className="space-y-6">
        {/* Active Session Status */}
        <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-green-400">Session Active</h4>
                <p className="text-green-300 text-sm">Trading enabled</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-400">Time Remaining</div>
              <div className="font-bold text-green-300 text-lg">{getTimeRemaining()}</div>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-gray-700/50 rounded-xl p-4">
          <h4 className="font-semibold text-white mb-3">Session Details</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Spending Limit</span>
              <span className="text-white font-semibold">${session.spendLimit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Amount Used</span>
              <span className="text-white font-semibold">${session.spent.toFixed(2)}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">{getSpentPercentage().toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getSpentPercentage(), 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log('SessionManager - Rendering create session form')
  return (
    <div className="space-y-6">
      {/* Chain Warning */}
      {isConnected && chain && chain.id !== 195 && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div>
                <h4 className="font-semibold text-yellow-400">Wrong Network</h4>
                <p className="text-yellow-300 text-sm">
                  Please switch to XLayer Testnet to use sessions
                </p>
              </div>
            </div>
            {switchNetwork && (
              <button
                onClick={() => switchNetwork(195)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Switch to XLayer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Session Creation Form */}
      <div className="bg-gray-700/50 rounded-xl p-4">
        <h4 className="font-semibold text-white mb-4">Create New Session</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Duration
            </label>
            <div className="relative">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="86400"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                seconds
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Recommended: 86400 (24h) or 3600 (1h)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Spending Limit
            </label>
            <div className="relative">
              <input
                type="number"
                value={spendLimit}
                onChange={(e) => setSpendLimit(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="500"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                USD
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Maximum amount you can spend during this session
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {transactionHash && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-blue-400 text-sm">
              Transaction submitted: {transactionHash.slice(0, 6)}...{transactionHash.slice(-4)}
            </span>
          </div>
          {isCreating && (
            <div className="mt-2 text-xs text-blue-300">
              Waiting for confirmation...
            </div>
          )}
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={handleCreateSession}
        disabled={isCreating || !duration || !spendLimit}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
      >
        {isCreating ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Creating Session...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Trading Session</span>
          </div>
        )}
      </button>

      {/* Session Benefits */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-3">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold text-blue-400">Session Benefits</span>
        </div>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>90% lower gas fees on XLayer</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>Secure trading with spending limits</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>Direct OKX DEX integration</span>
          </li>
        </ul>
      </div>
    </div>
  )
} 