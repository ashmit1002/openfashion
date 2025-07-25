# Fashion Search API Documentation

## Overview
The Fashion Search feature allows users to search for fashion items using natural language queries. The system uses GPT to convert user queries into optimized Google Shopping search terms and returns relevant product results.

## Endpoints

### 1. Fashion Search
**POST** `/api/fashion/fashion-search`

Converts a natural language fashion query into an optimized search query and returns shopping results.

#### Parameters
- `query` (string, required): Natural language fashion search query
- `num_results` (integer, optional): Number of results to return (1-20, default: 10)

#### Headers
- `Authorization: Bearer <token>` (required)

#### Example Request
```bash
curl -X POST "http://localhost:8000/api/fashion/fashion-search" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "summer dresses",
    "num_results": 15
  }'
```

#### Example Response
```json
{
  "original_query": "summer dresses",
  "optimized_query": "women's summer dress",
  "results": [
    {
      "title": "Floral Summer Dress",
      "link": "https://example.com/product/123",
      "price": "$45.99",
      "thumbnail": "https://example.com/image.jpg",
      "source": "Fashion Store",
      "rating": "4.5",
      "reviews": "128",
      "extracted_price": "45.99"
    }
  ],
  "total_results": 15
}
```

### 2. Search Suggestions
**GET** `/api/fashion/fashion-search/suggestions`

Returns personalized fashion search suggestions based on the user's style profile.

#### Headers
- `Authorization: Bearer <token>` (required)

#### Example Request
```bash
curl -X GET "http://localhost:8000/api/fashion/fashion-search/suggestions" \
  -H "Authorization: Bearer <your-token>"
```

#### Example Response
```json
{
  "suggestions": [
    "summer dresses",
    "streetwear hoodies",
    "vintage denim",
    "formal shoes",
    "casual sneakers",
    "oversized sweaters",
    "minimalist tops",
    "pastel colored clothing"
  ]
}
```

## Features

### 1. Natural Language Processing
- Converts user-friendly queries into optimized search terms
- Examples:
  - "I want a summer dress" → "women's summer dress"
  - "Show me streetwear hoodies" → "streetwear hoodie men"
  - "Pastel colored tops" → "pastel tops women"

### 2. Personalization
- Uses user's style profile to generate personalized suggestions
- Considers style preferences, color preferences, and fashion taste
- Adapts search results based on user's fashion history

### 3. Premium Feature
- Fashion Search is available only to premium users
- Returns 403 error for non-premium users

### 4. Error Handling
- Graceful fallback if GPT optimization fails
- Returns original query if optimization is unsuccessful
- Comprehensive error messages for debugging

## Frontend Integration

The frontend provides:
- Natural language search input
- Real-time search suggestions
- Product grid display with images, prices, and ratings
- Save to wishlist functionality
- Share product links
- Responsive design for mobile and desktop

## Usage Examples

### Basic Search
```
User Input: "summer dresses"
Optimized Query: "women's summer dress"
```

### Style-Specific Search
```
User Input: "streetwear hoodies for men"
Optimized Query: "streetwear hoodie men"
```

### Color-Specific Search
```
User Input: "pastel colored tops"
Optimized Query: "pastel tops women"
```

### Material-Specific Search
```
User Input: "vintage denim jacket"
Optimized Query: "vintage denim jacket"
```

## Technical Implementation

### Backend
- FastAPI route with async/await support
- OpenAI GPT-4 integration for query optimization
- SerpAPI Google Shopping Light integration
- MongoDB for user style profiles
- JWT authentication and premium user validation

### Frontend
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- React hooks for state management
- Axios for API communication
- Responsive grid layout
- Toast notifications for user feedback 