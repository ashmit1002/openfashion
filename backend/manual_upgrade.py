#!/usr/bin/env python3
"""
Manually upgrade a user to premium
"""

import sys
import os
from datetime import datetime, timedelta
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import users_collection

def manual_upgrade(email):
    """Manually upgrade a user to premium"""
    
    print(f"🔧 Manually upgrading {email} to premium...")
    
    # Update user to premium
    result = users_collection.update_one(
        {'email': email},
        {
            '$set': {
                'subscription_status': 'premium',
                'subscription_tier': 'premium',
                'subscription_end_date': datetime.utcnow() + timedelta(days=30),
                'stripe_customer_id': 'cus_Sa0VAwFkWGn687'  # From Stripe data
            }
        }
    )
    
    if result.modified_count > 0:
        print(f"✅ Successfully upgraded {email} to premium!")
        
        # Verify the update
        user = users_collection.find_one({'email': email})
        print(f"👑 New Status: {user.get('subscription_status')}")
        print(f"🎯 New Tier: {user.get('subscription_tier')}")
        
    else:
        print(f"❌ Failed to upgrade {email}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        email = sys.argv[1]
        manual_upgrade(email)
    else:
        print("Usage: python manual_upgrade.py [email]")
        print("Example: python manual_upgrade.py a@gmail.com") 