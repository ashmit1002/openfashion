'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles, ShoppingBag, Heart, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchLimit } from '@/contexts/SearchLimitContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface SearchResult {
  title: string;
  link: string;
  price: string;
  thumbnail: string;
  source: string;
  rating?: string;
  reviews?: string;
  extracted_price?: string;
}

interface SearchResponse {
  original_query: string;
  optimized_query: string;
  results: SearchResult[];
  total_results: number;
  search_limit: {
    limit: number;
    used: number;
    remaining: number;
    subscription: string;
  };
}

interface SearchSuggestion {
  suggestions: string[];
  search_limit: {
    limit: number;
    used: number;
    remaining: number;
    subscription: string;
  };
}

export default function FashionSearchPage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [originalQuery, setOriginalQuery] = useState('');
  const [optimizedQuery, setOptimizedQuery] = useState('');
  const { user } = useAuth();
  const { searchLimit, updateSearchLimit } = useSearchLimit();
  const { toast } = useToast();

  // Load search suggestions on component mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
              const response = await api.get('/fashion/fashion-search/suggestions');
      setSuggestions(response.data.suggestions || []);
      updateSearchLimit(response.data.search_limit);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    };

    if (user) {
      loadSuggestions();
    }
  }, [user?.username, updateSearchLimit]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setOriginalQuery(searchQuery);
    
    try {
      const response = await api.post('/fashion/fashion-search', null, {
        params: {
          query: searchQuery,
          num_results: 15
        }
      });

      const data: SearchResponse = response.data;
      setSearchResults(data.results || []);
      setOptimizedQuery(data.optimized_query);
      updateSearchLimit(data.search_limit);
      
      toast({
        title: "Search completed!",
        description: `Found ${data.total_results} results for "${data.original_query}"`,
      });

    } catch (error: any) {
      console.error('Search failed:', error);
      toast({
        title: "Search failed",
        description: error.response?.data?.detail || "Failed to perform search",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Function to refresh search limit
  const refreshSearchLimit = async () => {
    try {
      const response = await api.get('/fashion/fashion-search/limit');
      updateSearchLimit(response.data);
      
      // Trigger a custom event to notify other components
      console.log('Dispatching searchLimitUpdated event:', response.data);
      window.dispatchEvent(new CustomEvent('searchLimitUpdated', { 
        detail: response.data 
      }));
    } catch (error) {
      console.error('Failed to refresh search limit:', error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  // Refresh search limit when component mounts and after searches
  useEffect(() => {
    if (user) {
      refreshSearchLimit();
    }
  }, [user?.username, updateSearchLimit]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSaveToWishlist = async (item: SearchResult) => {
    try {
      await api.post('/wishlist/add', {
        title: item.title,
        link: item.link,
        price: item.price,
        image_url: item.thumbnail,
        source: item.source
      });
      
      toast({
        title: "Added to wishlist!",
        description: "Item has been saved to your wishlist",
      });
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: error.response?.data?.detail || "Could not add to wishlist",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (item: SearchResult) => {
    try {
      await navigator.share({
        title: item.title,
        text: `Check out this ${item.title} - ${item.price}`,
        url: item.link,
      });
    } catch (error) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(item.link);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to use Fashion Search</h1>
          <p className="text-gray-600">This feature requires authentication.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-meta-pink rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fashion Search</h1>
              <p className="text-gray-600">Search for fashion items using natural language</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Try: 'summer dresses', 'streetwear hoodies', 'vintage denim'..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-4 py-3 text-lg border-2 focus:border-pink-500 focus:ring-pink-500"
              />
              <Button
                onClick={() => handleSearch()}
                disabled={isSearching || !query.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-meta-pink hover:bg-pink-600"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Search Info */}
          {originalQuery && (
            <div className="mt-4 text-sm text-gray-600">
              <p>
                <span className="font-medium">Original query:</span> "{originalQuery}"
              </p>
              {optimizedQuery && optimizedQuery !== originalQuery && (
                <p>
                  <span className="font-medium">Optimized query:</span> "{optimizedQuery}"
                </p>
              )}
            </div>
          )}

          {/* Search Limit Info */}
          {searchLimit && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">Search Limit:</span>
                  {searchLimit.subscription === 'premium' ? (
                    <span className="text-green-600 ml-2">Unlimited (Premium)</span>
                  ) : (
                    <span className="text-gray-600 ml-2">
                      {searchLimit.used}/{searchLimit.limit} searches used this week
                    </span>
                  )}
                </div>
                                  {searchLimit.subscription === 'basic' && (
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-meta-pink h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(searchLimit.used / searchLimit.limit) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {searchLimit.remaining} remaining this week
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Suggestions */}
        {suggestions.length > 0 && searchResults.length === 0 && !isSearching && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Try these searches:</h2>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-sm hover:bg-pink-50 hover:border-meta-pink text-meta-pink border-meta-pink"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for fashion items...</p>
          </div>
        )}

        {/* Results */}
        {searchResults.length > 0 && !isSearching && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Found {searchResults.length} items
              </h2>
              <Badge variant="secondary" className="text-sm">
                Powered by AI
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((item, index) => (
                <Card key={index} className="group hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-4">
                    {/* Image */}
                    <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-image.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag className="w-12 h-12" />
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSaveToWishlist(item)}
                          className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-meta-pink hover:text-pink-600"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleShare(item)}
                          className="w-8 h-8 p-0 bg-white/90 hover:bg-white text-meta-pink hover:text-pink-600"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">
                        {item.title}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg text-gray-900">
                          {item.price || 'Price not available'}
                        </span>
                        {item.rating && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm text-gray-600">{item.rating}</span>
                          </div>
                        )}
                      </div>

                      {item.source && (
                        <p className="text-xs text-gray-500 truncate">
                          {item.source}
                        </p>
                      )}

                      <Button
                        onClick={() => window.open(item.link, '_blank')}
                        className="w-full bg-meta-pink hover:bg-pink-600"
                        size="sm"
                      >
                        View Product
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchResults.length === 0 && !isSearching && originalQuery && (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or browse our suggestions above.
            </p>
            <Button
              onClick={() => setQuery('')}
              variant="outline"
              className="border-meta-pink text-meta-pink hover:bg-pink-50 hover:border-pink-600"
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 