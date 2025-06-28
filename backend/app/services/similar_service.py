from openai import OpenAI
from app.config.settings import settings
import time
from serpapi import GoogleSearch
from urllib.parse import quote
import re, json

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
            model="gpt-4o",  # Use GPT-4o for vision/multimodal
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

def hex_to_color_name(hex_color: str) -> str:
    """
    Convert hex color to a human-readable color name.
    """
    if not hex_color or not hex_color.startswith('#'):
        return ""
    
    # Common color mappings
    color_map = {
        '#000000': 'black', '#ffffff': 'white', '#ff0000': 'red', '#00ff00': 'green',
        '#0000ff': 'blue', '#ffff00': 'yellow', '#ff00ff': 'magenta', '#00ffff': 'cyan',
        '#808080': 'gray', '#c0c0c0': 'silver', '#800000': 'maroon', '#808000': 'olive',
        '#008000': 'green', '#800080': 'purple', '#008080': 'teal', '#000080': 'navy',
        '#ffa500': 'orange', '#ffc0cb': 'pink', '#a52a2a': 'brown', '#dda0dd': 'plum',
        '#f0e68c': 'khaki', '#98fb98': 'pale green', '#87ceeb': 'sky blue', '#d2691e': 'chocolate',
        '#ff6347': 'tomato', '#40e0d0': 'turquoise', '#ee82ee': 'violet', '#f5deb3': 'wheat',
        '#9b968a': 'taupe', '#8b4513': 'saddle brown', '#2f4f4f': 'dark slate gray',
        '#696969': 'dim gray', '#b8860b': 'dark goldenrod', '#cd853f': 'peru'
    }
    
    # Try exact match first
    if hex_color.lower() in color_map:
        return color_map[hex_color.lower()]
    
    # If no exact match, try to find closest color
    try:
        # Convert hex to RGB
        hex_color = hex_color.lstrip('#')
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
        
        # Simple color classification
        if r > 200 and g > 200 and b > 200:
            return 'white'
        elif r < 50 and g < 50 and b < 50:
            return 'black'
        elif r > g and r > b:
            return 'red'
        elif g > r and g > b:
            return 'green'
        elif b > r and b > g:
            return 'blue'
        elif r > 200 and g > 200:
            return 'yellow'
        elif r > 200 and b > 200:
            return 'magenta'
        elif g > 200 and b > 200:
            return 'cyan'
        else:
            return 'neutral'
    except:
        return 'neutral'

async def generate_similar_item_queries(component_name: str, color: str = "", clothing_items: list = None, user_id: str = None) -> list:
    """
    Generate search queries based on metadata from reverse image search results
    AND user's universal style characteristics from their style profile.
    This creates much more personalized and relevant search queries.
    """
    try:
        # Convert hex color to color name
        color_name = hex_to_color_name(color) if color else ""
        
        # Get user's style profile for universal characteristics
        user_characteristics = {}
        if user_id:
            try:
                from app.database import style_profiles_collection, style_quizzes_collection
                
                # Get user's style profile
                style_profile = style_profiles_collection.find_one({"user_id": user_id})
                if style_profile:
                    user_characteristics["style_summary"] = style_profile.get("style_summary", "")
                    user_characteristics["style_preferences"] = style_profile.get("style_preferences", [])
                
                # Get user's quiz responses for specific characteristics
                quiz = style_quizzes_collection.find_one({"user_id": user_id, "completed": True})
                if quiz:
                    for response in quiz.get("responses", []):
                        if response["question_id"] == "gender":
                            user_characteristics["gender"] = response["response"]
                        elif response["question_id"] == "age_range":
                            user_characteristics["age_range"] = response["response"]
                        elif response["question_id"] == "primary_style":
                            user_characteristics["primary_style"] = response["response"]
                        elif response["question_id"] == "silhouette_preference":
                            user_characteristics["silhouette_preference"] = response["response"]
                        elif response["question_id"] == "color_palette":
                            user_characteristics["color_palette"] = response["response"]
                        elif response["question_id"] == "material_preference":
                            user_characteristics["material_preference"] = response["response"]
                        elif response["question_id"] == "price_sensitivity":
                            user_characteristics["price_sensitivity"] = response["response"]
                        elif response["question_id"] == "season_focus":
                            user_characteristics["season_focus"] = response["response"]
            except Exception as e:
                print(f"Error fetching user style profile: {e}")
        
        if not clothing_items or len(clothing_items) == 0:
            # Fallback if no reverse image search results
            base_query = f"{component_name} {color_name}".strip()
            return [base_query]
        
        # Extract metadata from reverse image search results
        titles = [item.get("title", "") for item in clothing_items if item.get("title")]
        sources = [item.get("source", "") for item in clothing_items if item.get("source")]
        
        # Build context from reverse image search metadata
        metadata_context = ""
        if titles:
            metadata_context += f"Product titles found: {', '.join(titles[:3])}\n"
        if sources:
            metadata_context += f"Sources: {', '.join(set(sources[:3]))}\n"
        
        # Build user characteristics context
        user_context = ""
        if user_characteristics:
            user_context = "User Profile:\n"
            if user_characteristics.get("gender"):
                user_context += f"- Gender: {user_characteristics['gender']}\n"
            if user_characteristics.get("age_range"):
                user_context += f"- Age Range: {user_characteristics['age_range']}\n"
            if user_characteristics.get("primary_style"):
                user_context += f"- Primary Style: {user_characteristics['primary_style']}\n"
            if user_characteristics.get("silhouette_preference"):
                user_context += f"- Silhouette Preference: {user_characteristics['silhouette_preference']}\n"
            if user_characteristics.get("color_palette"):
                user_context += f"- Color Palette: {user_characteristics['color_palette']}\n"
            if user_characteristics.get("material_preference"):
                user_context += f"- Material Preference: {user_characteristics['material_preference']}\n"
            if user_characteristics.get("price_sensitivity"):
                user_context += f"- Price Range: {user_characteristics['price_sensitivity']}\n"
            if user_characteristics.get("season_focus"):
                user_context += f"- Season Focus: {user_characteristics['season_focus']}\n"
        
        # Create the prompt for GPT
        prompt = f"""
You are a fashion expert creating search queries for Google Shopping. Based on the following information, generate 5 highly specific and personalized search queries.

{user_context}

Reverse Image Search Results:
{metadata_context}

Item Details:
- Component: {component_name}

Requirements:
- Each query should be descriptive and 20 words or less
- Be specific and diverse (different styles, fits, materials)
- Use actual characteristics from the search results
- ALWAYS include the user's gender if available (e.g., "men", "women")
- Include relevant style characteristics (e.g., "streetwear", "minimalist", "oversized")
- Include color information when relevant
- Focus on the user's price sensitivity and material preferences
- Consider the user's silhouette preferences (tailored, oversized, form-fitting, etc.)

Generate 5 search queries that would help this specific user find similar items:
"""
        
        # Call GPT to generate queries
        import openai
        from app.config.settings import settings
        
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a fashion expert specializing in creating precise search queries for online shopping. Always respond with a JSON array of exactly 5 search query strings."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        # Parse the response
        try:
            import json
            content = response.choices[0].message.content.strip()
            
            # Try to extract JSON array from the response
            if content.startswith('[') and content.endswith(']'):
                queries = json.loads(content)
            else:
                # If not JSON, try to extract queries from text
                lines = content.split('\n')
                queries = []
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith('#') and not line.startswith('-'):
                        # Remove numbering and quotes
                        line = line.replace('"', '').replace("'", "")
                        if line.startswith(('1.', '2.', '3.', '4.', '5.')):
                            line = line[2:].strip()
                        if line:
                            queries.append(line)
            
            # Ensure we have exactly 5 queries
            if len(queries) > 5:
                queries = queries[:5]
            elif len(queries) < 5:
                # Fill with fallback queries
                while len(queries) < 5:
                    fallback = f"{component_name} {color_name}"
                    if user_characteristics.get("gender"):
                        fallback += f" {user_characteristics['gender'].lower()}"
                    queries.append(fallback)
            
            return queries
            
        except Exception as e:
            print(f"Error parsing GPT response: {e}")
            # Fallback queries
            fallback_queries = []
            for i in range(5):
                query = f"{component_name} {color_name}"
                if user_characteristics.get("gender"):
                    query += f" {user_characteristics['gender'].lower()}"
                if user_characteristics.get("primary_style"):
                    query += f" {user_characteristics['primary_style'].lower()}"
                fallback_queries.append(query)
            return fallback_queries
            
    except Exception as e:
        print(f"Error in generate_similar_item_queries: {e}")
        # Ultimate fallback
        return [f"{component_name} {color_name}".strip()]
