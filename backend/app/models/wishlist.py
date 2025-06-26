from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class WishlistItem(BaseModel):
    user_id: str
    title: str
    category: str
    price: str  # Changed from float to str to handle price strings like "$10.0"
    link: str
    thumbnail: str
    source: str = "User Save"
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    likes: int = 0
    saves: int = 0  # How many other users saved this to their wishlist

# The original code block for the WishlistItem model remains unchanged:
# source: Optional[str] = None  # Where the item was found (e.g. "Pinterest", "User Upload")
# created_at: datetime = Field(default_factory=datetime.utcnow)
# likes: int = 0
# saves: int = 0  # How many other users saved this to their wishlist
# tags: list[str] = []  # For better searchability and recommendations 