import type React from "react"
// frontend/app/layout.tsx

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { ShoppingBag, User, LogIn, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OpenFashion",
  description: "AI-powered fashion analyzer",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}>
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <ShoppingBag className="h-8 w-8 text-meta-pink mr-2" />
                  <span className="text-xl font-bold text-gray-900">OpenFashion</span>
                </Link>
              </div>

              <nav className="hidden md:flex items-center space-x-4">
                <Link href="/" className="text-gray-700 hover:text-meta-pink px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                <Link
                  href="/closet"
                  className="text-gray-700 hover:text-meta-pink px-3 py-2 rounded-md text-sm font-medium"
                >
                  My Closet
                </Link>
                <div className="h-6 border-l border-gray-300 mx-2"></div>
                <Link href="/login">
                  <Button variant="outline" size="sm" className="mr-2">
                    <LogIn className="h-4 w-4 mr-1" /> Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-meta-pink hover:bg-meta-pink/90 text-white" size="sm">
                    <User className="h-4 w-4 mr-1" /> Register
                  </Button>
                </Link>
              </nav>

              <div className="md:hidden">
                <button className="text-gray-700 hover:text-meta-pink">
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <ShoppingBag className="h-6 w-6 text-meta-pink mr-2" />
                <span className="font-medium">OpenFashion</span>
              </div>
              <div className="text-sm text-gray-500">
                © {new Date().getFullYear()} OpenFashion. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
