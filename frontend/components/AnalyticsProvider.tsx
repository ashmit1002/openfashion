'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initGA, trackPageView, setUserProperties } from '@/lib/analytics'
import { useAuth } from '@/contexts/AuthContext'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  // Initialize Google Analytics on mount
  useEffect(() => {
    initGA()
  }, [])

  // Track page views
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname)
    }
  }, [pathname])

  // Set user properties when user changes
  useEffect(() => {
    if (user) {
      setUserProperties({
        user_type: user.subscription_status as 'free' | 'premium',
        subscription_tier: user.subscription_tier,
        weekly_uploads_used: user.weekly_uploads_used,
        join_date: new Date().toISOString() // Using current date as fallback
      })
    }
  }, [user])

  return <>{children}</>
} 