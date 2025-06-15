from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from app.auth.dependencies import get_current_user_id
from app.database import closets_collection, users_collection
from app.models.closet import ClosetItem
from bson import ObjectId
import os, time

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
    os.makedirs("uploads", exist_ok=True)
    filename = f"{int(time.time())}_{thumbnail.filename}"
    path = f"uploads/{filename}"
    with open(path, "wb") as f:
        f.write(await thumbnail.read())

    item = {
        "user_id": user_id,
        "name": name,
        "category": category,
        "price": price,
        "link": link,
        "thumbnail": f"http://localhost:8000/{path}"
    }
    closets_collection.insert_one(item)
    return {"message": "Item added to closet", "item": convert_objectid(item)}

@router.put("/update")
def update_closet_item(item: ClosetItem, user_id: str = Depends(get_current_user_id)):
    result = closets_collection.update_one(
        {"user_id": user_id, "link": item.link},
        {"$set": item.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item updated"}

@router.delete("/delete")
def delete_closet_item(link: str, category: str, user_id: str = Depends(get_current_user_id)):
    result = closets_collection.delete_one({"user_id": user_id, "link": link, "category": category})
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
