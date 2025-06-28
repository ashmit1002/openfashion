import mongomock
from fastapi.testclient import TestClient

from app.main import app
import app.database as db

client = TestClient(app)

# Set up an in-memory MongoDB using mongomock
mock_client = mongomock.MongoClient()
mock_db = mock_client["test_db"]

db.users_collection = mock_db["users"]
db.closets_collection = mock_db["closets"]
db.wishlist_collection = mock_db["wishlists"]
db.style_profiles_collection = mock_db["style_profiles"]
db.user_interactions_collection = mock_db["interactions"]
db.style_quizzes_collection = mock_db["quizzes"]


def test_register_and_login():
    res = client.post(
        "/api/auth/register",
        json={"email": "t@example.com", "password": "pw", "username": "tester"},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    assert token

    res = client.post(
        "/api/auth/login",
        json={"email": "t@example.com", "password": "pw"},
    )
    assert res.status_code == 200
    assert res.json()["access_token"]

