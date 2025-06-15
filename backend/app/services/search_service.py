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