# OpenFashion Freemium Model Setup Guide

This guide will help you set up a freemium model for your OpenFashion app with Stripe integration for subscription management.

## Overview

The freemium model consists of two tiers:

### Basic (Free)
- 3 uploads per week
- Basic image analysis
- Standard support
- Limited SerpAPI usage

### Premium ($5/month)
- Unlimited uploads
- Advanced search features
- Priority support
- No SerpAPI restrictions

## Prerequisites

1. **Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Stripe Keys**: Get your test publishable and secret keys from the Stripe dashboard
3. **Python Environment**: Ensure you have Python 3.7+ installed
4. **Node.js**: Ensure you have Node.js 16+ installed

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install stripe python-dotenv
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51ReqBlQPE7rsnsEKExBnXkXEU0odfo5o8Cu3P7iEI2moXV6pJ8ZCzsCrjqUDPT3AJH1ND7ohmR3Z4bIDwmWQxVCR005eRnlKwV
STRIPE_PUBLISHABLE_KEY=pk_test_51ReqBlQPE7rsnsEKd0m3Eh0GkbKR1ncgck2dibedRS72JW76AOac18krNY9wcxj9LXs2h5MbLJmJRALbONlTrWkH00ydE46MtG
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here

# Other existing variables...
```

### 3. Stripe Products Setup

Run the setup script to create products and prices in Stripe:

```bash
cd backend
python setup_stripe.py
```

This will:
- List existing products and prices
- Create new products if needed
- Provide the price IDs to use in your configuration

### 4. Database Schema Updates

The user model has been extended with subscription fields:

```python
# New fields in user model
subscription_status: str = "free"  # "free" or "premium"
subscription_tier: Optional[str] = None
subscription_end_date: Optional[datetime] = None
stripe_customer_id: Optional[str] = None
weekly_uploads_used: int = 0
weekly_uploads_reset_date: Optional[datetime] = None
```

### 5. Backend Features

#### Subscription Service (`app/services/subscription_service.py`)
- Manages Stripe customer creation
- Handles subscription creation and cancellation
- Processes webhook events
- Enforces upload limits
- Tracks weekly upload usage

#### Subscription Routes (`app/routes/subscription.py`)
- `GET /api/subscription/tiers` - Get available subscription tiers
- `POST /api/subscription/create-customer` - Create Stripe customer
- `POST /api/subscription/create-subscription` - Create subscription with embedded payment
- `POST /api/subscription/create-checkout-session` - Create Stripe checkout session
- `POST /api/subscription/cancel-subscription` - Cancel subscription
- `POST /api/subscription/webhook` - Handle Stripe webhooks
- `GET /api/subscription/upload-limit` - Check user upload limits

#### Upload Limits (`app/routes/upload.py`)
- Enforces weekly upload limits for free users
- Allows unlimited uploads for premium users
- Tracks upload usage

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install @stripe/stripe-js
```

### 2. Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ReqBlQPE7rsnsEKd0m3Eh0GkbKR1ncgck2dibedRS72JW76AOac18krNY9wcxj9LXs2h5MbLJmJRALbONlTrWkH00ydE46MtG
```

### 3. Frontend Features

#### AuthContext Updates
- Includes subscription status and tier information
- Provides upload limit tracking

#### UserAccountButton Component
- Shows subscription status
- Displays "Get Premium" button for free users
- Shows "Premium" badge for premium users

#### Premium Page (`app/premium/page.tsx`)
- Displays subscription tiers
- Offers two payment options:
  - **Stripe Checkout**: Redirects to Stripe's hosted checkout page
  - **Embedded Form**: Payment form embedded directly on the page
- Shows current usage statistics
- Includes FAQ section

#### StripePaymentForm Component (`components/ui/StripePaymentForm.tsx`)
- Embedded payment form using Stripe Elements
- Handles payment confirmation
- Provides real-time validation
- Matches your app's design

#### ImageUploader Updates
- Shows upload limits for free users
- Displays upgrade prompts when limits are reached
- Tracks upload usage

## Stripe Integration Options

### Option 1: Stripe Checkout (Recommended for simplicity)
- Redirects users to Stripe's hosted checkout page
- Handles all payment methods automatically
- Built-in security and compliance
- Less custom code required

### Option 2: Embedded Payment Form
- Payment form embedded directly in your app
- More control over the user experience
- Requires more custom code
- Better for seamless user experience

## Webhook Setup

### 1. Create Webhook Endpoint

In your Stripe Dashboard:
1. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-domain.com/api/subscription/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook secret to your `.env` file

### 2. Test Webhooks Locally

Use Stripe CLI for local testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:8000/api/subscription/webhook
```

## Testing

### Test Cards

Use these test card numbers:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0025 0000 3155 | Requires authentication |
| 4000 0000 0000 9995 | Declined payment |

### Test Scenarios

1. **Free User Upload Limits**
   - Upload 3 images (should work)
   - Try to upload 4th image (should show upgrade prompt)

2. **Premium Upgrade**
   - Use Stripe Checkout
   - Use embedded payment form
   - Verify subscription status updates

3. **Webhook Processing**
   - Complete a payment
   - Check that user status updates correctly
   - Verify upload limits are removed

## Security Considerations

1. **Never expose secret keys** in frontend code
2. **Always verify webhook signatures** using the webhook secret
3. **Use HTTPS** in production for all webhook endpoints
4. **Validate subscription status** on the backend for all premium features
5. **Implement proper error handling** for failed payments

## Production Deployment

### 1. Switch to Live Keys
- Replace test keys with live keys in production
- Update webhook endpoints to production URLs
- Test thoroughly with small amounts

### 2. Environment Variables
- Set `STRIPE_SECRET_KEY` to your live secret key
- Set `STRIPE_PUBLISHABLE_KEY` to your live publishable key
- Update webhook secrets for production

### 3. Monitoring
- Set up Stripe Dashboard alerts
- Monitor webhook delivery
- Track subscription metrics
- Set up error logging

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook endpoint URL
   - Verify webhook secret
   - Check server logs for errors

2. **Payment fails**
   - Verify Stripe keys are correct
   - Check card details in test mode
   - Review error messages in browser console

3. **Subscription not updating**
   - Check webhook processing
   - Verify database updates
   - Review subscription service logs

### Debug Commands

```bash
# Check Stripe products and prices
python backend/setup_stripe.py

# Test webhook forwarding
stripe listen --forward-to localhost:8000/api/subscription/webhook

# View Stripe logs
stripe logs tail
```

## Support

For issues related to:
- **Stripe Integration**: Check [Stripe Documentation](https://stripe.com/docs)
- **OpenFashion App**: Review the codebase and logs
- **General Questions**: Check the FAQ section in the premium page

## Next Steps

1. **Customize the UI** to match your brand
2. **Add more subscription tiers** if needed
3. **Implement usage analytics** for better insights
4. **Add subscription management** features for users
5. **Set up automated billing** reminders
6. **Implement trial periods** for new users

---

**Note**: This implementation follows Stripe's best practices and security guidelines. Always test thoroughly in Stripe's test mode before going live. 