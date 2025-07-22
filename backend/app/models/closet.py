from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Region(BaseModel):
    x: float
    y: float
    width: float
    height: float

class ClosetItem(BaseModel):
    id: Optional[str] = None  # MongoDB ObjectId as string
    user_id: str
    name: str
    category: str
    price: str
    link: str
    thumbnail: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class OutfitComponent(BaseModel):
    name: str
    category: str
    position: Optional[dict] = None  # e.g., {"x": 0.5, "y": 0.7} for tagging on image
    region: Optional[Region] = None  # Rectangle region for tagging
    closet_item_link: Optional[str] = None  # Link to a closet item if applicable
    notes: Optional[str] = None
    image_url: Optional[str] = None

class OutfitPost(BaseModel):
    user_id: str
    image_url: str
    caption: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    components: List[OutfitComponent] = []

    class Config:
        from_attributes = True