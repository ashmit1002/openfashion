# routes/wishlist.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from app.database import wishlist_collection
from app.auth.dependencies import get_current_user_id
from app.models.wishlist import WishlistItem

router = APIRouter(tags=["Wishlist"])

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

@router.post("/add", response_model=WishlistItem)
async def add_to_wishlist(
    item: WishlistItem,
    user_id: str = Depends(get_current_user_id)
):
    """Add an item to wishlist with proper validation"""
    # Ensure the user_id in the request matches the authenticated user
    if item.user_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot add items for another user")
        
    existing = wishlist_collection.find_one({
        "user_id": user_id,
        "link": item.link
    })
    if existing:
        raise HTTPException(status_code=400, detail="Item already in wishlist")
    
    item_dict = item.model_dump()
    item_dict["created_at"] = datetime.utcnow()
    result = wishlist_collection.insert_one(item_dict)
    return item_dict

@router.delete("/{item_id}")
async def remove_from_wishlist(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Remove an item from wishlist"""
    from bson import ObjectId
    result = wishlist_collection.delete_one({
        "_id": ObjectId(item_id),
        "user_id": user_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item removed from wishlist"}

@router.post("/{item_id}/like")
async def like_wishlist_item(
    item_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Like another user's wishlist item"""
    from bson import ObjectId
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
