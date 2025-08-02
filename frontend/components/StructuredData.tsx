'use client'

import { useEffect } from 'react'

interface StructuredDataProps {
  type: 'website' | 'organization' | 'webapp' | 'article'
  data: any
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    // Remove existing structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]')
    existingScripts.forEach(script => script.remove())

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(data)
    document.head.appendChild(script)

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [data])

  return null
}

// Website schema for homepage
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "OpenFashion",
  "description": "AI-powered fashion analyzer and style discovery platform",
  "url": "https://www.openfashionapp.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.openfashionapp.com/fashion-search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "sameAs": [
    "https://twitter.com/openfashion",
    "https://instagram.com/openfashion"
  ]
}

// Organization schema
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "OpenFashion",
  "description": "AI-powered fashion technology company",
  "url": "https://www.openfashionapp.com",
  "logo": "https://www.openfashionapp.com/favicon-32x32.png",
  "foundingDate": "2024",
  "sameAs": [
    "https://twitter.com/openfashion",
    "https://instagram.com/openfashion"
  ]
}

// WebApplication schema
export const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "OpenFashion",
  "description": "AI-powered fashion analyzer and style discovery platform",
  "url": "https://www.openfashionapp.com",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free fashion analysis with premium features available"
  },
  "featureList": [
    "AI-powered image analysis",
    "Reverse image search for clothing",
    "Style recommendations",
    "Wardrobe organization",
    "Personalized style chatbot"
  ],
  "screenshot": "https://www.openfashionapp.com/opengraph-image",
  "author": {
    "@type": "Organization",
    "name": "OpenFashion"
  }
}

// SoftwareApplication schema for AI features
export const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "OpenFashion AI Analyzer",
  "description": "AI-powered fashion image analysis and style discovery tool",
  "url": "https://www.openfashionapp.com",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "AI image recognition",
    "Fashion item identification",
    "Color and pattern analysis",
    "Style categorization",
    "Shopping recommendations"
  ],
  "author": {
    "@type": "Organization",
    "name": "OpenFashion"
  }
} 