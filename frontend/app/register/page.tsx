"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleSignInButton } from "@/components/ui/GoogleSignInButton"
import Link from "next/link"
import { Eye, EyeOff, UserPlus, ShoppingBag, CheckCircle, XCircle } from "lucide-react"
import { trackRegistration, trackFunnelStep } from "@/lib/analytics"
import { validateEmail, validatePassword, validateUsername } from "@/lib/validation"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register } = useAuth()

  // Handle Google OAuth callback
  useEffect(() => {
    const googleToken = searchParams.get('google_token')
    const needsQuiz = searchParams.get('needs_quiz')
    const isNewUser = searchParams.get('is_new_user')
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    if (error) {
      setError(message || 'Google authentication failed')
      return
    }

    if (googleToken) {
      // Store the token and redirect
      localStorage.setItem('token', googleToken)
      const redirectPath = needsQuiz === 'true' ? '/preferences' : '/closet'
      router.push(redirectPath)
    }
  }, [searchParams, router])

  // Validation handlers
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    const validation = validateEmail(value)
    setEmailError(validation.error || "")
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)
    const validation = validateUsername(value)
    setUsernameError(validation.error || "")
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    const validation = validatePassword(value)
    setPasswordError(validation.error || "")
    
    // Clear confirm password error if passwords now match
    if (confirmPassword && value === confirmPassword) {
      setConfirmPasswordError("")
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    
    if (password && value !== password) {
      setConfirmPasswordError("Passwords do not match")
    } else {
      setConfirmPasswordError("")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const emailValidation = validateEmail(email)
    const usernameValidation = validateUsername(username)
    const passwordValidation = validatePassword(password)
    
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || "")
      return
    }
    
    if (!usernameValidation.isValid) {
      setUsernameError(usernameValidation.error || "")
      return
    }
    
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || "")
      return
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Track funnel step
      trackFunnelStep('registration_started', 1)
      
      await register(email, password, username)
      
      // Track successful registration
      trackRegistration('email')
      trackFunnelStep('registration_completed', 2)
      
      setSuccess("Registration successful! Redirecting to style quiz...")
      router.push("/preferences")
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(Array.isArray(err.response.data.detail) 
          ? err.response.data.detail[0].msg 
          : err.response.data.detail)
      } else {
        setError("Registration failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg border-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-meta-pink/20 to-blue-500/20 opacity-10"></div>
        <div className="flex justify-center pt-8">
          <div className="rounded-full bg-meta-pink p-2 shadow-md">
            <ShoppingBag className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardHeader className="space-y-1 relative">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">Enter your details to create your account</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm">
              {success}
            </div>
          )}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="name@example.com"
                  required
                  className={`w-full pr-10 ${emailError ? 'border-red-500' : email && !emailError ? 'border-green-500' : ''}`}
                  disabled={isLoading}
                />
                {email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailError ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {emailError && (
                <p className="text-sm text-red-500">{emailError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Username
              </label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="johndoe"
                  required
                  className={`w-full pr-10 ${usernameError ? 'border-red-500' : username && !usernameError ? 'border-green-500' : ''}`}
                  disabled={isLoading}
                />
                {username && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameError ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {usernameError && (
                <p className="text-sm text-red-500">{usernameError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                  className={`w-full pr-10 ${passwordError ? 'border-red-500' : password && !passwordError ? 'border-green-500' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="••••••••"
                  required
                  className={`w-full pr-10 ${confirmPasswordError ? 'border-red-500' : confirmPassword && !confirmPasswordError ? 'border-green-500' : ''}`}
                  disabled={isLoading}
                />
                {confirmPassword && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {confirmPasswordError ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {confirmPasswordError && (
                <p className="text-sm text-red-500">{confirmPasswordError}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-meta-pink hover:bg-meta-pink/90 text-white" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <UserPlus className="mr-2 h-4 w-4" /> Create Account
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 relative pb-8">
          <div className="relative flex items-center w-full">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          <GoogleSignInButton />
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-meta-pink hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
