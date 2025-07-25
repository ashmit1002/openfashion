'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { trackCustomEvent, trackPageView } from '@/lib/analytics'

export default function TestAnalyticsPage() {
  useEffect(() => {
    // Track page view
    trackPageView('/test-analytics', 'Analytics Test Page')
    
    // Send a test event
    trackCustomEvent('analytics_test', {
      test_type: 'page_load',
      timestamp: new Date().toISOString()
    })
  }, [])

  const handleTestEvent = () => {
    trackCustomEvent('analytics_test', {
      test_type: 'button_click',
      timestamp: new Date().toISOString()
    })
    alert('Test event sent! Check Google Analytics Real-time reports.')
  }

  const handleTestRegistration = () => {
    trackCustomEvent('sign_up', {
      method: 'test',
      custom_parameter: 'fashion_app_registration'
    })
    alert('Test registration event sent!')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Google Analytics Test Page
          </h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                How to Test
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Open your Google Analytics dashboard</li>
                <li>Go to <strong>Reports → Realtime → Overview</strong></li>
                <li>You should see this page in the "Active users" section</li>
                <li>Click the buttons below to test custom events</li>
                <li>Check the "Events" section in real-time reports</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleTestEvent}
                className="w-full"
              >
                Send Test Event
              </Button>
              
              <Button 
                onClick={handleTestRegistration}
                variant="outline"
                className="w-full"
              >
                Test Registration Event
              </Button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Debug Information
              </h3>
              <p className="text-yellow-800 mb-2">
                Open browser console (F12) to see debug messages:
              </p>
              <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
                <li>✅ Google Analytics loaded successfully</li>
                <li>📊 Google Analytics script loaded</li>
                <li>🎯 Google Analytics configured with ID: G-65LV693YXF</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Expected Results
              </h3>
              <ul className="list-disc list-inside space-y-1 text-green-800">
                <li>Page view should appear in real-time reports</li>
                <li>Custom events should show in Events section</li>
                <li>No console errors related to gtag</li>
                <li>Network requests to googletagmanager.com</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 