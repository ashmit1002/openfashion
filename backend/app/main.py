import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import upload, closet, wishlist
from app.auth.routes import router as auth_router
from app.routes.users import router as users_router
from app.routers.style_quiz import router as style_quiz_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(title="OpenFashion API")

# Allow all origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include routes
app.include_router(auth_router, prefix="/api/auth")  # Auth routes
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])  # Upload
app.include_router(closet.router, prefix="/api/closet", tags=["Closet"])  # Closet
app.include_router(wishlist.router, prefix="/api/wishlist", tags=["Wishlist"])  # Wishlist
app.include_router(users_router, prefix="/api/users", tags=["Users"])  # Users
app.include_router(style_quiz_router, prefix="/api/style", tags=["Style"])  # Style Quiz & Recommendations

# Serve static uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
