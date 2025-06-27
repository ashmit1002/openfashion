import logging
import openai
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models.user_models import StyleQuiz, StyleQuizResponse, UserStyleProfile, UserInteraction, SubmitQuizResponseRequest
from uuid import UUID, uuid4
from bson import ObjectId
from app.database import style_profiles_collection, user_interactions_collection, style_quizzes_collection
from app.auth.dependencies import get_current_user_id
from app.data.style_quiz_questions import STYLE_QUIZ_QUESTIONS
import json
from openai import AsyncOpenAI
from app.config.settings import settings

router = APIRouter()

logger = logging.getLogger(__name__)

# Initialize OpenAI client with API key from settings
client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
)

@router.post("/quiz/start")
async def start_style_quiz(user_id: str = Depends(get_current_user_id)):
    """Start a new style quiz for a user"""
    # Check if user already has a completed quiz
    existing_quiz = style_quizzes_collection.find_one({
        "user_id": user_id,
        "completed": True
    })
    if existing_quiz:
        raise HTTPException(status_code=400, detail="User already completed style quiz")
    
    quiz = {
        "user_id": user_id,
        "responses": [],
        "completed": False,
    }
    result = style_quizzes_collection.insert_one(quiz)
    quiz["id"] = str(result.inserted_id)
    return quiz

@router.post("/quiz/submit-response")
async def submit_quiz_response(
    response_request: SubmitQuizResponseRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Submit a response to a style quiz question"""
    # Construct the full StyleQuizResponse model
    full_response = StyleQuizResponse(
        id=uuid4(),
        user_id=user_id,
        question_id=response_request.question_id,
        response=response_request.response,
    )

    # Convert the UUID id to string before saving to MongoDB
    response_dict = full_response.dict()
    response_dict['id'] = str(full_response.id)

    # Validate question exists
    if not any(q["id"] == full_response.question_id for q in STYLE_QUIZ_QUESTIONS):
        raise HTTPException(status_code=400, detail="Invalid question ID")

    # Add response to quiz
    style_quizzes_collection.update_one(
        {"user_id": user_id, "completed": False},
        {
            "$push": {
                "responses": response_dict
            }
        }
    )
    return full_response

@router.post("/quiz/complete")
async def complete_style_quiz(user_id: str = Depends(get_current_user_id)):
    """Complete the style quiz and generate initial style profile"""
    # Get the user's quiz
    quiz = style_quizzes_collection.find_one({
        "user_id": user_id,
        "completed": False
    })
    if not quiz:
        raise HTTPException(status_code=404, detail="No active quiz found")
    
    # Mark quiz as completed
    style_quizzes_collection.update_one(
        {"_id": quiz["_id"]},
        {
            "$set": {
                "completed": True,
            }
        }
    )
    
    # Generate style profile using GPT
    style_profile = await generate_initial_style_profile(quiz)
    
    # Log the GPT output
    logger.info("=== Style Quiz GPT Output ===")
    logger.info("User ID: %s", user_id)
    logger.info("Quiz Responses:")
    for response in quiz["responses"]:
        logger.info("Q: %s", response['question_id'])
        logger.info("A: %s", response['response'])
    logger.info("Generated Style Profile:")
    # Convert UUID to string for JSON serialization in logging
    profile_dict = style_profile.dict()
    profile_dict['id'] = str(profile_dict['id'])

    # Convert datetime objects to strings for JSON serialization in logging
    if 'created_at' in profile_dict and isinstance(profile_dict['created_at'], datetime):
        profile_dict['created_at'] = profile_dict['created_at'].isoformat()
    if 'updated_at' in profile_dict and isinstance(profile_dict['updated_at'], datetime):
        profile_dict['updated_at'] = profile_dict['updated_at'].isoformat()

    logger.info(json.dumps(profile_dict, indent=2))
    logger.info("===========================")
    
    # Save style profile
    # Convert UUID id to string before saving to MongoDB
    profile_to_save = style_profile.dict()
    profile_to_save['id'] = str(profile_to_save['id'])
    result = style_profiles_collection.insert_one(profile_to_save)
    style_profile.id = str(result.inserted_id)
    
    return style_profile

@router.post("/interactions/track")
async def track_user_interaction(
    interaction: UserInteraction,
    user_id: str = Depends(get_current_user_id)
):
    """Track a user interaction and update their style profile"""
    if interaction.user_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot track interaction for another user")
    
    # Save interaction
    interaction_dict = interaction.dict()
    user_interactions_collection.insert_one(interaction_dict)
    
    # Update style profile
    updated_profile = await update_style_profile(interaction)
    return updated_profile

@router.get("/for-you/recommendations")
async def get_recommendations(user_id: str = Depends(get_current_user_id)):
    """Get personalized recommendations for the user"""
    # Get user's style profile
    profile = style_profiles_collection.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Style profile not found")
    
    # Get recent interactions
    recent_interactions = list(user_interactions_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(50))
    
    # Generate recommendations
    recommendations = await generate_recommendations(profile, recent_interactions)
    return recommendations

@router.get("/test-gpt-output")
async def test_gpt_output():
    """Test endpoint to demonstrate GPT outputs for different quiz responses"""
    # Example 1: Minimalist Style
    minimalist_responses = [
        {"question_id": "style_preference", "response": "Minimalist"},
        {"question_id": "color_preference", "response": "Neutral tones (black, white, gray, beige)"},
        {"question_id": "occasion_focus", "response": "Work/Professional"},
        {"question_id": "style_inspiration", "response": "Clean lines, simple silhouettes, and timeless pieces"},
        {"question_id": "favorite_items", "response": "Tailored blazers, straight-leg trousers, and simple white tees"},
        {"question_id": "style_goals", "response": "Build a capsule wardrobe with versatile pieces"},
        {"question_id": "brand_preference", "response": "COS, Everlane, and Uniqlo"},
        {"question_id": "seasonal_preference", "response": "Fall"}
    ]
    
    # Example 2: Streetwear Style
    streetwear_responses = [
        {"question_id": "style_preference", "response": "Streetwear"},
        {"question_id": "color_preference", "response": "Bold colors (red, yellow, blue)"},
        {"question_id": "occasion_focus", "response": "Casual daily wear"},
        {"question_id": "style_inspiration", "response": "Urban culture, hip-hop, and skateboarding"},
        {"question_id": "favorite_items", "response": "Oversized hoodies, graphic tees, and sneakers"},
        {"question_id": "style_goals", "response": "Stay current with streetwear trends while maintaining comfort"},
        {"question_id": "brand_preference", "response": "Supreme, Nike, and Off-White"},
        {"question_id": "seasonal_preference", "response": "Summer"}
    ]
    
    # Generate profiles for both examples
    minimalist_profile = await generate_initial_style_profile({"responses": minimalist_responses, "user_id": "test_user"})
    streetwear_profile = await generate_initial_style_profile({"responses": streetwear_responses, "user_id": "test_user"})
    
    return {
        "minimalist_profile": minimalist_profile.dict(),
        "streetwear_profile": streetwear_profile.dict()
    }

@router.get("/quiz-status")
async def get_quiz_status(user_id: str = Depends(get_current_user_id)):
    """Get the current status of the user's style quiz"""
    quiz = style_quizzes_collection.find_one({"user_id": user_id})
    if not quiz:
        return {
            "has_quiz": False,
            "is_completed": False,
            "can_retake": True
        }
    
    return {
        "has_quiz": True,
        "is_completed": quiz.get("completed", False),
        "can_retake": True,  # Users can always retake the quiz
    }

@router.post("/quiz/retake")
async def retake_quiz(user_id: str = Depends(get_current_user_id)):
    """Start a new quiz, invalidating the previous one"""
    # Archive the old quiz if it exists
    old_quiz = style_quizzes_collection.find_one({"user_id": user_id})
    if old_quiz:
        style_quizzes_collection.update_one(
            {"_id": old_quiz["_id"]},
            {"$set": {"archived": True}}
        )
    
    # Create new quiz
    quiz = {
        "user_id": user_id,
        "responses": [],
        "completed": False,
        "archived": False
    }
    result = style_quizzes_collection.insert_one(quiz)
    quiz["_id"] = str(result.inserted_id)
    
    return quiz

@router.get("/quiz-questions")
async def get_quiz_questions():
    """Get all style quiz questions"""
    return STYLE_QUIZ_QUESTIONS

@router.get("/current-quiz")
async def get_current_quiz(user_id: str = Depends(get_current_user_id)):
    """Get the user's current active quiz"""
    quiz = style_quizzes_collection.find_one({
        "user_id": user_id,
        "archived": False
    })
    if not quiz:
        raise HTTPException(status_code=404, detail="No active quiz found")
    return quiz

async def generate_initial_style_profile(quiz: dict) -> UserStyleProfile:
    """Use GPT to analyze quiz responses and create initial style profile"""
    # Combine all responses into a prompt
    responses_text = "\n".join([
        f"Q: {r['question_id']}\nA: {r['response']}"
        for r in quiz["responses"]
    ])
    
    prompt = f"""Based on the following style quiz responses, create a detailed style profile:
    {responses_text}
    
    Please provide:
    1. A summary of their style preferences
    2. Key style categories they're interested in
    3. Confidence scores for each category
    
    Format the response as JSON with the following structure:
    {{
        "style_summary": "string",
        "style_preferences": [
            {{
                "category": "string",
                "confidence_score": float
            }}
        ]
    }}
    """
    
    try:
        response = await client.responses.create(
            model="gpt-4.1",
            input=[
                {"role": "system", "content": "You are a fashion expert analyzing style preferences. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Add debug logging
        logger.info("OpenAI Response: %s", response)
        logger.info("Response output_text: %s", response.output_text)
        
        try:
            profile_data = json.loads(response.output_text)
            # Validate the required fields
            if "style_summary" not in profile_data or "style_preferences" not in profile_data:
                raise ValueError("Missing required fields in profile data")
                
            return UserStyleProfile(
                user_id=quiz["user_id"],
                style_summary=profile_data["style_summary"],
                style_preferences=profile_data["style_preferences"]
            )
        except json.JSONDecodeError as e:
            logger.error("JSON Decode Error: %s", str(e))
            logger.error("Raw response: %s", response.output_text)
            raise HTTPException(status_code=500, detail=f"Invalid JSON response from GPT: {str(e)}")
        except ValueError as e:
            logger.error("Validation Error: %s", str(e))
            logger.error("Profile data: %s", profile_data)
            raise HTTPException(status_code=500, detail=f"Invalid profile data structure: {str(e)}")
    except Exception as e:
        logger.error("OpenAI API Error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Error calling OpenAI API: {str(e)}")

async def update_style_profile(interaction: UserInteraction) -> UserStyleProfile:
    """Update user's style profile based on new interaction"""
    # Get current profile
    profile = style_profiles_collection.find_one({"user_id": interaction.user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Style profile not found")
    
    # Get recent interactions
    recent_interactions = list(user_interactions_collection.find(
        {"user_id": interaction.user_id}
    ).sort("created_at", -1).limit(50))
    
    # Create prompt for GPT
    interactions_text = "\n".join([
        f"Type: {i['interaction_type']}, Item: {i['item_id']}, Metadata: {i['metadata']}"
        for i in recent_interactions
    ])
    
    prompt = f"""Based on the user's current style profile and recent interactions, update their preferences:
    
    Current Profile:
    {profile['style_summary']}
    
    Recent Interactions:
    {interactions_text}
    
    Please provide an updated style profile in the same JSON format as before.
    """
    
    try:
        response = await client.responses.create(
            model="gpt-4.1",
            input=[
                {"role": "system", "content": "You are a fashion expert analyzing style preferences. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Add debug logging
        logger.info("OpenAI Response: %s", response)
        logger.info("Response output_text: %s", response.output_text)
        
        try:
            updated_data = json.loads(response.output_text)
            # Validate the required fields
            if "style_summary" not in updated_data or "style_preferences" not in updated_data:
                raise ValueError("Missing required fields in updated data")
                
            updated_profile = UserStyleProfile(
                id=str(profile["_id"]),
                user_id=interaction.user_id,
                style_summary=updated_data["style_summary"],
                style_preferences=updated_data["style_preferences"]
            )
            
            # Update in database
            style_profiles_collection.update_one(
                {"_id": profile["_id"]},
                {"$set": updated_profile.dict()}
            )
            
            return updated_profile
        except json.JSONDecodeError as e:
            logger.error("JSON Decode Error: %s", str(e))
            logger.error("Raw response: %s", response.output_text)
            raise HTTPException(status_code=500, detail=f"Invalid JSON response from GPT: {str(e)}")
        except ValueError as e:
            logger.error("Validation Error: %s", str(e))
            logger.error("Updated data: %s", updated_data)
            raise HTTPException(status_code=500, detail=f"Invalid profile data structure: {str(e)}")
    except Exception as e:
        logger.error("OpenAI API Error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Error calling OpenAI API: {str(e)}")

async def generate_recommendations(profile: dict, recent_interactions: List[dict]):
    """Generate personalized recommendations using GPT"""
    # Create prompt for GPT
    interactions_text = "\n".join([
        f"Type: {i['interaction_type']}, Item: {i['item_id']}, Metadata: {i['metadata']}"
        for i in recent_interactions
    ])
    
    prompt = f"""Based on the user's style profile and recent interactions, generate personalized recommendations:
    
    Style Profile:
    {profile['style_summary']}
    
    Recent Interactions:
    {interactions_text}
    
    Please provide recommendations in the following JSON format:
    {{
        "recommendations": [
            {{
                "item_type": "string",
                "description": "string",
                "reasoning": "string",
                "confidence_score": float
            }}
        ]
    }}
    """
    
    try:
        response = await client.responses.create(
            model="gpt-4.1",
            input=[
                {"role": "system", "content": "You are a fashion expert providing personalized recommendations. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Add debug logging
        logger.info("OpenAI Response: %s", response)
        logger.info("Response output_text: %s", response.output_text)
        
        try:
            recommendations = json.loads(response.output_text)
            # Validate the required fields
            if "recommendations" not in recommendations:
                raise ValueError("Missing recommendations field in response")
                
            return recommendations
        except json.JSONDecodeError as e:
            logger.error("JSON Decode Error: %s", str(e))
            logger.error("Raw response: %s", response.output_text)
            raise HTTPException(status_code=500, detail=f"Invalid JSON response from GPT: {str(e)}")
        except ValueError as e:
            logger.error("Validation Error: %s", str(e))
            logger.error("Recommendations data: %s", recommendations)
            raise HTTPException(status_code=500, detail=f"Invalid recommendations structure: {str(e)}")
    except Exception as e:
        logger.error("OpenAI API Error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Error calling OpenAI API: {str(e)}")

@router.get("/generate-search-queries")
async def generate_search_queries(user_id: str = Depends(get_current_user_id)):
    """Generate search queries based on user's style profile using GPT"""
    # Get user's style profile
    profile = style_profiles_collection.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Style profile not found")

    style_summary = profile.get("style_summary", "")
    style_preferences = profile.get("style_preferences", [])

    if not style_summary:
        raise HTTPException(status_code=404, detail="Style summary not available for this user.")

    # Format style preferences for the prompt
    preferences_text = ", ".join([pref["category"] for pref in style_preferences])

    prompt = f"""Based on the following style summary and preferences, generate a list of 5-10 search queries related to fashion items or styles that this user might be interested in.
Here is a very brief description of what a user's style preferences are:
Style Summary: {style_summary}
Style Preferences: {preferences_text}

Use this information to create a list of 5-10 search queries that you think the user would be most interested in to help them explore and discover styles and clothes that they may like.

Please provide the search queries in a JSON array of strings.
[
  "query 1",
  "query 2",
  ...
]"""

    try:
        response = await client.responses.create(
            model="gpt-4.1",
            input=[
                {"role": "system", "content": "You are a fashion search query generator. Always respond with a valid JSON array of strings."},
                {"role": "user", "content": prompt}
            ]
        )

        # Add debug logging
        logger.info("OpenAI Search Query Response: %s", response)
        logger.info("Search Query Response output_text: %s", response.output_text)

        try:
            search_queries = json.loads(response.output_text)
            if not isinstance(search_queries, list) or not all(isinstance(q, str) for q in search_queries):
                 raise ValueError("Invalid JSON response format: expected a list of strings.")

            return {"search_queries": search_queries}

        except json.JSONDecodeError as e:
            logger.error("JSON Decode Error: %s", str(e))
            logger.error("Raw response: %s", response.output_text)
            raise HTTPException(status_code=500, detail=f"Invalid JSON response from GPT: {str(e)}")
        except ValueError as e:
            logger.error("Validation Error: %s", str(e))
            logger.error("Response data: %s", search_queries)
            raise HTTPException(status_code=500, detail=f"Invalid response data structure: {str(e)}")
    except Exception as e:
        logger.error("OpenAI API Error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Error calling OpenAI API: {str(e)}")

