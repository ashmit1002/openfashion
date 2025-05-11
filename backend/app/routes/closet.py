from fastapi import APIRouter, Depends, HTTPException, Request, Form, UploadFile, File
from pydantic import BaseModel
from app.auth.dependencies import get_current_user_id
from app.storage import user_closets

router = APIRouter(tags=["Closet"])  # ✅ This line was missing

class ClosetItem(BaseModel):
    name: str
    category: str
    price: str
    link: str
    thumbnail: str

@router.get("/")
def get_closet(user_id: str = Depends(get_current_user_id)):
    closet = user_closets.get(user_id, {})

    component_groups = [
        {
            "name": category,
            "image_url": items[0]["thumbnail"] if items else "",
            "clothing_items": items[:6]
        }
        for category, items in closet.items()
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
    import os, time
    os.makedirs("uploads", exist_ok=True)
    filename = f"{int(time.time())}_{thumbnail.filename}"
    path = f"uploads/{filename}"
    with open(path, "wb") as f:
        f.write(await thumbnail.read())

    if user_id not in user_closets:
        user_closets[user_id] = {}

    user_closets[user_id].setdefault(category, [])
    new_item = {
        "name": name,
        "category": category,
        "price": price,
        "link": link,
        "thumbnail": f"http://localhost:8000/{path}"
    }
    user_closets[user_id][category].append(new_item)

    return {"message": "Item added to closet", "item": new_item}

@router.put("/update")
def update_closet_item(item: ClosetItem, user_id: str = Depends(get_current_user_id)):
    closet = user_closets.get(user_id, {})
    category_items = closet.get(item.category, [])

    for i, existing in enumerate(category_items):
        if existing["link"] == item.link:
            category_items[i] = item.dict()
            return {"message": "Item updated"}

    raise HTTPException(status_code=404, detail="Item not found")

@router.delete("/delete")
def delete_closet_item(link: str, category: str, user_id: str = Depends(get_current_user_id)):
    closet = user_closets.get(user_id, {})
    items = closet.get(category, [])

    updated_items = [item for item in items if item["link"] != link]
    if len(updated_items) == len(items):
        raise HTTPException(status_code=404, detail="Item not found")

    user_closets[user_id][category] = updated_items
    return {"message": "Item deleted"}