from pydantic import BaseModel, EmailStr
from typing import Optional, List

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

    class Config:
        from_attributes = True