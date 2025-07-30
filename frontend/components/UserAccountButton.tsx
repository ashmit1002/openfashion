'use client'

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, Book, Crown, Sparkles, XCircle, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { subscription } from "@/lib/api"
import api from "@/lib/api"
import { useState, useEffect } from "react"
import { useSearchLimit } from "@/contexts/SearchLimitContext"

export function UserAccountButton() {
  const { user, logout, refreshUser } = useAuth()
  const router = useRouter()
  const { searchLimit, updateSearchLimit } = useSearchLimit()

  // Fetch search limit when component mounts and listen for updates
  useEffect(() => {
    const fetchSearchLimit = async () => {
      if (user) {
        try {
          const response = await api.get('/fashion/fashion-search/limit')
          updateSearchLimit(response.data)
        } catch (error) {
          console.error('Failed to fetch search limit:', error)
        }
      }
    }

    const handleSearchLimitUpdate = (event: CustomEvent) => {
      console.log('UserAccountButton received searchLimitUpdated event:', event.detail);
      updateSearchLimit(event.detail)
    }

    // Fetch initial limit
    fetchSearchLimit()

    // Listen for updates from other components
    window.addEventListener('searchLimitUpdated', handleSearchLimitUpdate as EventListener)
    
    return () => {
      window.removeEventListener('searchLimitUpdated', handleSearchLimitUpdate as EventListener)
    }
  }, [user, updateSearchLimit]) // Include updateSearchLimit in dependencies

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="sm" className="rounded-full">
          <User className="h-4 w-4 mr-1" /> Login
        </Button>
      </Link>
    )
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including your closet, wishlist, and profile.')) {
      try {
        await api.delete('/users/account')
        toast.success('Account deleted successfully')
        await logout()
        router.push('/')
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to delete account')
      }
    }
  }

  const isPremium = user.subscription_status === 'premium'

  // TODO: Replace with actual subscription ID from user object or fetch from backend
  const subscriptionId = user.stripe_subscription_id || null

  const handleCancelPremium = async () => {
    try {
      await subscription.cancelSubscription()
      toast.success('Your premium will remain active until the end of your billing period. You will be downgraded to Basic after that.')
      await refreshUser?.()
    } catch (error) {
      toast.error('Failed to cancel subscription. Please try again or contact support.')
    }
  }

  console.log('UserAccountButton user:', user)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full p-0 h-8 w-8 overflow-hidden">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.display_name || user.username}
              width={32}
              height={32}
              className="rounded-full object-cover w-full h-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {(user.display_name?.[0] || user.username[0]).toUpperCase()}
              </span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{user.display_name || user.username}</p>
              {isPremium ? (
                <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </div>
              ) : (
                <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                  Free
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">@{user.username}</p>
            {!isPremium && (
              <div className="text-xs text-gray-400 mt-1 space-y-1">
                <div>{user.weekly_uploads_used}/3 uploads this week</div>
                {searchLimit && (
                  <div>{searchLimit.used}/{searchLimit.limit} searches this week</div>
                )}
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/closet" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/edit" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/preferences" className="cursor-pointer">
            <Book className="mr-2 h-4 w-4" />
            <span>Preferences</span>
          </Link>
        </DropdownMenuItem>
        {!isPremium && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/premium" className="cursor-pointer">
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Get Premium</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {user.subscription_status === 'premium' && (
          <>
            <DropdownMenuSeparator />
            {user.pending_cancellation ? (
              <DropdownMenuItem disabled className="cursor-not-allowed text-gray-400">
                <XCircle className="mr-2 h-4 w-4" />
                <span>Cancelled</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={handleCancelPremium}
                className="cursor-pointer text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                <span>Cancel Premium</span>
              </DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDeleteAccount} className="cursor-pointer text-red-600 hover:text-red-700">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Account</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 