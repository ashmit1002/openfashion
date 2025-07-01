'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Crown, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PremiumSuccessPage() {
  const { user, refreshUser } = useAuth()
  const [checking, setChecking] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const router = useRouter()

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
  }

  useEffect(() => {
    let attempts = 0
    let interval: NodeJS.Timeout

    const poll = async () => {
      attempts++
      addDebugInfo(`Attempt ${attempts}: Current status = ${user?.subscription_status || 'null'}`)
      
      try {
        await refreshUser?.()
        addDebugInfo(`After refresh: status = ${user?.subscription_status || 'null'}`)
        
        if (user?.subscription_status === 'premium') {
          addDebugInfo('Premium detected!')
          setIsPremium(true)
          setChecking(false)
          clearInterval(interval)
          setTimeout(() => router.push('/'), 2000)
        } else if (attempts >= 10) {
          addDebugInfo('Max attempts reached')
          setChecking(false)
          clearInterval(interval)
        }
      } catch (error) {
        addDebugInfo(`Error: ${error}`)
      }
    }

    interval = setInterval(poll, 2000)
    poll()

    return () => clearInterval(interval)
  }, [user, refreshUser, router])

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <div className="text-lg font-semibold">Finalizing your premium upgrade...</div>
        <div className="text-sm text-gray-500 mt-2">This may take a few seconds after payment.</div>
        
        {/* Debug info */}
        <div className="mt-8 p-4 bg-gray-100 rounded max-w-md">
          <div className="text-sm font-semibold mb-2">Debug Info:</div>
          {debugInfo.map((info, index) => (
            <div key={index} className="text-xs text-gray-600">{info}</div>
          ))}
        </div>
      </div>
    )
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-pink-50 flex items-center justify-center py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="text-center p-8 shadow-2xl">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Premium!
              </h1>
              <p className="text-lg text-gray-600">
                Your subscription has been activated successfully. You now have access to all premium features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Unlimited Uploads</h3>
                <p className="text-sm text-gray-600">No more weekly limits</p>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                  <Crown className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Advanced Search</h3>
                <p className="text-sm text-gray-600">Enhanced SerpAPI features</p>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Priority Support</h3>
                <p className="text-sm text-gray-600">Get help faster</p>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => router.push('/')}
                className="w-full bg-meta-pink hover:bg-meta-pink/90 text-white"
              >
                Start Using Premium Features
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/closet')}
                className="w-full"
              >
                View My Closet
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need help? Contact our support team at{' '}
                <a href="mailto:support@openfashion.com" className="text-meta-pink hover:underline">
                  support@openfashion.com
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-xl font-bold text-red-500 mb-2">Upgrade not detected</div>
      <div className="text-gray-600 mb-4">If you completed payment, please refresh or contact support.</div>
      
      {/* Debug info */}
      <div className="mt-4 p-4 bg-gray-100 rounded max-w-md">
        <div className="text-sm font-semibold mb-2">Debug Info:</div>
        {debugInfo.map((info, index) => (
          <div key={index} className="text-xs text-gray-600">{info}</div>
        ))}
      </div>
      
      <button
        className="px-4 py-2 bg-meta-pink text-white rounded mt-4"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  )
} 