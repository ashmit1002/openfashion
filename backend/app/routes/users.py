from fastapi import APIRouter, HTTPException, Depends, Body
from app.database import users_collection
from app.auth.dependencies import get_current_user_id
from app.models.user import User, UserCreate
from typing import List, Optional

router = APIRouter(tags=["Users"])

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
    )

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