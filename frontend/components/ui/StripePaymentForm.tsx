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

// This component previously used manual window.Stripe integration, which is now deprecated in favor of the official React Stripe Embedded Checkout.
// If you need a custom payment form, refactor this file to use @stripe/react-stripe-js and @stripe/stripe-js.
// Otherwise, you can safely delete this file.

// export default function StripePaymentForm() {
//   // Deprecated: Use StripeEmbeddedCheckout instead
//   return null;
// } 