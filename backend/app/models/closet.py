from pydantic import BaseModel
from typing import Optional

class ClosetItem(BaseModel):
    user_id: str
    name: str
    category: str
    price: str
    link: str
    thumbnail: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True