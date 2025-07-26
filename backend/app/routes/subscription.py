from fastapi import APIRouter, HTTPException, Depends, Request, Body
from app.auth.dependencies import get_current_user_id
from app.services.subscription_service import (
    get_subscription_tiers,
    create_checkout_session,
    create_subscription,
    create_or_get_customer,
    cancel_subscription,
    handle_subscription_webhook,
    check_upload_limit,
    cancel_subscription_for_user
)
from app.models.user import CreateCheckoutSession
from app.config.settings import settings
import stripe
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Subscription"])

class CreateSubscriptionRequest(BaseModel):
    price_id: str
    customer_id: str

@router.get("/tiers")
def get_tiers():
    """Get all available subscription tiers"""
    return {"tiers": get_subscription_tiers()}

@router.post("/create-customer")
def create_customer_endpoint(user_id: str = Depends(get_current_user_id)):
    """Create or get a Stripe customer for the current user"""
    try:
        customer_id = create_or_get_customer(user_id)
        return {"customer_id": customer_id}
    except Exception as e:
        logger.error(f"Error creating customer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-subscription")
def create_subscription_endpoint(
    request: CreateSubscriptionRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create a subscription with incomplete status for payment"""
    try:
        result = create_subscription(request.customer_id, request.price_id)
        return result
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-checkout-session")
def create_checkout(request: CreateCheckoutSession, user_id: str = Depends(get_current_user_id)):
    """Create a Stripe checkout session for subscription"""
    try:
        # Get user email from user_id (which is the email)
        customer_email = user_id
        
        result = create_checkout_session(
            tier_id=request.tier_id,
            customer_email=customer_email,
            success_url=request.success_url,
            cancel_url=request.cancel_url
        )
        
        return result
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel-subscription")
def cancel_subscription_endpoint(
    user_id: str = Depends(get_current_user_id)
):
    """Cancel a subscription"""
    try:
        result = cancel_subscription_for_user(user_id)
        return result
    except Exception as e:
        logger.error(f"Error canceling subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        if not sig_header:
            raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        result = handle_subscription_webhook(event)
        return result
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/upload-limit")
def check_upload_limits(user_id: str = Depends(get_current_user_id)):
    """Check user's upload limits"""
    try:
        result = check_upload_limit(user_id)
        return result
    except Exception as e:
        logger.error(f"Error checking upload limits: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-setup-intent")
def create_setup_intent(user_id: str = Depends(get_current_user_id)):
    customer_id = create_or_get_customer(user_id)
    setup_intent = stripe.SetupIntent.create(customer=customer_id)
    return {"client_secret": setup_intent.client_secret, "customer_id": customer_id}

@router.post("/create-subscription-with-payment-method")
def create_subscription_with_payment_method(
    customer_id: str = Body(...),
    payment_method_id: str = Body(...),
    price_id: str = Body(...),
    user_id: str = Depends(get_current_user_id)
):
    # Attach the payment method to the customer
    stripe.PaymentMethod.attach(payment_method_id, customer=customer_id)
    stripe.Customer.modify(customer_id, invoice_settings={"default_payment_method": payment_method_id})
    # Now create the subscription
    subscription = stripe.Subscription.create(
        customer=customer_id,
        items=[{"price": price_id}],
        expand=["latest_invoice.payment_intent"],
        payment_behavior="default_incomplete",
        payment_settings={"save_default_payment_method": "on_subscription"},
        collection_method="charge_automatically"
    )
    client_secret = None
    if (
        hasattr(subscription, 'latest_invoice') and subscription.latest_invoice and
        hasattr(subscription.latest_invoice, 'payment_intent') and subscription.latest_invoice.payment_intent
    ):
        client_secret = subscription.latest_invoice.payment_intent.client_secret
    return {"subscription_id": subscription.id, "client_secret": client_secret} 

@router.post("/embedded-checkout-session")
def create_embedded_checkout_session(user_id: str = Depends(get_current_user_id)):
    import stripe
    from app.config.settings import settings
    stripe.api_key = settings.STRIPE_SECRET_KEY
    session = stripe.checkout.Session.create(
        ui_mode='embedded',
        line_items=[{
            'price': 'price_1Rj5M1KiNuU2kNA8ZJAVJshX',
            'quantity': 1,
        }],
        mode='subscription',
        return_url='https://openfashion.vercel.app/premium/success?session_id={CHECKOUT_SESSION_ID}',
        customer_email=user_id,  # user_id is email in your app
        metadata={
            'tier_id': 'premium',
            'user_email': user_id
        }
    )
    return {"clientSecret": session.client_secret} 