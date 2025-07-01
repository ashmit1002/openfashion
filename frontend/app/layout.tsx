import type React from "react"
// frontend/app/layout.tsx

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { ShoppingBag, Menu, Heart } from "lucide-react"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "sonner"
import { NavLinks } from "@/components/NavLinks"
import { UserAccountButton } from "@/components/UserAccountButton"
import MobileNav from "@/components/MobileNav"
import StyleChatbot from "@/components/ui/StyleChatbot"
import PremiumBanner from '@/components/PremiumBanner'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OpenFashion",
  description: "AI-powered fashion analyzer",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-32x32.png" type="image/x-icon" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-white`}>
        <AuthProvider>
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
                <div className="text-sm text-gray-500">
                  © {new Date().getFullYear()} OpenFashion. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
          <Toaster position="top-right" />
          <MobileNav />
          <StyleChatbot />
        </AuthProvider>
      </body>
    </html>
  )
}
