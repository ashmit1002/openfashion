import stripe
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from app.config.settings import settings
from app.models.user import SubscriptionTier

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Define subscription tiers
SUBSCRIPTION_TIERS = {
    "basic": SubscriptionTier(
        id="basic",  # Use simple tier name for frontend
        name="Basic",
        price=0.00,
        currency="usd",
        interval="month",
        features=[
            "3 uploads per week",
            "Basic image analysis",
            "Standard support"
        ],
        upload_limit=3,  # 3 uploads per week
        description="Perfect for getting started"
    ),
    "premium": SubscriptionTier(
        id="premium",  # Use simple tier name for frontend
        name="Premium",
        price=5.00,
        currency="usd",
        interval="month",
        features=[
            "Unlimited uploads",
            "Advanced search features",
            "Priority support",
            "No SerpAPI restrictions"
        ],
        upload_limit=None,  # Unlimited
        description="Unlock all features"
    )
}

# Mapping from tier names to actual Stripe price IDs
TIER_TO_PRICE_MAPPING = {
    "basic": "price_basic_monthly",
    "premium": "price_1Rj5M1KiNuU2kNA8ZJAVJshX",
    "price_premium_monthly": "price_1Rj5M1KiNuU2kNA8ZJAVJshX",
    "price_basic_monthly": "price_basic_monthly"
}

def get_subscription_tiers() -> List[SubscriptionTier]:
    """Get all available subscription tiers"""
    return list(SUBSCRIPTION_TIERS.values())

def get_subscription_tier(tier_id: str) -> Optional[SubscriptionTier]:
    """Get a specific subscription tier by ID"""
    # First try direct lookup
    if tier_id in SUBSCRIPTION_TIERS:
        return SUBSCRIPTION_TIERS[tier_id]
    
    # Then try mapping from tier name to actual tier
    mapped_tier = TIER_TO_PRICE_MAPPING.get(tier_id)
    if mapped_tier:
        # If the mapped tier is a Stripe price ID, find the tier that uses it
        if mapped_tier.startswith('price_'):
            for tier in SUBSCRIPTION_TIERS.values():
                if tier.id == mapped_tier or get_stripe_price_id(tier.id) == mapped_tier:
                    return tier
        # If the mapped tier is a tier name, return that tier
        elif mapped_tier in SUBSCRIPTION_TIERS:
            return SUBSCRIPTION_TIERS[mapped_tier]
    
    # Finally, try to find by Stripe price ID
    for tier in SUBSCRIPTION_TIERS.values():
        if tier.id == tier_id:
            return tier
    
    return None

def get_stripe_price_id(tier_id: str) -> Optional[str]:
    """Get the actual Stripe price ID for a given tier ID"""
    # Direct mapping
    if tier_id in TIER_TO_PRICE_MAPPING:
        return TIER_TO_PRICE_MAPPING[tier_id]
    
    # Check if it's already a Stripe price ID
    if tier_id.startswith('price_'):
        return tier_id
    
    # Try to find by tier name
    tier = get_subscription_tier(tier_id)
    if tier:
        return tier.id
    
    return None

def create_or_get_customer(email: str, name: str = None) -> str:
    """Create or get a Stripe customer"""
    try:
        # Check if customer already exists
        customers = stripe.Customer.list(email=email, limit=1)
        if customers.data:
            return customers.data[0].id
        
        # Create new customer
        customer_data = {'email': email}
        if name:
            customer_data['name'] = name
            
        customer = stripe.Customer.create(**customer_data)
        return customer.id
    except Exception as e:
        logger.error(f"Error creating/getting customer: {e}")
        raise

def create_subscription(customer_id: str, price_id: str) -> dict:
    """Create a subscription with incomplete status for payment"""
    try:
        # Get the actual Stripe price ID
        stripe_price_id = get_stripe_price_id(price_id)
        if not stripe_price_id:
            raise ValueError(f"Invalid price ID: {price_id}")
        
        # Create the subscription with incomplete status
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{
                'price': stripe_price_id,
            }],
            payment_behavior='default_incomplete',
            payment_settings={'save_default_payment_method': 'on_subscription'},
            expand=['latest_invoice.payment_intent'],
            collection_method='charge_automatically'
        )
        
        logger.info(f"Stripe subscription: {subscription}")
        logger.info(f"Stripe latest_invoice: {getattr(subscription, 'latest_invoice', None)}")
        if hasattr(subscription, 'latest_invoice') and subscription.latest_invoice:
            logger.info(f"Stripe payment_intent: {getattr(subscription.latest_invoice, 'payment_intent', None)}")
            if hasattr(subscription.latest_invoice, 'payment_intent') and subscription.latest_invoice.payment_intent:
                logger.info(f"Stripe client_secret: {getattr(subscription.latest_invoice.payment_intent, 'client_secret', None)}")
        
        client_secret = None
        if (
            hasattr(subscription, 'latest_invoice') and subscription.latest_invoice and
            hasattr(subscription.latest_invoice, 'payment_intent') and subscription.latest_invoice.payment_intent
        ):
            client_secret = subscription.latest_invoice.payment_intent.client_secret
        
        return {
            'subscription_id': subscription.id,
            'client_secret': client_secret
        }
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise

def create_checkout_session(tier_id: str, customer_email: str, success_url: str, cancel_url: str) -> dict:
    """Create a Stripe checkout session for subscription (alternative to embedded form)"""
    try:
        tier = get_subscription_tier(tier_id)
        if not tier:
            raise ValueError(f"Invalid tier ID: {tier_id}")

        # Create or get customer
        customer_id = create_or_get_customer(customer_email)

        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': tier.currency,
                    'product_data': {
                        'name': f"{tier.name} Plan",
                        'description': tier.description,
                    },
                    'unit_amount': int(tier.price * 100),  # Convert to cents
                    'recurring': {
                        'interval': tier.interval,
                    },
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'tier_id': tier_id,
                'user_email': customer_email
            }
        )
        
        return {
            'session_id': session.id,
            'url': session.url
        }
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise

def handle_subscription_webhook(event: dict) -> dict:
    """Handle Stripe webhook events for subscription management"""
    try:
        event_type = event['type']
        
        if event_type == 'checkout.session.completed':
            session = event['data']['object']
            return handle_checkout_completed(session)
        elif event_type == 'customer.subscription.created':
            subscription = event['data']['object']
            return handle_subscription_created(subscription)
        elif event_type == 'customer.subscription.updated':
            subscription = event['data']['object']
            return handle_subscription_updated(subscription)
        elif event_type == 'customer.subscription.deleted':
            subscription = event['data']['object']
            return handle_subscription_deleted(subscription)
        else:
            return {'status': 'ignored', 'message': f'Unhandled event type: {event_type}'}
            
    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        raise

def handle_checkout_completed(session: dict) -> dict:
    """Handle successful checkout completion"""
    from app.database import users_collection
    
    customer_email = session['metadata']['user_email']
    tier_id = session['metadata']['tier_id']
    subscription_id = session.get('subscription')
    
    # Update user subscription status
    tier = get_subscription_tier(tier_id)
    if not tier:
        raise ValueError(f"Invalid tier ID: {tier_id}")
    
    # Calculate subscription end date (1 month from now)
    subscription_end_date = datetime.utcnow() + timedelta(days=30)
    
    users_collection.update_one(
        {'email': customer_email},
        {
            '$set': {
                'subscription_status': 'premium',
                'subscription_tier': tier_id,
                'subscription_end_date': subscription_end_date,
                'stripe_customer_id': session['customer'],
                'stripe_subscription_id': subscription_id
            }
        }
    )
    
    return {
        'status': 'success',
        'message': f'Subscription activated for {customer_email}',
        'tier': tier_id
    }

def handle_subscription_created(subscription: dict) -> dict:
    """Handle subscription creation"""
    from app.database import users_collection
    
    customer_id = subscription['customer']
    subscription_id = subscription['id']
    
    # Find user by Stripe customer ID
    user = users_collection.find_one({'stripe_customer_id': customer_id})
    if not user:
        return {'status': 'error', 'message': 'User not found'}
    
    # Update subscription status
    # Handle the case where current_period_end might not be available
    if 'current_period_end' in subscription and subscription['current_period_end']:
        subscription_end_date = datetime.fromtimestamp(subscription['current_period_end'])
    else:
        subscription_end_date = datetime.utcnow() + timedelta(days=30)
    
    users_collection.update_one(
        {'stripe_customer_id': customer_id},
        {
            '$set': {
                'subscription_status': 'premium',
                'subscription_end_date': subscription_end_date,
                'stripe_subscription_id': subscription_id
            }
        }
    )
    
    return {
        'status': 'success',
        'message': f'Subscription created for {user["email"]}'
    }

def handle_subscription_updated(subscription: dict) -> dict:
    """Handle subscription updates"""
    from app.database import users_collection
    
    customer_id = subscription['customer']
    subscription_id = subscription['id']
    
    # Find user by Stripe customer ID
    user = users_collection.find_one({'stripe_customer_id': customer_id})
    if not user:
        return {'status': 'error', 'message': 'User not found'}
    
    if 'current_period_end' in subscription and subscription['current_period_end']:
        subscription_end_date = datetime.fromtimestamp(subscription['current_period_end'])
    else:
        subscription_end_date = None
    
    users_collection.update_one(
        {'stripe_customer_id': customer_id},
        {
            '$set': {
                'subscription_end_date': subscription_end_date,
                'stripe_subscription_id': subscription_id
            }
        }
    )
    
    return {
        'status': 'success',
        'message': f'Subscription updated for {user["email"]}'
    }

def handle_subscription_deleted(subscription: dict) -> dict:
    """Handle subscription cancellation"""
    from app.database import users_collection
    
    customer_id = subscription['customer']
    subscription_id = subscription['id']
    
    # Downgrade user to basic tier (not free) and clear subscription ID, and clear pending_cancellation
    users_collection.update_one(
        {'stripe_customer_id': customer_id},
        {
            '$set': {
                'subscription_status': 'basic',
                'subscription_tier': 'basic',
                'subscription_end_date': None,
                'stripe_subscription_id': None,
                'pending_cancellation': False
            }
        }
    )
    
    return {
        'status': 'success',
        'message': f'Subscription cancelled for customer {customer_id}'
    }

def cancel_subscription(subscription_id: str) -> dict:
    """Cancel a subscription"""
    try:
        deleted_subscription = stripe.Subscription.cancel(subscription_id)
        return {
            'status': 'success',
            'subscription': deleted_subscription
        }
    except Exception as e:
        logger.error(f"Error canceling subscription: {e}")
        raise

def check_upload_limit(user_email: str) -> dict:
    """Check if user can upload based on their subscription and limits"""
    from app.database import users_collection
    
    user = users_collection.find_one({'email': user_email})
    if not user:
        return {'can_upload': False, 'reason': 'User not found'}
    
    subscription_status = user.get('subscription_status', 'free')
    
    if subscription_status == 'premium':
        return {'can_upload': True, 'reason': 'Premium user'}
    
    # Check weekly upload limit for free users
    weekly_uploads_used = user.get('weekly_uploads_used', 0)
    weekly_uploads_reset_date = user.get('weekly_uploads_reset_date')
    
    # Reset weekly count if it's a new week
    if weekly_uploads_reset_date:
        # Handle both string and datetime types
        if isinstance(weekly_uploads_reset_date, str):
            try:
                reset_date = datetime.fromisoformat(weekly_uploads_reset_date.replace('Z', '+00:00'))
            except Exception:
                reset_date = datetime.utcnow()  # fallback to now if parsing fails
        else:
            reset_date = weekly_uploads_reset_date
        if datetime.utcnow() > reset_date:
            weekly_uploads_used = 0
            weekly_uploads_reset_date = datetime.utcnow() + timedelta(days=7)
            users_collection.update_one(
                {'email': user_email},
                {
                    '$set': {
                        'weekly_uploads_used': 0,
                        'weekly_uploads_reset_date': weekly_uploads_reset_date
                    }
                }
            )
    
    if weekly_uploads_used >= 3:  # Free users get 3 uploads per week
        return {
            'can_upload': False, 
            'reason': 'Weekly upload limit reached',
            'uploads_used': weekly_uploads_used,
            'uploads_limit': 3
        }
    
    return {
        'can_upload': True,
        'reason': 'Within weekly limit',
        'uploads_used': weekly_uploads_used,
        'uploads_limit': 3
    }

def increment_upload_count(user_email: str) -> None:
    """Increment the user's upload count"""
    from app.database import users_collection
    
    user = users_collection.find_one({'email': user_email})
    if not user:
        return
    
    weekly_uploads_used = user.get('weekly_uploads_used', 0)
    weekly_uploads_reset_date = user.get('weekly_uploads_reset_date')
    
    # Set reset date if not exists
    if not weekly_uploads_reset_date:
        weekly_uploads_reset_date = datetime.utcnow() + timedelta(days=7)
    
    users_collection.update_one(
        {'email': user_email},
        {
            '$set': {
                'weekly_uploads_used': weekly_uploads_used + 1,
                'weekly_uploads_reset_date': weekly_uploads_reset_date
            }
        }
    )

def cancel_subscription_for_user(user_email: str) -> dict:
    """Cancel the user's active subscription using their email (and stripe_customer_id)."""
    from app.database import users_collection
    user = users_collection.find_one({'email': user_email})
    if not user or not user.get('stripe_customer_id'):
        return {'status': 'error', 'message': 'No Stripe customer ID found.'}

    # Find active subscription for this customer
    subs = stripe.Subscription.list(customer=user['stripe_customer_id'], status='active', limit=1)
    if not subs.data:
        return {'status': 'error', 'message': 'No active subscription found.'}

    subscription_id = subs.data[0].id
    stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)
    # Mark user as pending cancellation
    users_collection.update_one(
        {'email': user_email},
        {'$set': {'pending_cancellation': True}}
    )
    return {'status': 'success', 'message': 'Subscription will be cancelled at period end.'} 