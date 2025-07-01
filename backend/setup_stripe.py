#!/usr/bin/env python3
"""
Stripe Setup Script for OpenFashion
This script creates the necessary products and prices in Stripe for the subscription tiers.
"""

import stripe
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Stripe with your secret key
stripe.api_key = "sk_test_51ReqBlQPE7rsnsEKExBnXkXEU0odfo5o8Cu3P7iEI2moXV6pJ8ZCzsCrjqUDPT3AJH1ND7ohmR3Z4bIDwmWQxVCR005eRnlKwV"

def create_products_and_prices():
    """Create products and prices in Stripe"""
    
    print("Setting up Stripe products and prices...")
    
    # Create Premium Product
    try:
        premium_product = stripe.Product.create(
            name="Premium Plan",
            description="Unlock all features with unlimited uploads and advanced search capabilities",
            metadata={
                "tier": "premium",
                "features": "unlimited_uploads,advanced_search,priority_support"
            }
        )
        print(f"✅ Created Premium Product: {premium_product.id}")
        
        # Create Premium Price
        premium_price = stripe.Price.create(
            product=premium_product.id,
            unit_amount=500,  # $5.00 in cents
            currency="usd",
            recurring={
                "interval": "month"
            },
            metadata={
                "tier": "premium",
                "price_id": "price_premium_monthly"
            }
        )
        print(f"✅ Created Premium Price: {premium_price.id}")
        print(f"   Price ID for config: {premium_price.id}")
        
    except stripe.error.StripeError as e:
        print(f"❌ Error creating Premium product/price: {e}")
        return False
    
    print("\n🎉 Stripe setup completed successfully!")
    print("\nNext steps:")
    print("1. Update your subscription service with the new price ID:")
    print(f"   'premium': SubscriptionTier(")
    print(f"       id='{premium_price.id}',  # Use this price ID")
    print(f"       name='Premium',")
    print(f"       price=5.00,")
    print(f"       ...")
    print(f"   )")
    print("\n2. Set up webhooks in your Stripe dashboard:")
    print("   - Go to https://dashboard.stripe.com/webhooks")
    print("   - Add endpoint: https://your-domain.com/api/subscription/webhook")
    print("   - Select events: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted")
    print("   - Copy the webhook secret to your .env file as STRIPE_WEBHOOK_SECRET")
    
    return True

def list_existing_products():
    """List existing products and prices"""
    print("Existing products and prices:")
    print("-" * 50)
    
    try:
        products = stripe.Product.list(limit=10)
        for product in products.data:
            print(f"Product: {product.name} (ID: {product.id})")
            print(f"  Description: {product.description}")
            print(f"  Metadata: {product.metadata}")
            
            # Get prices for this product
            prices = stripe.Price.list(product=product.id)
            for price in prices.data:
                print(f"  Price: ${price.unit_amount/100} {price.currency} / {price.recurring.interval}")
                print(f"    ID: {price.id}")
                print(f"    Metadata: {price.metadata}")
            print()
            
    except stripe.error.StripeError as e:
        print(f"❌ Error listing products: {e}")

if __name__ == "__main__":
    print("OpenFashion Stripe Setup")
    print("=" * 30)
    
    # List existing products first
    list_existing_products()
    
    print("\n" + "=" * 30)
    
    # Ask user if they want to create new products
    response = input("Do you want to create new products and prices? (y/n): ")
    
    if response.lower() in ['y', 'yes']:
        create_products_and_prices()
    else:
        print("Setup cancelled.") 