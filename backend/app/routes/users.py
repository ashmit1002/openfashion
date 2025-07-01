from fastapi import APIRouter, HTTPException, Depends, Body, Query
from app.database import users_collection
from app.auth.dependencies import get_current_user_id
from app.models.user import User, UserCreate
from typing import List, Optional
from app.services.search_service import get_shopping_results_from_serpapi, get_google_shopping_light_results
from app.services.chatbot_service import StyleChatbot
from bson import ObjectId

router = APIRouter(tags=["Users"])

# Initialize the style chatbot
style_chatbot = StyleChatbot()

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