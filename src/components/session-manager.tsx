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
  const [duration, setDuration] = useState('60')
  const [spendLimit, setSpendLimit] = useState('100')
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
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Auto-switch to XLayer testnet when wallet connects (only once)
  useEffect(() => {
    if (isConnected && chain && chain.id !== 195 && switchNetwork) {
      console.log('SessionManager - Auto-switching to XLayer testnet (Chain ID: 195)')
      console.log('SessionManager - Current chain:', chain.id, chain.name)
      // Only switch if not already on XLayer testnet
      if (chain.id !== 195) {
        switchNetwork(195)
      }
    }
  }, [isConnected, chain, switchNetwork])

  // Check for existing session when component mounts or address changes
  useEffect(() => {
    if (mounted && isConnected && address && !session) {
      console.log('SessionManager - Checking for existing session on mount/address change')
      checkExistingSession()
    }
  }, [mounted, isConnected, address, session])

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
    } else if (status === 'connected' && address) {
      // Wallet is connected, ensure loading is false
      console.log('SessionManager - Wallet connected, ensuring loading is false')
      setIsLoading(false)
    } else {
      console.log('SessionManager - Waiting for wallet connection...')
      console.log('SessionManager - Status:', status)
      console.log('SessionManager - isConnecting:', isConnecting)
    }
  }, [address, isConnecting, status, chain])

  const checkExistingSession = async () => {
    if (!address || typeof window === 'undefined' || !(window as any).ethereum) return

    try {
      console.log('SessionManager - Checking for existing session...')
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      const contract = new ethers.Contract(SESSION_CONTRACT_ADDRESS, SESSION_CONTRACT_ABI, provider)
      
      const existingSession = await contract.getSession(address)
      console.log('SessionManager - Existing session data:', existingSession)
      
      if (existingSession && existingSession.expiry) {
        const currentTime = Math.floor(Date.now() / 1000)
        const expiryTime = existingSession.expiry.toNumber()
        
        console.log('SessionManager - Session expiry check:', {
          currentTime,
          expiryTime,
          isExpired: currentTime >= expiryTime
        })
        
        if (currentTime < expiryTime) {
          console.log('SessionManager - Active session found, updating UI')
          const sessionData = {
            user: address,
            expiry: expiryTime * 1000, // Convert to milliseconds
            spendLimit: parseFloat(ethers.utils.formatEther(existingSession.spendLimit)),
            spent: parseFloat(ethers.utils.formatEther(existingSession.spent)),
          }
          onSessionChange(sessionData)
          return true // Session exists and is active
        } else {
          console.log('SessionManager - Existing session is expired')
          return false // Session exists but is expired
        }
      }
      
      return false // No session exists
    } catch (error) {
      console.error('SessionManager - Error checking existing session:', error)
      return false
    }
  }

  const handleExistingSessionError = async () => {
    if (!address) return false
    
    console.log('SessionManager - Handling existing session error...')
    
    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      const contract = new ethers.Contract(SESSION_CONTRACT_ADDRESS, SESSION_CONTRACT_ABI, provider)
      
      const existingSession = await contract.getSession(address)
      console.log('SessionManager - Found existing session:', existingSession)
      
      if (existingSession && existingSession.expiry) {
        const currentTime = Math.floor(Date.now() / 1000)
        const expiryTime = existingSession.expiry.toNumber()
        
        if (currentTime < expiryTime) {
          // Active session exists
          const sessionData = {
            user: address,
            expiry: expiryTime * 1000,
            spendLimit: parseFloat(ethers.utils.formatEther(existingSession.spendLimit)),
            spent: parseFloat(ethers.utils.formatEther(existingSession.spent)),
          }
          onSessionChange(sessionData)
          setError(null)
          return true
        } else {
          // Session expired, can create new one
          setError('Previous session has expired. You can now create a new one.')
          setTimeout(() => setError(null), 5000)
          return false
        }
      }
      
      return false
    } catch (error) {
      console.error('SessionManager - Error handling existing session:', error)
      setError('Error checking existing session. Please try again.')
      return false
    }
  }

  const forceExpireSession = async () => {
    if (!address || typeof window === 'undefined' || !(window as any).ethereum) return false
    
    try {
      console.log('SessionManager - Force expiring session...')
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(SESSION_CONTRACT_ADDRESS, SESSION_CONTRACT_ABI, signer)
      
      // Try to call emergencyExpireSession if available
      try {
        const tx = await contract.emergencyExpireSession(address)
        console.log('SessionManager - Emergency expire transaction sent:', tx.hash)
        
        const receipt = await tx.wait()
        console.log('SessionManager - Emergency expire confirmed:', receipt)
        
        // Clear current session
        onSessionChange(null)
        setError('Session has been force expired. You can now create a new one.')
        setTimeout(() => setError(null), 5000)
        
        return true
      } catch (emergencyError) {
        console.log('SessionManager - Emergency expire failed, trying alternative method:', emergencyError)
        
        // If emergency expire fails, try to check if session is actually expired
        const existingSession = await contract.getSession(address)
        if (existingSession && existingSession.expiry) {
          const currentTime = Math.floor(Date.now() / 1000)
          const expiryTime = existingSession.expiry.toNumber()
          
          console.log('SessionManager - Current session status:', {
            currentTime,
            expiryTime,
            isExpired: currentTime >= expiryTime,
            timeRemaining: expiryTime - currentTime
          })
          
          if (currentTime >= expiryTime) {
            // Session is actually expired, clear it
            onSessionChange(null)
            setError('Session has expired. You can now create a new one.')
            setTimeout(() => setError(null), 5000)
            return true
          } else {
            // Session is still active, show remaining time
            const remainingMinutes = Math.ceil((expiryTime - currentTime) / 60)
            setError(`Session is still active for ${remainingMinutes} more minutes. Please wait for it to expire.`)
            return false
          }
        }
        
        return false
      }
    } catch (error) {
      console.error('SessionManager - Error force expiring session:', error)
      setError('Error expiring session. Please try again.')
      return false
    }
  }

  const validateSessionCreation = async () => {
    if (!address || typeof window === 'undefined' || !(window as any).ethereum) return false
    
    try {
      console.log('SessionManager - Validating session creation...')
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      const contract = new ethers.Contract(SESSION_CONTRACT_ADDRESS, SESSION_CONTRACT_ABI, provider)
      
      const existingSession = await contract.getSession(address)
      console.log('SessionManager - Validation - existing session:', existingSession)
      
      if (existingSession && existingSession.expiry) {
        const currentTime = Math.floor(Date.now() / 1000)
        const expiryTime = existingSession.expiry.toNumber()
        const isExpired = currentTime >= expiryTime
        
        console.log('SessionManager - Validation - session status:', {
          currentTime,
          expiryTime,
          isExpired,
          timeRemaining: expiryTime - currentTime
        })
        
        if (!isExpired) {
          // Session is still active
          const remainingMinutes = Math.ceil((expiryTime - currentTime) / 60)
          setError(`Cannot create new session. Current session is still active for ${remainingMinutes} more minutes.`)
          return false
        } else {
          // Session is expired, can create new one
          setError(null)
          return true
        }
      }
      
      // No session exists
      setError(null)
      return true
    } catch (error) {
      console.error('SessionManager - Error validating session creation:', error)
      setError('Error validating session. Please try again.')
      return false
    }
  }

  const createSessionWithEthers = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum || !address) {
      console.error('SessionManager - createSessionWithEthers: Missing requirements', {
        hasWindow: typeof window !== 'undefined',
        hasEthereum: !!(window as any).ethereum,
        hasAddress: !!address
      })
      return
    }

    try {
      console.log('SessionManager - createSessionWithEthers: Starting...')
      
      // Validate session creation first
      const canCreate = await validateSessionCreation()
      if (!canCreate) {
        console.log('SessionManager - Session creation validation failed')
        return
      }
      
      setIsCreating(true)
      setError(null)
      
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      console.log('SessionManager - Provider created:', provider)
      
      // Check current network for session creation
      const network = await provider.getNetwork()
      console.log('SessionManager - Creating session on network:', network)
      
      if (network.chainId !== 195) {
        console.log('SessionManager - Error: Cannot create session on wrong network')
        console.log('SessionManager - Current chain ID:', network.chainId, 'Required: 195')
        setError('Please switch to XLayer Testnet (Chain ID: 195) to create sessions')
        setIsCreating(false)
        return
      }
      
      const signer = provider.getSigner()
      const contract = new ethers.Contract(SESSION_CONTRACT_ADDRESS, SESSION_CONTRACT_ABI, signer)
      
      console.log('SessionManager - Contract instance created:', {
        address: SESSION_CONTRACT_ADDRESS,
        abi: SESSION_CONTRACT_ABI,
        signer: signer
      })

      // Convert duration to seconds and ensure it's a valid number
      const durationInSeconds = parseInt(duration) * 60 // Convert minutes to seconds
      const spendLimitInWei = ethers.utils.parseEther(spendLimit.toString()) // Convert to wei

      console.log('SessionManager - Creating session with ethers:', {
        duration: durationInSeconds,
        durationMinutes: duration,
        spendLimit: spendLimitInWei.toString(),
        spendLimitUSD: spendLimit,
        address: SESSION_CONTRACT_ADDRESS,
        userAddress: address
      })

      // Call createSession with proper parameters
      console.log('SessionManager - Calling contract.createSession...')
      const tx = await contract.createSession(durationInSeconds, spendLimitInWei)
      console.log('SessionManager - Transaction sent:', tx)
      setTransactionHash(tx.hash)
      
      console.log('SessionManager - Transaction sent:', tx.hash)
      
      // Wait for transaction confirmation
      console.log('SessionManager - Waiting for transaction confirmation...')
      const receipt = await tx.wait()
      console.log('SessionManager - Transaction confirmed:', receipt)
      
      setIsCreating(false)
      setError(null)
      
      // Create session data
      const sessionData = {
        user: address,
        expiry: Date.now() + parseInt(duration) * 60 * 1000, // Convert minutes to milliseconds
        spendLimit: parseFloat(spendLimit),
        spent: 0,
      }
      console.log('SessionManager - Session created successfully:', sessionData)
      onSessionChange(sessionData)
      
    } catch (error: any) {
      console.error('SessionManager - Error creating session:', error)
      console.error('SessionManager - Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        stack: error.stack
      })
      
      // Check if session already exists
      if (error.message && error.message.includes('Session already exists')) {
        console.log('SessionManager - Session already exists, handling...')
        const sessionHandled = await handleExistingSessionError()
        
        if (sessionHandled) {
          // Session was found and loaded, no need to show error
          setIsCreating(false)
          return
        } else {
          // Session expired or error occurred
          setError('Previous session has expired. You can now create a new one.')
          setIsCreating(false)
          return
        }
      } else {
        // More specific error messages
        let errorMessage = 'Failed to create session'
        if (error.message) {
          if (error.message.includes('user rejected')) {
            errorMessage = 'Transaction was rejected by user'
          } else if (error.message.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for gas fees'
          } else if (error.message.includes('nonce')) {
            errorMessage = 'Transaction nonce error - please refresh and try again'
          } else if (error.message.includes('UNPREDICTABLE_GAS_LIMIT')) {
            errorMessage = 'Transaction failed - please check your inputs and try again'
          } else {
            errorMessage = `Failed to create session: ${error.message}`
          }
        }
        setError(errorMessage)
      }
      
      setIsCreating(false)
    }
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
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-blue-400 text-base font-semibold">Why Connect?</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
              <span>Create time-limited trading sessions</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
              <span>Set spending limits for security</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
              <span>Trade on OKX DEX through XLayer</span>
            </div>
          </div>
        </div>
      </div>
    )
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

  // Show session form when wallet is connected and no active session
  if (isConnected && !isSessionActive && !isLoading) {
    console.log('SessionManager - Rendering session creation form')
    return (
      <div className="space-y-6">
        {/* Chain Warning */}
        {chain && chain.id !== 195 && (
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
                  placeholder="60"
                  min="1"
                  max="1440"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  minutes
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Recommended: 60 (1h) or 1440 (24h). Max: 1440 minutes (24h)
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
                  placeholder="100"
                  min="1"
                  step="0.01"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  USD
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Maximum amount you can spend during this session (in USD)
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
              <div className="w-2 h-2 bg-blue-400 animate-pulse"></div>
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
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm mb-4"
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

        {/* Clean Old Sessions Button */}
        <button
          onClick={async () => {
            if (!address) {
              setError('Please connect your wallet first')
              return
            }
            
            try {
              setError('Cleaning old sessions...')
              const success = await forceExpireSession()
              
              if (success) {
                setError('Old sessions cleaned successfully! You can now create a new one.')
                setTimeout(() => setError(null), 5000)
              }
            } catch (error) {
              console.error('Error cleaning sessions:', error)
              setError('Error cleaning sessions. Please try again.')
            }
          }}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm mb-4"
        >
          🧹 Clean Old Sessions
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

        {/* Trading Interface Unlock Notice */}
        <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="font-semibold text-green-400">Trading Interface Unlock</span>
          </div>
          <p className="text-sm text-green-300 mb-2">
            Once you create a session, the trading interface will automatically unlock below.
          </p>
          <div className="flex items-center space-x-2 text-xs text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Access OKX DEX trading</span>
          </div>
        </div>
      </div>
    )
  }

  // Show active session info
  if (isSessionActive) {
    return (
      <div className="space-y-6">
        {/* Active Session Display */}
        <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold text-green-400">Active Trading Session</h3>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Time Remaining</div>
              <div className="text-lg font-bold text-white">{getTimeRemaining()}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-400">Spending Limit</div>
              <div className="text-lg font-semibold text-white">${session?.spendLimit}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Amount Spent</div>
              <div className="text-lg font-semibold text-white">${session?.spent || 0}</div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Spending Progress</span>
              <span>{getSpentPercentage().toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(getSpentPercentage(), 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-green-300">
            <Zap className="w-4 h-4" />
            <span>Trading interface unlocked below</span>
          </div>
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
      <p className="text-gray-400 text-sm">Please try refreshing the page</p>
    </div>
  )
} 