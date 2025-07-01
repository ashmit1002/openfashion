#!/usr/bin/env python3
"""
Check Stripe payments and customers
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import stripe
from app.config.settings import settings

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

def check_stripe_data():
    """Check Stripe customers and payments"""
    
    print("💳 Checking Stripe Data")
    print("=" * 40)
    
    # Check customers
    print("\n👥 Customers:")
    customers = stripe.Customer.list(limit=10)
    for customer in customers.data:
        print(f"  ID: {customer.id}")
        print(f"  Email: {customer.email}")
        print(f"  Created: {customer.created}")
        print(f"  ---")
    
    # Check payment intents
    print("\n💸 Payment Intents:")
    payment_intents = stripe.PaymentIntent.list(limit=10)
    for pi in payment_intents.data:
        print(f"  ID: {pi.id}")
        print(f"  Amount: ${pi.amount/100}")
        print(f"  Status: {pi.status}")
        print(f"  Customer: {pi.customer}")
        print(f"  Created: {pi.created}")
        print(f"  ---")
    
    # Check subscriptions
    print("\n📅 Subscriptions:")
    subscriptions = stripe.Subscription.list(limit=10)
    for sub in subscriptions.data:
        print(f"  ID: {sub.id}")
        print(f"  Customer: {sub.customer}")
        print(f"  Status: {sub.status}")
        print(f"  Current Period End: {sub.current_period_end}")
        print(f"  ---")

if __name__ == "__main__":
    check_stripe_data() 