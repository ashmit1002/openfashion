'use client'

import Script from 'next/script'
import { useEffect } from 'react'

const GA_MEASUREMENT_ID = 'G-65LV693YXF'

export default function GoogleAnalytics() {
  useEffect(() => {
    // Debug: Check if gtag is loaded
    const checkGtag = () => {
      if (typeof window !== 'undefined' && window.gtag) {
        console.log('✅ Google Analytics loaded successfully')
        // Send a test event
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
        })
      } else {
        console.log('⏳ Waiting for Google Analytics to load...')
        setTimeout(checkGtag, 1000)
      }
    }
    
    checkGtag()
  }, [])

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('📊 Google Analytics script loaded')
        }}
        onError={() => {
          console.error('❌ Failed to load Google Analytics script')
        }}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_title: document.title,
            page_location: window.location.href,
          });
          console.log('🎯 Google Analytics configured with ID: ${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  )
} 