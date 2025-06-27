from pydantic import BaseModel

class ClosetItem(BaseModel):
    title: str
    category: str
    price: str
    link: str
    thumbnail: str
