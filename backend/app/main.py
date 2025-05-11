from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import upload, closet
from app.auth.routes import router as auth_router
from fastapi.staticfiles import StaticFiles

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
app.include_router(auth_router, prefix="/api/auth")           # Auth routes
app.include_router(upload.router, prefix="/api", tags=["Upload"])  # Upload
app.include_router(closet.router, prefix="/api/closet", tags=["Closet"])  # Closet
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
