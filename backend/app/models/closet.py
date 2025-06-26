from pydantic import BaseModel, EmailStr

class ClosetItem(BaseModel):
    title: str
    category: str
    price: str
    link: str
    thumbnail: str
