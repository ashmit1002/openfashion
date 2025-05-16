from serpapi import GoogleSearch
from urllib.parse import quote

SERP_API_KEY = "0ecd3e27d770b554710a9dfe9f59c71b76247389b215effcffc08d91f251cf35"

def get_clothing_from_google_search(image_url: str, category_hint: str = "", color: str = ""):
    """
    Uses Google Lens search via SerpAPI to find clothing items similar to the image.
    Optionally adds a category and color hint to improve accuracy.
    """
    search_term = f"{color} {category_hint}".strip()
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