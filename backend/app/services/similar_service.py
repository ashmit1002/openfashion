from openai import OpenAI
from app.config.settings import settings
import time
from serpapi import GoogleSearch
from urllib.parse import quote

client = OpenAI(api_key=settings.OPENAI_API_KEY)
SERP_API_KEY = settings.SERP_API_KEY

def get_initial_search_results(image_url: str, category: str) -> list:
    """Get initial search results to help guide the query generation"""
    try:
        params = {
            "engine": "google_lens",
            "url": image_url,
            "api_key": SERP_API_KEY,
            "hl": "en",
            "gl": "us"
        }
        
        search = GoogleSearch(params)
        results = search.get_dict()
        return results.get("visual_matches", [])[:3]  # Get top 3 matches for context
    except Exception as e:
        print(f"❌ Failed to get initial search results: {e}")
        return []

def generate_fashion_search_query(title: str, category: str, context: str = "", image_url: str = "") -> str:
    """
    Generate a fashion search query using OpenAI's GPT-4-turbo with vision capabilities.
    Analyzes both the original image and similar item thumbnails to create precise queries.
    """
    try:
        # Get initial search results for context
        initial_results = get_initial_search_results(image_url, category) if image_url else []
        
        if not initial_results:
            return f"{category} {title}"

        # Use the first result's thumbnail for visual analysis
        first_result = initial_results[0]
        thumbnail_url = first_result.get('thumbnail')
        
        if not thumbnail_url:
            return f"{category} {title}"

        # Prepare the vision-based prompt
        response = client.chat.completions.create(
            model="gpt-4-vision-preview",  # Using GPT-4 with vision capabilities
            messages=[
                {
                    "role": "system",
                    "content": "You are a fashion expert who analyzes clothing images and creates precise search queries. Focus on visual characteristics like style, fit, material, and design elements."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"""Analyze this clothing item and create a search query to find similar items.

Context:
- Category: {category}
- Title: {title}
- Color: {context}

Requirements:
1. Focus on visual characteristics:
   - Fit (oversized, fitted, loose)
   - Style (casual, streetwear, formal)
   - Design elements (graphic, plain, patterned)
   - Material (cotton, denim, knit)
2. Keep the query under 6 words
3. Include the color if provided
4. Prioritize visual similarity

Generate a search query that will find visually similar items:"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": thumbnail_url,
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            temperature=0.3,
            max_tokens=30
        )

        # Extract and clean the generated query
        query = response.choices[0].message.content.strip().strip('"').strip("'")
        
        print(f"\n🤖 GPT-4 Vision Analysis:")
        print(f"Original Image: {image_url}")
        print(f"Analyzed Thumbnail: {thumbnail_url}")
        print(f"Generated Query: {query}")
        
        # Ensure we have a valid query
        if not query or len(query) < 3:
            fallback = f"{category} {title}"
            print(f"⚠️ Using fallback query: {fallback}")
            return fallback
            
        return query

    except Exception as e:
        print(f"❌ Failed to generate query for: {title}, Error: {e}")
        fallback = f"{category} {title}"
        print(f"⚠️ Using fallback query: {fallback}")
        return fallback
