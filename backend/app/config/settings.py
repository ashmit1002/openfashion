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
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "fashionwebapp")

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

    # Stripe - Using the provided test keys
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_51ReqBlQPE7rsnsEKExBnXkXEU0odfo5o8Cu3P7iEI2moXV6pJ8ZCzsCrjqUDPT3AJH1ND7ohmR3Z4bIDwmWQxVCR005eRnlKwV")
    STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_51ReqBlQPE7rsnsEKd0m3Eh0GkbKR1ncgck2dibedRS72JW76AOac18krNY9wcxj9LXs2h5MbLJmJRALbONlTrWkH00ydE46MtG")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

settings = Settings()
