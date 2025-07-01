#!/usr/bin/env python3
"""
Test script for subscription service
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.subscription_service import (
    get_subscription_tiers,
    get_subscription_tier,
    get_stripe_price_id,
    TIER_TO_PRICE_MAPPING
)

def test_subscription_service():
    """Test the subscription service functions"""
    
    print("🧪 Testing Subscription Service")
    print("=" * 40)
    
    # Test 1: Get all tiers
    print("\n1. Testing get_subscription_tiers()")
    tiers = get_subscription_tiers()
    print(f"Found {len(tiers)} tiers:")
    for tier in tiers:
        print(f"  - {tier.name}: ${tier.price}/{tier.interval} (ID: {tier.id})")
    
    # Test 2: Get specific tiers
    print("\n2. Testing get_subscription_tier()")
    test_tier_ids = ["basic", "premium", "price_premium_monthly", "invalid"]
    
    for tier_id in test_tier_ids:
        tier = get_subscription_tier(tier_id)
        if tier:
            print(f"  ✅ Found tier '{tier_id}': {tier.name}")
        else:
            print(f"  ❌ Tier '{tier_id}' not found")
    
    # Test 3: Get Stripe price IDs
    print("\n3. Testing get_stripe_price_id()")
    for tier_id in test_tier_ids:
        price_id = get_stripe_price_id(tier_id)
        if price_id:
            print(f"  ✅ Price ID for '{tier_id}': {price_id}")
        else:
            print(f"  ❌ No price ID found for '{tier_id}'")
    
    # Test 4: Show mapping
    print("\n4. Tier to Price Mapping:")
    for tier_name, price_id in TIER_TO_PRICE_MAPPING.items():
        print(f"  {tier_name} -> {price_id}")
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    test_subscription_service() 