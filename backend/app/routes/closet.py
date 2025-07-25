from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Body
from app.auth.dependencies import get_current_user_id
from app.database import closets_collection, users_collection
from app.models.closet import ClosetItem
from bson import ObjectId
import os, time
from app.services.s3_service import upload_to_s3
from app.models.closet import OutfitPost, OutfitComponent
from app.database import outfit_posts_collection
from datetime import datetime

router = APIRouter(tags=["Closet"])

# 🔧 Utility to safely convert MongoDB ObjectIds to strings
def convert_objectid(doc):
    if isinstance(doc, list):
        return [convert_objectid(item) for item in doc]
    elif isinstance(doc, dict):
        return {
            key: convert_objectid(value)
            for key, value in doc.items()
            if key != "_id" or isinstance(value, ObjectId)
        }
    elif isinstance(doc, ObjectId):
        return str(doc)
    else:
        return doc

@router.get("/")
def get_closet(user_id: str = Depends(get_current_user_id)):
    user_closet = closets_collection.find({"user_id": user_id})
    grouped = {}
    for item in user_closet:
        item = convert_objectid(item)  # ✅ Convert ObjectId to string
        category = item["category"]
        grouped.setdefault(category, []).append(item)

    component_groups = [
        {
            "name": category,
            "image_url": items[0]["thumbnail"] if items else "",
            "clothing_items": items[:6]
        }
        for category, items in grouped.items()
    ]
    return {"closet": component_groups}

@router.post("/add")
async def add_closet_item(
    name: str = Form(...),
    category: str = Form(...),
    price: str = Form(...),
    link: str = Form(...),
    thumbnail: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    # Upload image to S3
    image_bytes = await thumbnail.read()
    filename = f"{int(time.time())}_{thumbnail.filename}"
    s3_url = upload_to_s3(image_bytes, filename)

    item = {
        "user_id": user_id,
        "name": name,
        "category": category,
        "price": price,
        "link": link,
        "thumbnail": s3_url
    }
    closets_collection.insert_one(item)
    print(f"[FASHION AGENT LEARNED] User {user_id} added closet item: {name}, {category}, {link}")
    return {"message": "Item added to closet", "item": convert_objectid(item)}

@router.put("/update")
def update_closet_item(item: ClosetItem, user_id: str = Depends(get_current_user_id)):
    if not item.id:
        raise HTTPException(status_code=400, detail="Item id is required for update")
    result = closets_collection.update_one(
        {"user_id": user_id, "_id": ObjectId(item.id)},
        {"$set": item.dict(exclude={"id"})}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item updated"}

@router.delete("/delete")
def delete_closet_item(id: str, user_id: str = Depends(get_current_user_id)):
    result = closets_collection.delete_one({"user_id": user_id, "_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

@router.get("/user/{username}")
def get_user_closet(username: str):
    # First get the user's ID from their username
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Use user['email'] to match how user_id is stored in closet items
    user_closet = closets_collection.find({"user_id": user["email"]})
    grouped = {}
    for item in user_closet:
        item = convert_objectid(item)
        category = item["category"]
        grouped.setdefault(category, []).append(item)

    component_groups = [
        {
            "name": category,
            "image_url": items[0]["thumbnail"] if items else "",
            "clothing_items": items[:6]
        }
        for category, items in grouped.items()
    ]
    return {"closet": component_groups}

@router.post("/outfit/create")
async def create_outfit_post(
    image: UploadFile = File(...),
    caption: str = Form(None),
    user_id: str = Depends(get_current_user_id)
):
    # Upload image to S3
    image_bytes = await image.read()
    filename = f"outfit_{int(time.time())}_{image.filename}"
    s3_url = upload_to_s3(image_bytes, filename)
    post = {
        "user_id": user_id,
        "image_url": s3_url,
        "caption": caption,
        "timestamp": datetime.utcnow(),
        "components": []
    }
    result = outfit_posts_collection.insert_one(post)
    post["_id"] = str(result.inserted_id)
    print(f"[FASHION AGENT LEARNED] User {user_id} created a new outfit post: {caption}")
    return {"message": "Outfit post created", "post": post}

@router.get("/outfit/user/{username}")
def get_user_outfit_posts(username: str):
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    posts = list(outfit_posts_collection.find({"user_id": user["email"]}).sort("timestamp", -1))
    for post in posts:
        post["_id"] = str(post["_id"])
    return {"outfit_posts": posts}

@router.get("/outfit/{post_id}")
def get_outfit_post(post_id: str):
    from bson import ObjectId
    post = outfit_posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Outfit post not found")
    post["_id"] = str(post["_id"])
    return post

@router.put("/outfit/{post_id}")
def update_outfit_post(
    post_id: str,
    data: dict = Body(...),
    user_id: str = Depends(get_current_user_id)
):
    from bson import ObjectId
    update = {}
    if "caption" in data:
        update["caption"] = data["caption"]
    if "image_url" in data:
        update["image_url"] = data["image_url"]
    update["timestamp"] = datetime.utcnow()
    result = outfit_posts_collection.update_one(
        {"_id": ObjectId(post_id), "user_id": user_id},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Outfit post not found or not authorized")
    return {"message": "Outfit post updated"}

@router.delete("/outfit/{post_id}")
def delete_outfit_post(post_id: str, user_id: str = Depends(get_current_user_id)):
    from bson import ObjectId
    result = outfit_posts_collection.delete_one({"_id": ObjectId(post_id), "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Outfit post not found or not authorized")
    return {"message": "Outfit post deleted"}

@router.post("/outfit/{post_id}/add-component")
def add_outfit_component(post_id: str, component: OutfitComponent, user_id: str = Depends(get_current_user_id)):
    from bson import ObjectId
    result = outfit_posts_collection.update_one(
        {"_id": ObjectId(post_id), "user_id": user_id},
        {"$push": {"components": component.dict()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Outfit post not found or not authorized")
    print(f"[FASHION AGENT LEARNED] User {user_id} tagged component: {component.name}, {component.category}, {getattr(component, 'image_url', None)}")
    return {"message": "Component added"}

@router.put("/outfit/{post_id}/update-component/{index}")
def update_outfit_component(post_id: str, index: int, component: OutfitComponent, user_id: str = Depends(get_current_user_id)):
    from bson import ObjectId
    post = outfit_posts_collection.find_one({"_id": ObjectId(post_id), "user_id": user_id})
    if not post or index < 0 or index >= len(post["components"]):
        raise HTTPException(status_code=404, detail="Component not found or not authorized")
    post["components"][index] = component.dict()
    outfit_posts_collection.update_one({"_id": ObjectId(post_id)}, {"$set": {"components": post["components"]}})
    return {"message": "Component updated"}

@router.delete("/outfit/{post_id}/remove-component/{index}")
def remove_outfit_component(post_id: str, index: int, user_id: str = Depends(get_current_user_id)):
    from bson import ObjectId
    post = outfit_posts_collection.find_one({"_id": ObjectId(post_id), "user_id": user_id})
    if not post or index < 0 or index >= len(post["components"]):
        raise HTTPException(status_code=404, detail="Component not found or not authorized")
    post["components"].pop(index)
    outfit_posts_collection.update_one({"_id": ObjectId(post_id)}, {"$set": {"components": post["components"]}})
    return {"message": "Component removed"}

@router.put("/outfit/{post_id}/replace-components")
def replace_outfit_components(post_id: str, components: list[OutfitComponent], user_id: str = Depends(get_current_user_id)):
    from bson import ObjectId
    result = outfit_posts_collection.update_one(
        {"_id": ObjectId(post_id), "user_id": user_id},
        {"$set": {"components": [c.dict() for c in components]}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Outfit post not found or not authorized")
    return {"message": "Components replaced"}

