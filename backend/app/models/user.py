from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: str

class UsernameUpdate(BaseModel):
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str
    needs_quiz: bool = False
    is_new_user: bool = False

class User(BaseModel):
    id: str
    email: EmailStr
    username: str
    name: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    followers: List[str] = []
    following: List[str] = []
    needs_quiz: bool = False
    # Authentication fields
    auth_provider: str = "email"  # "email" or "google"
    google_id: Optional[str] = None
    # Subscription fields
    subscription_status: str = "free"  # "free", "premium"
    subscription_tier: Optional[str] = None  # "basic", "pro", "enterprise"
    subscription_end_date: Optional[datetime] = None
    weekly_uploads_used: int = 0
    weekly_uploads_reset_date: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    pending_cancellation: Optional[bool] = False

    class Config:
        from_attributes = True

class SubscriptionTier(BaseModel):
    id: str
    name: str
    price: float
    currency: str = "usd"
    interval: str = "month"  # "month", "year"
    features: List[str] = []
    upload_limit: Optional[int] = None  # None for unlimited
    description: str = ""

class CreateCheckoutSession(BaseModel):
    tier_id: str
    success_url: str
    cancel_url: str
