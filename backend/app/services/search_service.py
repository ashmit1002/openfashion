from serpapi import GoogleSearch
from urllib.parse import quote
from app.config.settings import settings
from app.services.similar_service import generate_fashion_search_query

SERP_API_KEY = settings.SERP_API_KEY

def get_clothing_from_google_search(image_url: str, category_hint: str = "", color: str = ""):
    """
    Uses Google Lens search via SerpAPI to find clothing items similar to the image.
    Optionally adds a category and color hint to improve accuracy.
    """
    # Generate AI-enhanced search query
    search_query = generate_fashion_search_query(
        title=category_hint,  # Use category_hint as the title
        category=category_hint,
        context=color,  # Use color as context
        image_url=image_url  # Pass the image URL for vision analysis
    )
    search_term = f"{color} {search_query}".strip()
    
    params = {
        "engine": "google_lens",
        "url": image_url,
        "api_key": SERP_API_KEY,
        "hl": "en",
        "gl": "us"
    }

    if search_term:
        params["text"] = quote(search_term)

    try:
        search = GoogleSearch(params)
        results = search.get_dict()
        visual_matches = results.get("visual_matches", [])[:5]

        print(f"SerpAPI result for {image_url}:", visual_matches[:3])

        matches = []
        for m in visual_matches:
            source = m.get("source", "").lower()
            if any(domain in source for domain in ["louisvuitton", "grailed", "stockx", "ssense", "goat", "farfetch"]):
                matches.append({
                    "title": m.get("title"),
                    "link": m.get("link"),
                    "price": f"{m.get('price', {}).get('currency', '')} {m.get('price', {}).get('extracted_value', 'N/A')}" if m.get('price') else "N/A",
                    "thumbnail": m.get("thumbnail")
                })

        return matches or [
            {
                "title": m.get("title"),
                "link": m.get("link"),
                "price": f"{m.get('price', {}).get('currency', '')} {m.get('price', {}).get('extracted_value', 'N/A')}" if m.get('price') else "N/A",
                "thumbnail": m.get("thumbnail")
            } for m in visual_matches
        ]
    except Exception as e:
        print(f"Search failed for {image_url}: {e}")
        return [{"title": "Search failed", "link": "", "price": "N/A", "thumbnail": ""}]

def get_shopping_results_from_serpapi(query: str, num_results: int = 10):
    """
    Fetch shopping results from SerpAPI Google Shopping using a text query.
    Returns a list of items with title, link, price, thumbnail, and source/shop name.
    """
    print(f"[SerpAPI] Starting shopping search for query: '{query}' with {num_results} results")
    params = {
        "engine": "google_shopping",
        "q": query,
        "api_key": SERP_API_KEY,
        "hl": "en",
        "gl": "us",
        "num": num_results
    }
    print(f"[SerpAPI] API Key present: {'Yes' if SERP_API_KEY else 'No'}")
    try:
        print(f"[SerpAPI] Making request to SerpAPI with params: {params}")
        search = GoogleSearch(params)
        results = search.get_dict()
        print(f"[SerpAPI] Raw response keys: {list(results.keys())}")
        shopping_results = results.get("shopping_results", [])[:num_results]
        print(f"[SerpAPI] Found {len(shopping_results)} shopping results")
        items = []
        for item in shopping_results:
            items.append({
                "title": item.get("title"),
                "link": item.get("link"),
                "price": item.get("price"),
                "thumbnail": item.get("thumbnail"),
                "source": item.get("source") or item.get("store")
            })
        print(f"[SerpAPI] Returning {len(items)} processed items")
        return items
    except Exception as e:
        print(f"[SerpAPI] SerpAPI shopping search failed for '{query}': {e}")
        print(f"[SerpAPI] Exception type: {type(e)}")
        return [{"title": "Search failed", "link": "", "price": "N/A", "thumbnail": "", "source": ""}]

def get_google_shopping_light_results(query: str, num_results: int = 10):
    """
    Fetch shopping results from SerpAPI Google Shopping Light using a text query.
    This is faster than regular Google Shopping and provides essential product data.
    Returns a list of items with title, link, price, thumbnail, and source/shop name.
    """
    print(f"[SerpAPI] Starting Google Shopping Light search for query: '{query}' with {num_results} results")
    params = {
        "engine": "google_shopping_light",
        "q": query,
        "api_key": SERP_API_KEY,
        "hl": "en",
        "gl": "us",
        "num": num_results
    }
    print(f"[SerpAPI] API Key present: {'Yes' if SERP_API_KEY else 'No'}")
    try:
        print(f"[SerpAPI] Making request to SerpAPI Google Shopping Light with params: {params}")
        search = GoogleSearch(params)
        results = search.get_dict()
        print(f"[SerpAPI] Raw response keys: {list(results.keys())}")
        
        # Google Shopping Light returns results in different fields
        shopping_results = results.get("inline_shopping_results", [])[:num_results]
        if not shopping_results:
            shopping_results = results.get("shopping_results", [])[:num_results]
        
        print(f"[SerpAPI] Found {len(shopping_results)} Google Shopping Light results")
        items = []
        for item in shopping_results:
            items.append({
                "title": item.get("title"),
                "link": item.get("link") or item.get("tracking_link"),
                "price": item.get("price"),
                "thumbnail": item.get("thumbnail"),
                "source": item.get("source"),
                "rating": item.get("rating"),
                "reviews": item.get("reviews"),
                "extracted_price": item.get("extracted_price")
            })
        print(f"[SerpAPI] Returning {len(items)} processed Google Shopping Light items")
        return items
    except Exception as e:
        print(f"[SerpAPI] SerpAPI Google Shopping Light search failed for '{query}': {e}")
        print(f"[SerpAPI] Exception type: {type(e)}")
        return [{"title": "Search failed", "link": "", "price": "N/A", "thumbnail": "", "source": ""}]