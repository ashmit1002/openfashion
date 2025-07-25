'use client'

import Link from "next/link"
import { Search, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import UserSearchDropdown from "@/components/UserSearchDropdown"

export function NavLinks() {
  const { user } = useAuth();
  return (
    <nav className="hidden md:flex items-center justify-between w-full px-8">
      {/* Left: Nav links */}
      <div className="flex items-center space-x-1">
      <Link href="/" className="px-3 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">Home</Link>
      <Link href="/closet" className="px-3 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">My Closet</Link>
      <Link href="/explore" className="px-3 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">Explore</Link>
      {user && (
        <>
          <Link href="/chat" className="px-3 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>Style Chat</span>
          </Link>
          <Link href="/analysis-jobs" className="px-3 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">Analysis History</Link>
        </>
      )}
      </div>
      {/* Center: Search bar */}
      <div className="flex-1 flex justify-center">
        <UserSearchDropdown />
      </div>
      {/* Right: (empty for now, add profile/avatar here if needed) */}
      <div className="w-32" />
    </nav>
  );
} 