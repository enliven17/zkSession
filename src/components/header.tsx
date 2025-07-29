'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut, Shield } from 'lucide-react'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <header className="bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">zkSession</span>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 bg-gray-800 px-2 py-1.5 rounded border border-gray-700">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-300 font-medium">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors border border-gray-700 text-xs"
                >
                  <LogOut className="h-3 w-3" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 text-sm"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 