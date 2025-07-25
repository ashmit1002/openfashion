from pymongo import MongoClient
from app.config.settings import settings

client = MongoClient(settings.MONGO_URI)
db = client[settings.MONGO_DB]

users_collection = db["users"]
closets_collection = db["closets"]
wishlist_collection = db["wishlists"]
style_profiles_collection = db["style_profiles"]
user_interactions_collection = db["user_interactions"]
style_quizzes_collection = db["style_quizzes"]
outfit_posts_collection = db["outfit_posts"]
analysis_jobs_collection = db["analysis_jobs"]

# Create indexes for better performance
wishlist_collection.create_index([("user_id", 1)])
wishlist_collection.create_index([("tags", 1)])
wishlist_collection.create_index([("category", 1)])

# Create indexes for style profiles and interactions
style_profiles_collection.create_index([("user_id", 1)])
user_interactions_collection.create_index([("user_id", 1)])
user_interactions_collection.create_index([("interaction_type", 1)])
style_quizzes_collection.create_index([("user_id", 1)])

# Create indexes for analysis jobs
analysis_jobs_collection.create_index([("user_id", 1)])
analysis_jobs_collection.create_index([("status", 1)])
analysis_jobs_collection.create_index([("created_at", 1)])
