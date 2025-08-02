from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, closet, wishlist, outfit, user

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.openfashionapp.com",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(closet.router, prefix="/api/closet", tags=["Closet"])
app.include_router(wishlist.router, prefix="/api/wishlist", tags=["Wishlist"])
app.include_router(outfit.router, prefix="/api/outfit", tags=["Outfit"])
app.include_router(user.router, prefix="/api/user", tags=["User"])

@app.get("/")
async def root():
    return {"message": "Welcome to OpenFashion API"} 