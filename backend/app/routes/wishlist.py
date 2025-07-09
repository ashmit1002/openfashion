# routes/wishlist.py
from fastapi import APIRouter, Depends, HTTPException, Query, Form, UploadFile, File
from typing import List, Optional
from datetime import datetime
from app.database import wishlist_collection
from app.auth.dependencies import get_current_user_id
from app.models.wishlist import WishlistItem
from bson import ObjectId
import os
import time
from app.services.s3_service import upload_to_s3

router = APIRouter(tags=["Wishlist"])

def convert_objectid(item):
    """Convert MongoDB ObjectId to string in the response"""
    if "_id" in item:
        item["_id"] = str(item["_id"])
    return item

@router.get("/", response_model=List[WishlistItem])
async def get_wishlist(
    user_id: str = Depends(get_current_user_id),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """Get the current user's wishlist items with pagination"""
    items = list(wishlist_collection.find(
        {"user_id": user_id}
    ).skip(skip).limit(limit))
    return items

@router.get("/user/{target_user_id}", response_model=List[WishlistItem])
async def get_user_wishlist(
    target_user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """Get another user's public wishlist items"""
    items = list(wishlist_collection.find(
        {"user_id": target_user_id}
    ).skip(skip).limit(limit))
    return items

@router.post("/add")
async def add_to_wishlist(
    name: str = Form(...),
    category: str = Form(...),
    price: str = Form(...),
    link: str = Form(...),
    thumbnail: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    # Upload image to the wishlist S3 bucket
    image_bytes = await thumbnail.read()
    filename = f"{int(time.time())}_{thumbnail.filename}"
    # Use a dedicated function or pass the bucket name for wishlists
    from app.config.settings import settings
    s3_url = upload_to_s3(image_bytes, filename, bucket_name=settings.WISHLIST_S3_BUCKET_NAME)

    item = {
        "user_id": user_id,
        "title": name,
        "category": category,
        "price": price,
        "link": link,
        "thumbnail": s3_url,
        "source": "User Save",
        "tags": [category]
    }
    existing = wishlist_collection.find_one({
        "user_id": user_id,
        "link": link
    })
    if existing:
        raise HTTPException(status_code=400, detail="Item already in wishlist")
    result = wishlist_collection.insert_one(item)
    return {"message": "Item added to wishlist", "item": convert_objectid(item)}

@router.delete("/delete")
def delete_wishlist_item(link: str, category: str, user_id: str = Depends(get_current_user_id)):
    """Remove an item from wishlist by link and category"""
    result = wishlist_collection.delete_one({
        "user_id": user_id,
        "link": link,
        "category": category
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

@router.post("/{item_id}/like")
async def like_wishlist_item(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Like another user's wishlist item"""
    result = wishlist_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$inc": {"likes": 1}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item liked"}

@router.get("/discover", response_model=List[WishlistItem])
async def discover_items(
    category: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """Discover wishlist items from other users"""
    query = {}
    if category:
        query["category"] = category
    if tags:
        query["tags"] = {"$in": tags}
    
    items = list(wishlist_collection.find(query)
        .sort("likes", -1)
        .skip(skip)
        .limit(limit))
    return items
