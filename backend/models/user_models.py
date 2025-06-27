from typing import List, Optional, Union
from pydantic import BaseModel, Field
from uuid import UUID, uuid4

class StylePreference(BaseModel):
    category: str
    confidence_score: float = Field(ge=0.0, le=1.0)

class UserStyleProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    style_summary: str
    style_preferences: List[StylePreference] = []

class UserInteraction(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: str
    interaction_type: str  # 'like', 'upload', 'wishlist', 'view'
    item_id: UUID
    metadata: dict = {}

class StyleQuizResponse(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: str
    question_id: str
    response: Union[str, List[str]]

class StyleQuiz(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: str
    responses: List[StyleQuizResponse] = []
    completed: bool = False
    archived: bool = False

class SubmitQuizResponseRequest(BaseModel):
    question_id: str
    response: Union[str, List[str]]

