'use client'

import { useState } from 'react'
import { SessionManager } from '@/components/session-manager'
import TradeInterface from '@/components/trade-interface'
import { Header } from '@/components/header'

export default function Home() {
  const [session, setSession] = useState<any>(null)

  return (
    <main className="min-h-screen bg-gray-900">
      <Header />
      
      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Trading Dashboard Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Trading Dashboard</h1>
                <p className="text-gray-400 text-base">Secure trading with session limits on XLayer</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-base font-medium">XLayer Network</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Management - Top Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Session Management</h3>
                  <p className="text-gray-400 text-sm">Manage your trading limits and security</p>
                </div>
              </div>
              <SessionManager 
                session={session} 
                onSessionChange={setSession} 
              />
            </div>
          </div>

          {/* Trading Interface - Bottom Section */}
          <div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Trading Interface</h3>
                  <p className="text-gray-400 text-sm">Execute orders on OKX DEX</p>
                </div>
              </div>
              <TradeInterface />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 