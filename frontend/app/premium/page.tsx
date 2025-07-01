'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Check, Crown, Sparkles, Zap, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import StripePaymentForm from '@/components/ui/StripePaymentForm'

interface SubscriptionTier {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  features: string[]
  upload_limit: number | null
  description: string
}

export default function PremiumPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'checkout' | 'embedded'>('checkout')

  useEffect(() => {
    fetchTiers()
  }, [])

  const fetchTiers = async () => {
    try {
      const response = await api.get('/subscription/tiers')
      setTiers(response.data.tiers)
    } catch (error) {
      console.error('Error fetching tiers:', error)
      toast.error('Failed to load subscription tiers')
    }
  }

  const handleUpgrade = async (tierId: string) => {
    if (!user) {
      toast.error('Please log in to upgrade')
      return
    }

    // Don't allow upgrading to Basic (it's free)
    if (tierId === 'basic' || tierId === 'price_basic_monthly') {
      toast.info('Basic plan is already free!')
      return
    }

    setSelectedTier(tierId)

    if (paymentMethod === 'checkout') {
      // Use Stripe Checkout
      setLoading(true)
      try {
        const response = await api.post('/subscription/create-checkout-session', {
          tier_id: tierId,
          success_url: `${window.location.origin}/premium/success`,
          cancel_url: `${window.location.origin}/premium`
        })

        // Redirect to Stripe checkout
        window.location.href = response.data.url
      } catch (error) {
        console.error('Error creating checkout session:', error)
        toast.error('Failed to start checkout process')
        setLoading(false)
        setSelectedTier(null)
      }
    } else {
      // Use embedded form
      setShowPaymentForm(true)
    }
  }

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false)
    setSelectedTier(null)
    toast.success('Payment successful! Redirecting...')
    router.push('/premium/success')
  }

  const handlePaymentCancel = () => {
    setShowPaymentForm(false)
    setSelectedTier(null)
  }

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'basic':
        return <Sparkles className="h-6 w-6" />
      case 'premium':
        return <Crown className="h-6 w-6" />
      default:
        return <Zap className="h-6 w-6" />
    }
  }

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'basic':
        return 'bg-gradient-to-br from-gray-400 to-gray-600'
      case 'premium':
        return 'bg-gradient-to-br from-yellow-500 to-orange-600'
      default:
        return 'bg-gradient-to-br from-blue-500 to-indigo-600'
    }
  }

  if (user?.subscription_status === 'premium') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              You're Already Premium!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              You have access to all premium features. Enjoy unlimited uploads and advanced search capabilities.
            </p>
            <Button onClick={() => router.push('/')}>
              Continue Using App
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (showPaymentForm && selectedTier) {
    const tier = tiers.find(t => t.id === selectedTier)
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={handlePaymentCancel} 
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plans
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Complete Your Subscription
            </h1>
            <p className="text-lg text-gray-600">
              Secure payment powered by Stripe
            </p>
          </div>

          <StripePaymentForm
            priceId={selectedTier}
            tierName={tier?.name || 'Premium'}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with our free Basic plan or upgrade to Premium for unlimited uploads and advanced features.
          </p>
        </div>

        {/* Current Usage */}
        {user && (
          <div className="max-w-md mx-auto mb-12">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Current Usage</h3>
                  <div className="text-3xl font-bold text-meta-pink mb-2">
                    {user.weekly_uploads_used}/3
                  </div>
                  <p className="text-sm text-gray-600">uploads this week</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="max-w-md mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="checkout"
                    checked={paymentMethod === 'checkout'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'checkout' | 'embedded')}
                    className="text-meta-pink"
                  />
                  <div>
                    <div className="font-medium">Stripe Checkout</div>
                    <div className="text-sm text-gray-600">Redirect to Stripe's secure checkout page</div>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="embedded"
                    checked={paymentMethod === 'embedded'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'checkout' | 'embedded')}
                    className="text-meta-pink"
                  />
                  <div>
                    <div className="font-medium">Embedded Form</div>
                    <div className="text-sm text-gray-600">Pay directly on this page</div>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                tier.name.toLowerCase() === 'premium' ? 'ring-2 ring-meta-pink scale-105' : ''
              }`}
            >
              {tier.name.toLowerCase() === 'premium' && (
                <div className="absolute top-0 left-0 right-0 bg-meta-pink text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${getTierColor(tier.name)} text-white`}>
                  {getTierIcon(tier.name)}
                </div>
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <CardDescription className="text-gray-600">
                  {tier.description}
                </CardDescription>
                <div className="mt-4">
                  {tier.price === 0 ? (
                    <span className="text-4xl font-bold text-gray-900">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        ${tier.price}
                      </span>
                      <span className="text-gray-600">/{tier.interval}</span>
                    </>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {tier.price === 0 ? (
                  <Button 
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700"
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-meta-pink hover:bg-meta-pink/90 text-white"
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={loading && selectedTier === tier.id}
                  >
                    {loading && selectedTier === tier.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Get {tier.name}</span>
                      </div>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens to my data?</h3>
              <p className="text-gray-600">Your data is always safe. If you cancel, you can still access your uploaded images and closet items.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I change plans?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 