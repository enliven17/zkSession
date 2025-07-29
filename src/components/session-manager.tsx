'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
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
  const { address, isConnected } = useAccount()
  const [duration, setDuration] = useState('86400')
  const [spendLimit, setSpendLimit] = useState('500')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Check for existing session when address changes (wallet connects/disconnects)
    if (address && (window as any).ethereum) {
      console.log('Wallet connected, checking for existing session:', address)
      checkExistingSession()
    } else if (!address) {
      // Clear session when wallet disconnects
      console.log('Wallet disconnected, clearing session')
      onSessionChange(null)
    }
  }, [address])

  const checkExistingSession = async () => {
    try {
      console.log('Checking existing session for address:', address)
      console.log('Contract address:', SESSION_CONTRACT_ADDRESS)
      
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      const contract = new ethers.Contract(SESSION_CONTRACT_ADDRESS, SESSION_CONTRACT_ABI, provider)
      
      console.log('Calling getSession...')
      const existingSession = await contract.getSession(address)
      
      console.log('Raw session data from contract:', existingSession)
      
      if (existingSession && existingSession.isActive && address) {
        console.log('Active session found!')
        const sessionData = {
          user: address,
          expiry: existingSession.expiry.toNumber() * 1000, // Convert to milliseconds
          spendLimit: existingSession.spendLimit.toNumber(),
          spent: existingSession.spent.toNumber(),
        }
        console.log('Processed session data:', sessionData)
        onSessionChange(sessionData)
      } else {
        console.log('No active session found or session is inactive')
        console.log('existingSession:', existingSession)
        console.log('existingSession.isActive:', existingSession?.isActive)
      }
    } catch (error: any) {
      console.error('Error checking existing session:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data
      })
    }
  }

  const createSessionWithEthers = async () => {
    if (!(window as any).ethereum || !address) return

    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(SESSION_CONTRACT_ADDRESS, SESSION_CONTRACT_ABI, signer)

      console.log('Creating session with ethers:', {
        duration: BigInt(duration),
        spendLimit: BigInt(spendLimit),
        address: SESSION_CONTRACT_ADDRESS
      })

      const tx = await contract.createSession(BigInt(duration), BigInt(spendLimit))
      setTransactionHash(tx.hash)
      
      console.log('Transaction sent:', tx.hash)
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)
      
      setIsCreating(false)
      setError(null)
      
      // Create session data
      const sessionData = {
        user: address,
        expiry: Date.now() + parseInt(duration) * 1000,
        spendLimit: parseInt(spendLimit),
        spent: 0,
      }
      onSessionChange(sessionData)
      
    } catch (error: any) {
      console.error('Error creating session:', error)
      
      // Check if session already exists
      if (error.message && error.message.includes('Session already exists')) {
        setError('Session already exists for this address. Please use a different wallet or wait for the current session to expire.')
        
        // Try to get existing session
        try {
          const provider = new ethers.providers.Web3Provider((window as any).ethereum)
          const contract = new ethers.Contract(SESSION_CONTRACT_ADDRESS, SESSION_CONTRACT_ABI, provider)
          const existingSession = await contract.getSession(address)
          
          console.log('Existing session found:', existingSession)
          
          if (existingSession && existingSession.isActive) {
            const sessionData = {
              user: address,
              expiry: existingSession.expiry.toNumber() * 1000, // Convert to milliseconds
              spendLimit: existingSession.spendLimit.toNumber(),
              spent: existingSession.spent.toNumber(),
            }
            onSessionChange(sessionData)
          }
        } catch (getSessionError) {
          console.error('Error getting existing session:', getSessionError)
        }
      } else {
        setError(error.message || 'Failed to create session')
      }
      setIsCreating(false)
    }
  }

  if (!mounted) {
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
    setIsCreating(true)
    
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

  if (!isConnected) {
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

  return (
    <div className="space-y-6">
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