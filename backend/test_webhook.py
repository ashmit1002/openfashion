#!/usr/bin/env python3
"""
Test webhook functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import stripe
from app.config.settings import settings
from app.services.subscription_service import handle_subscription_webhook

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

def test_webhook_events():
    """Test webhook event handling"""
    
    print("🔧 Testing Webhook Events")
    print("=" * 40)
    
    # Get recent events
    print("\n📋 Recent Stripe Events:")
    events = stripe.Event.list(limit=10)
    
    for event in events.data:
        print(f"  Event ID: {event.id}")
        print(f"  Type: {event.type}")
        print(f"  Created: {event.created}")
        print(f"  ---")
        
        # Test our webhook handler
        try:
            result = handle_subscription_webhook(event.to_dict())
            print(f"  ✅ Webhook handler result: {result}")
        except Exception as e:
            print(f"  ❌ Webhook handler error: {e}")
        print()

def check_webhook_config():
    """Check webhook configuration"""
    
    print("\n🔗 Webhook Configuration:")
    print(f"  Webhook Secret: {'Set' if settings.STRIPE_WEBHOOK_SECRET else 'NOT SET'}")
    print(f"  Stripe Secret Key: {'Set' if settings.STRIPE_SECRET_KEY else 'NOT SET'}")
    
    if not settings.STRIPE_WEBHOOK_SECRET:
        print("\n⚠️  WARNING: STRIPE_WEBHOOK_SECRET is not set!")
        print("   You need to:")
        print("   1. Go to https://dashboard.stripe.com/webhooks")
        print("   2. Add endpoint: http://localhost:8000/api/subscription/webhook")
        print("   3. Select events: checkout.session.completed, customer.subscription.created, etc.")
        print("   4. Copy the webhook secret to your .env file")

if __name__ == "__main__":
    check_webhook_config()
    test_webhook_events() 