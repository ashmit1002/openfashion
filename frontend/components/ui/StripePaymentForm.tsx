'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CreditCard, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface StripePaymentFormProps {
  priceId: string
  tierName: string
  onSuccess: () => void
  onCancel: () => void
}

declare global {
  interface Window {
    Stripe: any
  }
}

export default function StripePaymentForm({ priceId, tierName, onSuccess, onCancel }: StripePaymentFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stripe, setStripe] = useState<any>(null)
  const [elements, setElements] = useState<any>(null)
  const [paymentElement, setPaymentElement] = useState<any>(null)
  const [setupClientSecret, setSetupClientSecret] = useState<string>('')
  const [customerId, setCustomerId] = useState<string>('')
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const paymentElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Stripe.js
    if (!window.Stripe) {
      const script = document.createElement('script')
      script.src = 'https://js.stripe.com/v3/'
      script.onload = () => {
        const stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        setStripe(stripeInstance)
      }
      document.head.appendChild(script)
    } else {
      const stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      setStripe(stripeInstance)
    }
  }, [])

  useEffect(() => {
    if (stripe && user) {
      initializeSetupIntent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, user])

  const initializeSetupIntent = async () => {
    try {
      setLoading(true)
      // Step 1: Create SetupIntent and get customer
      const setupIntentResponse = await api.post('/subscription/create-setup-intent')
      const { client_secret, customer_id } = setupIntentResponse.data
      setSetupClientSecret(client_secret)
      setCustomerId(customer_id)
      // Step 2: Set up Elements
      const elementsInstance = stripe.elements({
        clientSecret: client_secret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#ec4899',
          },
        },
      })
      setElements(elementsInstance)
      setPaymentElement(null) // Reset before mounting

      // Only mount if the ref is available and not already mounted
      if (paymentElementRef.current && !paymentElement) {
        const paymentElementInstance = elementsInstance.create('payment', { layout: 'tabs' })
        paymentElementInstance.mount(paymentElementRef.current)
        setPaymentElement(paymentElementInstance)
        setPaymentElementReady(true)
      }
    } catch (error) {
      console.error('Error initializing payment:', error)
      toast.error('Failed to initialize payment form')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements || !paymentElementReady) {
      toast.error('Payment form is not ready. Please wait a moment and try again.')
      return
    }
    setLoading(true)
    try {
      // Step 1: Confirm SetupIntent to get payment method
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/premium/success',
        },
        redirect: 'if_required',
      })
      if (error) {
        toast.error(error.message || 'Payment method setup failed')
        setLoading(false)
        return
      }
      const paymentMethodId = setupIntent.payment_method
      // Step 2: Create subscription with payment method
      const subscriptionResponse = await api.post('/subscription/create-subscription-with-payment-method', {
        customer_id: customerId,
        payment_method_id: paymentMethodId,
        price_id: priceId
      })
      const { client_secret } = subscriptionResponse.data
      if (client_secret) {
        // Optionally, confirm the payment if required (for SCA, etc.)
        const { error: confirmError } = await stripe.confirmCardPayment(client_secret)
        if (confirmError) {
          toast.error(confirmError.message || 'Payment failed')
          setLoading(false)
          return
        }
      }
      toast.success('Payment successful! Redirecting...')
      onSuccess()
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !setupClientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Setting up payment form...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Complete Payment</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            You're upgrading to the <strong>{tierName}</strong> plan for $5.00/month.
          </div>
          <div ref={paymentElementRef} id="payment-element" className="mb-4">
            {/* Stripe Payment Element will be mounted here */}
          </div>
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || !elements || !paymentElementReady || loading}
              className="flex-1 bg-meta-pink hover:bg-meta-pink/90"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Subscribe</span>
                </div>
              )}
            </Button>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Your payment is secure and encrypted. You can cancel your subscription at any time.
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 