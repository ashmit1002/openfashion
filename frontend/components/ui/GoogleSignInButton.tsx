"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface GoogleSignInButtonProps {
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  children?: React.ReactNode
}

export function GoogleSignInButton({ 
  className = "", 
  variant = "outline", 
  size = "default",
  children 
}: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    
    // Mobile detection and debugging
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /android/i.test(navigator.userAgent)
    
    console.log('🔍 Google Sign-in Debug:', {
      isMobile,
      isIOS,
      isAndroid,
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      apiUrl: process.env.NEXT_PUBLIC_API_URL
    })

    try {
      await loginWithGoogle()
    } catch (error) {
      console.error('❌ Google sign-in error:', error)
      
      // Provide mobile-specific error messages
      if (isMobile) {
        if (window.location.protocol === 'http:') {
          toast.error("HTTPS Required", {
            description: "Google sign-in requires HTTPS. Please use a secure connection."
          })
        } else if (isIOS) {
          toast.error("iOS Safari Issue", {
            description: "Try using Chrome or Safari in private browsing mode."
          })
        } else if (isAndroid) {
          toast.error("Android Browser Issue", {
            description: "Try using Chrome or clear your browser cache."
          })
        } else {
          toast.error("Mobile Browser Issue", {
            description: "Please try using a different browser or desktop."
          })
        }
      } else {
        toast.error("Google sign-in failed", {
          description: "Please try again or contact support."
        })
      }
      
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={`w-full ${className}`}
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {children || "Continue with Google"}
    </Button>
  )
} 