from fastapi import APIRouter, HTTPException, Depends, Body
from app.database import users_collection, style_quizzes_collection
from app.auth.dependencies import get_current_user_id
from app.models.user import User, UserCreate, Token, UserLogin, GoogleAuthRequest
from app.auth.auth_utils import create_access_token, verify_password, hash_password
from app.services.google_auth_service import google_auth_service
from app.config.settings import settings
from typing import List, Optional
from datetime import datetime
import re

router = APIRouter(tags=["Auth"])

def validate_email_format(email: str) -> bool:
    """Validate email format on the backend"""
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_regex, email))

def validate_username_format(username: str) -> bool:
    """Validate username format on the backend"""
    username_regex = r'^[a-zA-Z0-9_]{3,30}$'
    return bool(re.match(username_regex, username))

@router.post("/register", response_model=Token)
def register(user: UserCreate):
    # Validate email format
    if not validate_email_format(user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Validate username format
    if not validate_username_format(user.username):
        raise HTTPException(status_code=400, detail="Invalid username format. Username must be 3-30 characters and contain only letters, numbers, and underscores")
    
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user.password)  # Hash the password
    user_dict["followers"] = []
    user_dict["following"] = []
    # Initialize subscription fields for new users
    user_dict["subscription_status"] = "free"
    user_dict["subscription_tier"] = None
    user_dict["subscription_end_date"] = None
    user_dict["weekly_uploads_used"] = 0
    user_dict["weekly_uploads_reset_date"] = None
    user_dict["stripe_customer_id"] = None
    user_dict["auth_provider"] = "email"
    
    result = users_collection.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    # Create initial style quiz for the new user
    quiz = {
        "user_id": user.email,  # Using email as user_id for consistency
        "responses": [],
        "completed": False,
        "created_at": datetime.utcnow(),
        "completed_at": None
    }
    style_quizzes_collection.insert_one(quiz)
    
    token = create_access_token({"sub": user.email})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "needs_quiz": True,
        "is_new_user": True  # Flag to indicate this is a new registration
    }

@router.post("/login", response_model=Token)
def login(user: UserLogin):
    # Validate email format
    if not validate_email_format(user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    user_data = users_collection.find_one({"email": user.email})
    if not user_data or not verify_password(user.password, user_data["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user has completed their style quiz
    quiz = style_quizzes_collection.find_one({"user_id": user.email})
    needs_quiz = not quiz or not quiz.get("completed", False)
    
    token = create_access_token({"sub": user.email})
    return {
        "access_token": token, 
        "token_type": "bearer",
        "needs_quiz": needs_quiz,
        "is_new_user": False  # Existing user logging in
    }

@router.post("/google", response_model=Token)
def google_auth(request: GoogleAuthRequest):
    """Authenticate user with Google OAuth"""
    try:
        # Debug logging
        print(f"🔍 Backend Debug - Received redirect_uri: {request.redirect_uri}")
        print(f"🔍 Backend Debug - Expected redirect_uri: {settings.GOOGLE_REDIRECT_URI}")
        print(f"🔍 Backend Debug - Client ID: {settings.GOOGLE_CLIENT_ID}")
        
        result = google_auth_service.authenticate_google_user(request.code, request.redirect_uri)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Google authentication failed")

@router.get("/google/url")
def get_google_auth_url():
    """Get Google OAuth URL"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    scope = "openid email profile"
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code&scope={scope}&access_type=offline"
    
    return {"auth_url": auth_url}

@router.post("/refresh")
def refresh_token(user_id: str = Depends(get_current_user_id)):
    """Refresh the access token"""
    user_data = users_collection.find_one({"email": user_id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create a new token
    new_token = create_access_token({"sub": user_id})
    return {
        "access_token": new_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=User)
def get_current_user(user_id: str = Depends(get_current_user_id)):
    user = users_collection.find_one({"email": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has completed their style quiz
    quiz = style_quizzes_collection.find_one({"user_id": user_id})
    needs_quiz = not quiz or not quiz.get("completed", False)
    
    # Convert MongoDB user to User model
    user_model = User(
        id=str(user["_id"]),
        email=user["email"],
        username=user["username"],
        name=user.get("name"),
        display_name=user.get("display_name"),
        avatar_url=user.get("avatar_url"),
        bio=user.get("bio"),
        followers=user.get("followers", []),
        following=user.get("following", []),
        auth_provider=user.get("auth_provider", "email"),
        google_id=user.get("google_id"),
        subscription_status=user.get("subscription_status", "free"),
        subscription_tier=user.get("subscription_tier"),
        subscription_end_date=user.get("subscription_end_date"),
        weekly_uploads_used=user.get("weekly_uploads_used", 0),
        weekly_uploads_reset_date=user.get("weekly_uploads_reset_date"),
        stripe_customer_id=user.get("stripe_customer_id"),
        pending_cancellation=user.get("pending_cancellation", False)
    )
    
    # Add needs_quiz flag to the response
    return {
        **user_model.dict(),
        "needs_quiz": needs_quiz
    }