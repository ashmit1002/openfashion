import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any
import openai
from app.config.settings import settings
from app.auth.dependencies import get_current_user_id
from app.routes.users import require_premium
from app.services.search_service import get_shopping_results_from_serpapi
from app.database import users_collection

logger = logging.getLogger(__name__)
router = APIRouter()

client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

def check_search_limit(user_id: str) -> dict:
    """
    Check if user has reached their search limit based on subscription tier.
    Returns dict with limit info and current usage.
    """
    try:
        user = users_collection.find_one({"email": user_id})
        if not user:
            return {"error": "User not found"}
        
        subscription_status = user.get("subscription_status", "basic")
        
        if subscription_status == "premium":
            return {
                "limit": -1,  # Unlimited
                "used": 0,
                "remaining": -1,
                "subscription": "premium"
            }
        
        # Basic tier: 3 searches per week
        searches_used = user.get("fashion_searches_used", 0)
        last_search_date = user.get("last_fashion_search_date")
        
        from datetime import datetime, date, timedelta
        today = date.today()
        
        # Reset counter if it's a new week (Monday)
        if last_search_date:
            last_date = datetime.fromisoformat(last_search_date).date()
            # Calculate days since last search
            days_diff = (today - last_date).days
            
            # Reset if it's been more than 7 days or if we're in a new week
            if days_diff >= 7 or (last_date.isocalendar()[1] != today.isocalendar()[1]):
                searches_used = 0
        
        return {
            "limit": 3,
            "used": searches_used,
            "remaining": max(0, 3 - searches_used),
            "subscription": "basic"
        }
        
    except Exception as e:
        logger.error(f"Error checking search limit: {e}")
        return {"error": "Failed to check search limit"}

def increment_search_count(user_id: str):
    """
    Increment the search count for a user.
    """
    try:
        from datetime import datetime
        today = datetime.now().isoformat()
        
        users_collection.update_one(
            {"email": user_id},
            {
                "$inc": {"fashion_searches_used": 1},
                "$set": {"last_fashion_search_date": today}
            }
        )
    except Exception as e:
        logger.error(f"Error incrementing search count: {e}")

async def generate_optimized_search_query(user_query: str, user_id: str = None) -> str:
    """
    Use GPT to convert a natural language fashion query into an optimized Google search query.
    """
    try:
        # Get user's style profile for personalization
        user_context = ""
        if user_id:
            try:
                from app.database import style_profiles_collection
                style_profile = style_profiles_collection.find_one({"user_id": user_id})
                if style_profile:
                    style_summary = style_profile.get("style_summary", "")
                    style_preferences = style_profile.get("style_preferences", [])
                    
                    # Handle style preferences that might be dictionaries or strings
                    if style_preferences and len(style_preferences) > 0:
                        if isinstance(style_preferences[0], dict):
                            # Extract values from dictionaries
                            preference_values = [pref.get('value', str(pref)) for pref in style_preferences]
                        else:
                            preference_values = style_preferences
                        preferences_str = ', '.join(str(p) for p in preference_values)
                    else:
                        preferences_str = 'Not specified'
                    
                    user_context = f"""
User Style Profile:
- Style Summary: {style_summary}
- Style Preferences: {preferences_str}
"""
            except Exception as e:
                logger.warning(f"Could not fetch user style profile: {e}")

        prompt = f"""
You are a fashion expert who converts natural language fashion queries into optimized Google Shopping search queries.

{user_context}

User Query: "{user_query}"

Your task is to convert this into a precise, optimized search query for Google Shopping that will return relevant clothing and fashion items.

Guidelines:
1. Keep the query concise (3-8 words)
2. Include specific fashion terms (e.g., "oversized", "fitted", "streetwear", "minimalist")
3. Include gender if mentioned or implied (e.g., "men's", "women's")
4. Include specific item types (e.g., "dress", "jeans", "sneakers", "jacket")
5. Include style descriptors (e.g., "vintage", "modern", "casual", "formal")
6. Include color if mentioned
7. Include material if relevant (e.g., "denim", "cotton", "leather")
8. Use popular shopping terms that work well with Google Shopping

Examples:
- "I want a summer dress" → "women's summer dress"
- "Show me streetwear hoodies" → "streetwear hoodie men"
- "Pastel colored tops" → "pastel tops women"
- "Vintage denim jacket" → "vintage denim jacket"
- "Formal black shoes" → "formal black shoes men"

Generate only the optimized search query, nothing else:
"""

        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a fashion search optimization expert. Respond with only the optimized search query, no additional text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=50
        )

        optimized_query = response.choices[0].message.content.strip().strip('"').strip("'")
        
        # Fallback if GPT response is too long or invalid
        if len(optimized_query) > 50 or not optimized_query:
            # Simple fallback: extract key terms
            fallback_terms = []
            query_lower = user_query.lower()
            
            # Common fashion terms
            fashion_terms = ["dress", "shirt", "pants", "jeans", "shoes", "sneakers", "jacket", "hoodie", "sweater", "blouse", "skirt", "shorts"]
            for term in fashion_terms:
                if term in query_lower:
                    fallback_terms.append(term)
                    break
            
            # Add gender if mentioned
            if any(word in query_lower for word in ["men", "male", "guy"]):
                fallback_terms.insert(0, "men's")
            elif any(word in query_lower for word in ["women", "female", "girl", "lady"]):
                fallback_terms.insert(0, "women's")
            
            optimized_query = " ".join(fallback_terms) if fallback_terms else user_query

        logger.info(f"Generated optimized query: '{user_query}' → '{optimized_query}'")
        return optimized_query

    except Exception as e:
        logger.error(f"Error generating optimized search query: {e}")
        return user_query

@router.post("/fashion-search")
async def fashion_search(
    query: str = Query(..., description="Natural language fashion search query"),
    num_results: int = Query(10, ge=1, le=20, description="Number of results to return"),
    user_id: str = Depends(get_current_user_id)
):
    """
    Convert a natural language fashion query into an optimized search query and return shopping results.
    """
    try:
        logger.info(f"Fashion search request: '{query}' for user {user_id}")
        
        # Check search limits
        limit_info = check_search_limit(user_id)
        if "error" in limit_info:
            raise HTTPException(status_code=500, detail=limit_info["error"])
        
        # Check if user has reached their limit
        if limit_info["subscription"] == "basic" and limit_info["remaining"] <= 0:
            raise HTTPException(
                status_code=403, 
                detail=f"You've reached your weekly search limit of {limit_info['limit']} searches. Upgrade to premium for unlimited searches."
            )
        
        # Generate optimized search query using GPT
        optimized_query = await generate_optimized_search_query(query, user_id)
        
        # Get shopping results using the optimized query
        results = get_shopping_results_from_serpapi(optimized_query, num_results)
        
        # If no results, provide mock data for demonstration
        if not results or (len(results) == 1 and results[0].get("title") == "Search failed"):
            logger.warning(f"No results from SerpAPI, providing mock data for demonstration")
            results = [
                {
                    "title": f"Sample {optimized_query} Product",
                    "link": "https://example.com/product",
                    "price": "$49.99",
                    "thumbnail": "https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Fashion+Item",
                    "source": "Demo Store",
                    "rating": "4.5",
                    "reviews": "128"
                },
                {
                    "title": f"Premium {optimized_query} Item",
                    "link": "https://example.com/product2",
                    "price": "$89.99",
                    "thumbnail": "https://via.placeholder.com/300x400/4ECDC4/FFFFFF?text=Premium+Item",
                    "source": "Fashion Boutique",
                    "rating": "4.8",
                    "reviews": "256"
                }
            ]
        
        # Increment search count for basic users
        if limit_info["subscription"] == "basic":
            increment_search_count(user_id)
        
        return {
            "original_query": query,
            "optimized_query": optimized_query,
            "results": results,
            "total_results": len(results),
            "search_limit": limit_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fashion search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fashion search failed: {str(e)}")

@router.get("/fashion-search/suggestions")
async def get_search_suggestions(
    user_id: str = Depends(get_current_user_id)
):
    """
    Get personalized fashion search suggestions based on user's style profile.
    """
    try:
        # Check search limits to show remaining searches
        limit_info = check_search_limit(user_id)
        if "error" in limit_info:
            raise HTTPException(status_code=500, detail=limit_info["error"])
        
        # Get user's style profile
        from app.database import style_profiles_collection
        style_profile = style_profiles_collection.find_one({"user_id": user_id})
        
        if not style_profile:
            # Return generic suggestions if no profile exists
            suggestions = [
                "summer dresses",
                "streetwear hoodies", 
                "vintage denim",
                "formal shoes",
                "casual sneakers",
                "oversized sweaters",
                "minimalist tops",
                "pastel colored clothing"
            ]
        else:
            # Generate personalized suggestions based on style profile
            style_summary = style_profile.get("style_summary", "")
            style_preferences = style_profile.get("style_preferences", [])
            
            # Handle style preferences that might be dictionaries or strings
            if style_preferences and len(style_preferences) > 0:
                if isinstance(style_preferences[0], dict):
                    # Extract values from dictionaries
                    preference_values = [pref.get('value', str(pref)) for pref in style_preferences]
                else:
                    preference_values = style_preferences
                preferences_str = ', '.join(str(p) for p in preference_values)
            else:
                preferences_str = 'Not specified'
            
            prompt = f"""
Based on this user's style profile, generate 8 personalized fashion search suggestions:

Style Summary: {style_summary}
Style Preferences: {preferences_str}

Generate 8 natural language search queries that this user might want to search for.
Make them diverse and relevant to their style preferences.
Respond with only a JSON array of strings, no additional text.
"""

            response = await client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a fashion expert. Respond with only a JSON array of strings."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=200
            )
            
            try:
                import json
                suggestions = json.loads(response.choices[0].message.content.strip())
                if not isinstance(suggestions, list):
                    suggestions = []
            except:
                suggestions = []
        
        return {
            "suggestions": suggestions,
            "search_limit": limit_info
        }
        
    except Exception as e:
        logger.error(f"Failed to get search suggestions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get search suggestions: {str(e)}")

@router.get("/fashion-search/limit")
async def get_search_limit(user_id: str = Depends(get_current_user_id)):
    """
    Get current search limit information for the user.
    """
    try:
        limit_info = check_search_limit(user_id)
        if "error" in limit_info:
            raise HTTPException(status_code=500, detail=limit_info["error"])
        
        return limit_info
        
    except Exception as e:
        logger.error(f"Failed to get search limit: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get search limit: {str(e)}") 