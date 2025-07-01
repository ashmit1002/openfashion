#!/usr/bin/env python3
"""
Check user subscription status
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import users_collection

def check_user_subscription(email=None):
    """Check subscription status for a user"""
    
    print("🔍 Checking User Subscription Status")
    print("=" * 40)
    
    if email:
        # Check specific user
        user = users_collection.find_one({'email': email})
        if not user:
            print(f"❌ User with email '{email}' not found")
            return
        
        print(f"👤 User: {user.get('email', 'N/A')}")
        print(f"📧 Email: {user.get('email', 'N/A')}")
        print(f"👑 Subscription Status: {user.get('subscription_status', 'free')}")
        print(f"🎯 Subscription Tier: {user.get('subscription_tier', 'N/A')}")
        print(f"📅 Subscription End Date: {user.get('subscription_end_date', 'N/A')}")
        print(f"💳 Stripe Customer ID: {user.get('stripe_customer_id', 'N/A')}")
        print(f"📤 Weekly Uploads Used: {user.get('weekly_uploads_used', 0)}")
        print(f"🔄 Weekly Reset Date: {user.get('weekly_uploads_reset_date', 'N/A')}")
        
    else:
        # Show all users
        users = list(users_collection.find({}, {'email': 1, 'subscription_status': 1, 'subscription_tier': 1}))
        
        print(f"Found {len(users)} users:")
        for user in users:
            status = user.get('subscription_status', 'free')
            tier = user.get('subscription_tier', 'N/A')
            print(f"  📧 {user.get('email', 'N/A')} - Status: {status} (Tier: {tier})")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        email = sys.argv[1]
        check_user_subscription(email)
    else:
        print("Usage: python check_subscription.py [email]")
        print("Or run without arguments to see all users")
        check_user_subscription() 