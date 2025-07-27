from fastapi import APIRouter, HTTPException, Depends, Body, Query
from app.database import users_collection
from app.auth.dependencies import get_current_user_id
from app.models.user import User, UserCreate, UsernameUpdate
from typing import List, Optional
from app.services.search_service import get_shopping_results_from_serpapi, get_google_shopping_light_results
from app.services.chatbot_service import StyleChatbot
from bson import ObjectId
import re

router = APIRouter(tags=["Users"])

# Initialize the style chatbot
style_chatbot = StyleChatbot()

def validate_username_format(username: str) -> bool:
    """Validate username format"""
    username_regex = r'^[a-zA-Z0-9_]{3,30}$'
    return bool(re.match(username_regex, username))

# Utility to convert MongoDB user to User
def user_to_model(user) -> User:
    return User(
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
        stripe_subscription_id=user.get("stripe_subscription_id"),
        pending_cancellation=user.get("pending_cancellation", False),
    )

# Utility to recursively convert ObjectId to string in any dict/list
def convert_objectid(doc):
    if isinstance(doc, list):
        return [convert_objectid(item) for item in doc]
    elif isinstance(doc, dict):
        return {k: convert_objectid(v) for k, v in doc.items()}
    elif isinstance(doc, ObjectId):
        return str(doc)
    else:
        return doc

@router.get("/user/{username}", response_model=User)
def get_user_by_username(username: str):
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_model(user)

@router.put("/user/profile", response_model=User)
def update_profile(
    display_name: Optional[str] = Body(None),
    avatar_url: Optional[str] = Body(None),
    bio: Optional[str] = Body(None),
    user_id: str = Depends(get_current_user_id)
):
    user = users_collection.find_one({"email": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_fields = {}
    if display_name is not None:
        update_fields["display_name"] = display_name
    if avatar_url is not None:
        update_fields["avatar_url"] = avatar_url
    if bio is not None:
        update_fields["bio"] = bio
    if update_fields:
        users_collection.update_one({"email": user_id}, {"$set": update_fields})
    user = users_collection.find_one({"email": user_id})
    return user_to_model(user)

@router.put("/user/username", response_model=User)
def update_username(
    username_update: UsernameUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update user's username if it's not already taken
    """
    # Validate username format
    if not validate_username_format(username_update.username):
        raise HTTPException(
            status_code=400, 
            detail="Invalid username format. Username must be 3-30 characters and contain only letters, numbers, and underscores"
        )
    
    # Check if username is already taken
    existing_user = users_collection.find_one({"username": username_update.username})
    if existing_user and existing_user["email"] != user_id:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Get current user
    current_user = users_collection.find_one({"email": user_id})
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is trying to change to their current username
    if current_user["username"] == username_update.username:
        raise HTTPException(status_code=400, detail="Username is already set to this value")
    
    # Update username
    users_collection.update_one(
        {"email": user_id}, 
        {"$set": {"username": username_update.username}}
    )
    
    # Update the updated user
    updated_user = users_collection.find_one({"email": user_id})
    return user_to_model(updated_user)

@router.get("/user/username/check/{username}")
def check_username_availability(username: str, user_id: str = Depends(get_current_user_id)):
    """
    Check if a username is available for the current user
    """
    # Validate username format
    if not validate_username_format(username):
        return {
            "available": False,
            "reason": "Invalid username format. Username must be 3-30 characters and contain only letters, numbers, and underscores"
        }
    
    # Check if username is taken by another user
    existing_user = users_collection.find_one({"username": username})
    if existing_user and existing_user["email"] != user_id:
        return {
            "available": False,
            "reason": "Username already taken"
        }
    
    # Check if it's the user's current username
    current_user = users_collection.find_one({"email": user_id})
    if current_user and current_user["username"] == username:
        return {
            "available": False,
            "reason": "This is your current username"
        }
    
    return {
        "available": True,
        "reason": "Username is available"
    }

@router.post("/user/follow/{username}")
def follow_user(username: str, user_id: str = Depends(get_current_user_id)):
    if not users_collection.find_one({"username": username}):
        raise HTTPException(status_code=404, detail="User not found")
    if users_collection.find_one({"email": user_id, "following": username}):
        raise HTTPException(status_code=400, detail="Already following")
    users_collection.update_one({"email": user_id}, {"$addToSet": {"following": username}})
    users_collection.update_one({"username": username}, {"$addToSet": {"followers": user_id}})
    return {"message": f"Now following {username}"}

@router.post("/user/unfollow/{username}")
def unfollow_user(username: str, user_id: str = Depends(get_current_user_id)):
    if not users_collection.find_one({"username": username}):
        raise HTTPException(status_code=404, detail="User not found")
    users_collection.update_one({"email": user_id}, {"$pull": {"following": username}})
    users_collection.update_one({"username": username}, {"$pull": {"followers": user_id}})
    return {"message": f"Unfollowed {username}"}

@router.get("/users/search", response_model=List[User])
def search_users(query: str):
    users = users_collection.find({
        "$or": [
            {"username": {"$regex": query, "$options": "i"}},
            {"display_name": {"$regex": query, "$options": "i"}}
        ]
    })
    return [user_to_model(u) for u in users]

def require_premium(user_id: str):
    user = users_collection.find_one({"email": user_id})
    if not user or user.get("subscription_status") != "premium":
        raise HTTPException(status_code=403, detail="Google Shopping search is only available for premium users.")

@router.get("/shopping/search")
def shopping_search(query: str = Query(..., description="Shopping search query"), num_results: int = Query(10, ge=1, le=20), user_id: str = Depends(get_current_user_id)):
    """
    Proxy endpoint for Google Shopping search via SerpAPI.
    Returns a list of shopping results for the given query.
    """
    require_premium(user_id)
    print(f"[Backend] Shopping search request received - Query: '{query}', Num results: {num_results}")
    try:
        results = get_shopping_results_from_serpapi(query, num_results)
        print(f"[Backend] Shopping search completed - Returning {len(results)} results")
        return results
    except Exception as e:
        print(f"[Backend] Shopping search error: {e}")
        raise HTTPException(status_code=500, detail=f"Shopping search failed: {str(e)}")

@router.get("/shopping/light/search")
def shopping_light_search(query: str = Query(..., description="Shopping search query"), num_results: int = Query(10, ge=1, le=20), user_id: str = Depends(get_current_user_id)):
    """
    Proxy endpoint for Google Shopping Light search via SerpAPI.
    Returns a list of shopping results for the given query using the faster Google Shopping Light engine.
    """
    require_premium(user_id)
    print(f"[Backend] Google Shopping Light search request received - Query: '{query}', Num results: {num_results}")
    try:
        results = get_google_shopping_light_results(query, num_results)
        print(f"[Backend] Google Shopping Light search completed - Returning {len(results)} results")
        return results
    except Exception as e:
        print(f"[Backend] Google Shopping Light search error: {e}")
        raise HTTPException(status_code=500, detail=f"Google Shopping Light search failed: {str(e)}")

@router.post("/chat/style")
async def chat_with_style_bot(
    message: str = Body(..., embed=True),
    context: Optional[dict] = Body({}, embed=True),
    user_id: str = Depends(get_current_user_id)
):
    """
    Chat with the style bot for personalized fashion advice and style profiling.
    """
    try:
        response = await style_chatbot.process_message(
            user_id=user_id,
            message=message,
            context=context
        )
        return {
            "response": response["message"],
            "suggestions": response.get("suggestions", []),
            "style_insights": response.get("style_insights", {}),
            "next_questions": response.get("next_questions", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.get("/chat/style/start")
async def start_style_chat(user_id: str = Depends(get_current_user_id)):
    """
    Start a new style chat session with initial questions.
    """
    try:
        initial_response = await style_chatbot.start_conversation(user_id=user_id)
        return {
            "message": initial_response["message"],
            "suggestions": initial_response.get("suggestions", []),
            "next_questions": initial_response.get("next_questions", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start chat: {str(e)}")

@router.get("/chat/style/profile")
async def get_style_chat_profile(user_id: str = Depends(get_current_user_id)):
    """
    Get the current style profile insights from chat interactions.
    """
    try:
        profile = await style_chatbot.get_user_style_profile(user_id=user_id)
        return convert_objectid(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

@router.delete("/account")
async def delete_account(user_id: str = Depends(get_current_user_id)):
    """
    Delete user account and all associated data.
    """
    try:
        # Import collections
        from app.database import (
            users_collection, 
            closets_collection, 
            wishlist_collection,
            style_profiles_collection,
            style_quizzes_collection,
            analysis_jobs_collection
        )
        
        # Get user details first
        user = users_collection.find_one({"email": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Delete user's closet items from S3
        try:
            from app.services.s3_service import delete_user_closet_from_s3
            delete_user_closet_from_s3(user_id)
        except Exception as e:
            print(f"Failed to delete closet from S3: {e}")
        
        # Delete user's wishlist items from S3
        try:
            from app.services.s3_service import delete_user_wishlist_from_s3
            delete_user_wishlist_from_s3(user_id)
        except Exception as e:
            print(f"Failed to delete wishlist from S3: {e}")
        
        # Delete user's uploaded files from S3
        try:
            from app.services.s3_service import delete_user_uploads_from_s3
            delete_user_uploads_from_s3(user_id)
        except Exception as e:
            print(f"Failed to delete uploads from S3: {e}")
        
        # Delete user's data from all collections
        users_collection.delete_one({"email": user_id})
        closets_collection.delete_many({"user_id": user_id})
        wishlist_collection.delete_many({"user_id": user_id})
        style_profiles_collection.delete_many({"user_id": user_id})
        style_quizzes_collection.delete_many({"user_id": user_id})
        analysis_jobs_collection.delete_many({"user_id": user_id})
        
        # Cancel Stripe subscription if exists
        if user.get("stripe_subscription_id"):
            try:
                import stripe
                from app.config.settings import settings
                stripe.api_key = settings.STRIPE_SECRET_KEY
                stripe.Subscription.modify(
                    user["stripe_subscription_id"],
                    cancel_at_period_end=True
                )
            except Exception as e:
                print(f"Failed to cancel Stripe subscription: {e}")
        
        print(f"Account deleted for user: {user_id}")
        return {"message": "Account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to delete account for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}") 