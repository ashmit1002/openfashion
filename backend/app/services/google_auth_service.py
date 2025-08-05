import requests
from typing import Optional, Dict, Any
from app.config.settings import settings
from app.database import users_collection, style_quizzes_collection
from app.auth.auth_utils import create_access_token
from app.models.user import User
from datetime import datetime
import re

class GoogleAuthService:
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.token_url = "https://oauth2.googleapis.com/token"
        self.userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"

    def get_google_user_info(self, code: str, redirect_uri: str) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for user info"""
        try:
            # Exchange code for access token
            token_data = {
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': redirect_uri
            }
            
            # Debug logging
            print(f"🔍 Google OAuth Debug - Client ID: {self.client_id}")
            print(f"🔍 Google OAuth Debug - Redirect URI being sent to Google: {redirect_uri}")
            print(f"🔍 Google OAuth Debug - Expected Redirect URI: {settings.GOOGLE_REDIRECT_URI}")
            print(f"🔍 Google OAuth Debug - URIs match: {redirect_uri == settings.GOOGLE_REDIRECT_URI}")
            
            token_response = requests.post(self.token_url, data=token_data)
            token_response.raise_for_status()
            token_info = token_response.json()
            
            access_token = token_info.get('access_token')
            if not access_token:
                return None
            
            # Get user info from Google
            headers = {'Authorization': f'Bearer {access_token}'}
            userinfo_response = requests.get(self.userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            
            return userinfo_response.json()
            
        except requests.RequestException as e:
            print(f"Error in Google OAuth: {e}")
            return None

    def validate_username_format(self, username: str) -> bool:
        """Validate username format"""
        username_regex = r'^[a-zA-Z0-9_]{3,30}$'
        return bool(re.match(username_regex, username))

    def generate_username(self, email: str, display_name: str = None) -> str:
        """Generate a unique username from email or display name"""
        base_username = ""
        
        if display_name:
            # Clean display name for username
            base_username = re.sub(r'[^a-zA-Z0-9_]', '', display_name.lower())
            if len(base_username) >= 3:
                base_username = base_username[:30]
        
        if not base_username:
            # Use email prefix
            email_prefix = email.split('@')[0]
            base_username = re.sub(r'[^a-zA-Z0-9_]', '', email_prefix.lower())
            base_username = base_username[:30]
        
        # Ensure minimum length
        if len(base_username) < 3:
            base_username = base_username + "user"
        
        # Check if username exists and append number if needed
        counter = 1
        original_username = base_username
        while users_collection.find_one({"username": base_username}):
            base_username = f"{original_username}{counter}"
            counter += 1
            if counter > 999:  # Prevent infinite loop
                base_username = f"user{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
                break
        
        return base_username

    def authenticate_google_user(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Authenticate user with Google OAuth"""
        user_info = self.get_google_user_info(code, redirect_uri)
        
        if not user_info:
            raise ValueError("Failed to get user info from Google")
        
        google_id = user_info.get('id')
        email = user_info.get('email')
        display_name = user_info.get('name')
        avatar_url = user_info.get('picture')
        
        if not email:
            raise ValueError("Email is required from Google")
        
        # Check if user already exists
        existing_user = users_collection.find_one({"email": email})
        
        if existing_user:
            # User exists, update Google ID if not set
            if not existing_user.get('google_id'):
                users_collection.update_one(
                    {"email": email},
                    {"$set": {"google_id": google_id, "auth_provider": "google"}}
                )
            
            # Check if user has completed their style quiz
            quiz = style_quizzes_collection.find_one({"user_id": email})
            needs_quiz = not quiz or not quiz.get("completed", False)
            
            token = create_access_token({"sub": email})
            return {
                "access_token": token,
                "token_type": "bearer",
                "needs_quiz": needs_quiz,
                "is_new_user": False
            }
        else:
            # Create new user
            username = self.generate_username(email, display_name)
            
            user_dict = {
                "email": email,
                "username": username,
                "display_name": display_name,
                "avatar_url": avatar_url,
                "google_id": google_id,
                "auth_provider": "google",
                "followers": [],
                "following": [],
                "subscription_status": "free",
                "subscription_tier": None,
                "subscription_end_date": None,
                "weekly_uploads_used": 0,
                "weekly_uploads_reset_date": None,
                "stripe_customer_id": None,
                "created_at": datetime.utcnow()
            }
            
            result = users_collection.insert_one(user_dict)
            user_dict["id"] = str(result.inserted_id)
            
            # Create initial style quiz for the new user
            quiz = {
                "user_id": email,
                "responses": [],
                "completed": False,
                "created_at": datetime.utcnow(),
                "completed_at": None
            }
            style_quizzes_collection.insert_one(quiz)
            
            token = create_access_token({"sub": email})
            return {
                "access_token": token,
                "token_type": "bearer",
                "needs_quiz": True,
                "is_new_user": True
            }

google_auth_service = GoogleAuthService() 