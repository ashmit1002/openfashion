import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "secretkey123")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB = os.getenv("MONGO_DB", "openfashion_db")

    # S3
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "openfashion-user-closets")
    WISHLIST_S3_BUCKET_NAME = os.getenv("WISHLIST_S3_BUCKET_NAME", "openfashion-user-wishlists")
    POSTS_S3_BUCKET_NAME = os.getenv("POSTS_S3_BUCKET_NAME", "openfashion-user-posts")

    # remove.bg
    REMOVE_BG_API_KEY = os.getenv("REMOVE_BG_API_KEY")

    # SerpAPI
    SERP_API_KEY = os.getenv("SERP_API_KEY")

    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    # Hugging Face
    HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
    
    # Google Search
    GOOGLE_SEARCH_API_KEY = os.getenv("GOOGLE_SEARCH_API_KEY")

    # Stripe - Production keys required
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    # Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

settings = Settings()
