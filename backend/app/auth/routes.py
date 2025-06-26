from fastapi import APIRouter, HTTPException, Depends, Body
from app.database import users_collection, style_quizzes_collection
from app.auth.dependencies import get_current_user_id
from app.models.user import User, UserCreate, Token, UserLogin
from app.auth.auth_utils import create_access_token, verify_password, hash_password
from typing import List, Optional
from datetime import datetime

router = APIRouter(tags=["Auth"])

@router.post("/register", response_model=Token)
def register(user: UserCreate):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user.password)  # Hash the password
    user_dict["followers"] = []
    user_dict["following"] = []
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
        following=user.get("following", [])
    )
    
    # Add needs_quiz flag to the response
    return {
        **user_model.dict(),
        "needs_quiz": needs_quiz
    }
