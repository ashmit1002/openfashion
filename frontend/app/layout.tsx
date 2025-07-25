import type React from "react"
// frontend/app/layout.tsx

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { ShoppingBag, Menu, Heart } from "lucide-react"
import { AuthProvider } from "@/contexts/AuthContext"
import { SearchLimitProvider } from "@/contexts/SearchLimitContext"
import { Toaster } from "sonner"
import { NavLinks } from "@/components/NavLinks"
import { UserAccountButton } from "@/components/UserAccountButton"
import MobileNav from "@/components/MobileNav"
import StyleChatbot from "@/components/ui/StyleChatbot"
import PremiumBanner from '@/components/PremiumBanner'
import { AnalyticsProvider } from "@/components/AnalyticsProvider"
import GoogleAnalytics from "@/components/GoogleAnalytics"
import StructuredData, { websiteSchema, organizationSchema, webAppSchema } from "@/components/StructuredData"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "OpenFashion - AI-Powered Fashion Analyzer & Style Discovery",
    template: "%s | OpenFashion"
  },
  description: "Discover your perfect style with OpenFashion's AI-powered fashion analyzer. Upload clothing images, find similar items, get personalized style recommendations, and organize your digital wardrobe. Free fashion analysis and reverse image search.",
  keywords: [
    "AI fashion analyzer",
    "reverse image search clothing",
    "style discovery",
    "fashion image recognition",
    "wardrobe organization",
    "style chatbot",
    "fashion recommendations",
    "clothing search",
    "fashion AI",
    "style analysis"
  ],
  authors: [{ name: "OpenFashion" }],
  creator: "OpenFashion",
  publisher: "OpenFashion",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://openfashion.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://openfashion.vercel.app',
    title: 'OpenFashion - AI-Powered Fashion Analyzer & Style Discovery',
    description: 'Discover your perfect style with AI-powered fashion analysis. Upload clothing images, find similar items, and get personalized style recommendations.',
    siteName: 'OpenFashion',
    images: [
      {
        url: 'https://openfashion.vercel.app/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'OpenFashion - AI-Powered Fashion Analyzer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenFashion - AI-Powered Fashion Analyzer & Style Discovery',
    description: 'Discover your perfect style with AI-powered fashion analysis. Upload clothing images, find similar items, and get personalized style recommendations.',
    images: ['https://openfashion.vercel.app/opengraph-image'],
    creator: '@openfashion',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '5d-WuFDX_2or2hsorDFUWwWvjzhaHann5hniQyialFw',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-32x32.png" type="image/x-icon" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-white`}>
        <GoogleAnalytics />
        <StructuredData type="website" data={websiteSchema} />
        <StructuredData type="organization" data={organizationSchema} />
        <StructuredData type="webapp" data={webAppSchema} />
        <AuthProvider>
          <SearchLimitProvider>
            <AnalyticsProvider>
              <PremiumBanner />
          <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-40 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center">
                    <ShoppingBag className="h-6 w-6 text-meta-pink" />
                    <span className="font-semibold text-lg ml-2">OpenFashion</span>
                  </Link>
                  <NavLinks />
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/wishlist">
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <Heart className="h-5 w-5 text-gray-600" />
                    </button>
                  </Link>
                  <div className="h-6 border-l border-gray-200 mx-2" />
                  <UserAccountButton />
                </div>

                <button className="md:hidden p-2 rounded-full hover:bg-gray-100">
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="pt-16">{children}</main>

          <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-4 md:mb-0">
                  <ShoppingBag className="h-5 w-5 text-meta-pink" />
                  <span className="font-medium ml-2">OpenFashion</span>
                </div>
                <div className="text-sm text-gray-500 mb-4 md:mb-0">
                  Found a bug or feature idea? Email us at{' '}
                  <a 
                    href="mailto:openfashion.dev@gmail.com" 
                    className="text-meta-pink hover:text-meta-pink/80 font-medium transition-colors"
                  >
                    openfashion.dev@gmail.com
                  </a>
                </div>
                <div className="text-sm text-gray-500">
                  © {new Date().getFullYear()} OpenFashion. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
          <Toaster position="top-right" />
          <MobileNav />
          <StyleChatbot />
            </AnalyticsProvider>
            </SearchLimitProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
