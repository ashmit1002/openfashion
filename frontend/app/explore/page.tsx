"use client";

import { useEffect, useState } from "react";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { trackInteraction, fetchSerpApiShoppingResults } from "@/lib/api";
// We will add more imports later as needed, e.g., for displaying search results

// Define interfaces for Google Custom Search API response
interface SearchItem {
  title: string;
  htmlTitle: string;
  link: string;
  displayLink: string;
  snippet: string;
  htmlSnippet: string;
  cacheId?: string;
  formattedUrl: string;
  htmlFormattedUrl: string;
  // Add more fields if needed, e.g., for images
  pagemap?: { // Pagemap often contains image URLs and other structured data
    cse_thumbnail?: Array<{ src: string; width: string; height: string; }>;
    cse_image?: Array<{ src: string; }>;
    [key: string]: any; // Allow other properties
  };
}

interface SearchResponse {
  kind: string;
  url: any;
  queries: any;
  context: any;
  searchInformation: any;
  items?: SearchItem[];
}

interface SearchQueriesResponse {
  search_queries: string[];
}

export default function ExplorePage() {
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [groupedResults, setGroupedResults] = useState<{ [query: string]: SearchItem[] }>({});
  const [pageByQuery, setPageByQuery] = useState<{ [query: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const RESULTS_PER_PAGE = 10;
  const [shoppingResults, setShoppingResults] = useState<{ [query: string]: any[] }>({});
  const [shoppingLoading, setShoppingLoading] = useState(false);

  // Infinite scroll observer
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, triggerOnce: false });

  useEffect(() => {
    const fetchSearchQueries = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Authentication token not found. Please log in.");
          setLoading(false);
          return;
        }
        const response = await fetch("/api/style/generate-search-queries", {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Error fetching search queries: ${response.status}`);
        }
        const data: SearchQueriesResponse = await response.json();
        setSearchQueries(data.search_queries);
        // Initialize page for each query
        const initialPages: { [query: string]: number } = {};
        data.search_queries.forEach(q => { initialPages[q] = 1; });
        setPageByQuery(initialPages);
      } catch (err: any) {
        console.error("Error fetching search queries:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSearchQueries();
  }, []);

  // Fetch results for all queries (first page or when queries change)
  useEffect(() => {
    const fetchAllResults = async () => {
      if (searchQueries.length === 0) return;
      setLoading(true);
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY;
      const cx = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_CX;
      if (!apiKey || !cx) {
        setError("Google Custom Search API key or CX is not configured.");
        setLoading(false);
        return;
      }
      const results: { [query: string]: SearchItem[] } = {};
      for (const query of searchQueries) {
        try {
          const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&start=1`;
          const response = await fetch(apiUrl);
          if (!response.ok) {
            results[query] = [];
            continue;
          }
          const data = await response.json();
          results[query] = data.items || [];
        } catch (err) {
          results[query] = [];
        }
      }
      setGroupedResults(results);
      setLoading(false);
    };
    fetchAllResults();
  }, [searchQueries]);

  // Infinite scroll: fetch more results for each query when inView
  useEffect(() => {
    if (!inView || loading || searchQueries.length === 0) return;
    const fetchMore = async () => {
      setLoadingMore(true);
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY;
      const cx = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_CX;
      if (!apiKey || !cx) {
        setError("Google Custom Search API key or CX is not configured.");
        setLoadingMore(false);
        return;
      }
      const newResults = { ...groupedResults };
      const newPages = { ...pageByQuery };
      for (const query of searchQueries) {
        const nextPage = (pageByQuery[query] || 1) + 1;
        const startIndex = (nextPage - 1) * RESULTS_PER_PAGE + 1;
        try {
          const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&start=${startIndex}`;
          const response = await fetch(apiUrl);
          if (!response.ok) continue;
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            newResults[query] = [...(newResults[query] || []), ...data.items];
            newPages[query] = nextPage;
          }
        } catch (err) {
          // ignore
        }
      }
      setGroupedResults(newResults);
      setPageByQuery(newPages);
      setLoadingMore(false);
    };
    fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  useEffect(() => {
    // Fetch shopping results from SerpAPI for each query
    const fetchShopping = async () => {
      if (searchQueries.length === 0) return;
      setShoppingLoading(true);
      const results: { [query: string]: any[] } = {};
      console.log('[SerpAPI] Starting fetch for shopping results', searchQueries);
      await Promise.all(
        searchQueries.map(async (query) => {
          try {
            console.log(`[SerpAPI] Fetching shopping results for query: ${query}`);
            results[query] = await fetchSerpApiShoppingResults(query);
            console.log(`[SerpAPI] Results for "${query}":`, results[query]);
          } catch (err) {
            console.error(`[SerpAPI] Error fetching results for "${query}":`, err);
            results[query] = [];
          }
        })
      );
      setShoppingResults(results);
      setShoppingLoading(false);
      console.log('[SerpAPI] Final shoppingResults state:', results);
    };
    fetchShopping();
  }, [searchQueries]);

  const handleLike = async (itemId: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
    if (user) {
      await trackInteraction("like", user.email, { link: itemId });
    }
  };

  const handleSave = async (itemId: string) => {
    setSavedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
    if (user) {
      await trackInteraction("wishlist", user.email, { link: itemId });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Discovering your style...</h2>
          <p className="mt-2 text-gray-600">We're finding the perfect fashion inspiration for you.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-semibold">Error loading recommendations</h2>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Explore Styles</h1>
      {Object.entries(groupedResults).map(([query, items]) => (
        <div key={query} className="mb-10">
          <h2 className="text-xl font-semibold mb-2">{query}</h2>
          {/* Google Shopping Results */}
          {shoppingLoading ? (
            <div className="mb-4 text-gray-500">Loading top products from Google Shopping...</div>
          ) : shoppingResults[query] && shoppingResults[query].length > 0 ? (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Top Products from Google Shopping</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shoppingResults[query]
                  .filter((product: any) => product.title || product.link)
                  .map((product: any, idx: number) => (
                    <a
                      key={product.link || product.title || idx}
                      href={product.link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded shadow p-4 block hover:shadow-lg transition-shadow border border-yellow-200"
                    >
                      {product.thumbnail && (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-full h-48 object-cover mb-2 rounded"
                        />
                      )}
                      <h4 className="font-medium text-base mb-1 line-clamp-2">{product.title}</h4>
                      <div className="text-sm font-semibold text-green-700 mb-1">{product.price}</div>
                      <div className="text-xs text-gray-500 mb-2">{product.source}</div>
                    </a>
                  ))}
              </div>
            </div>
          ) : null}
          {/* Web Results */}
          {items.length === 0 ? (
            <p className="text-gray-500">No products found for this search.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(item => (
                <a
                  key={item.link}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded shadow p-4 block hover:shadow-lg transition-shadow"
                >
                  {item.pagemap?.cse_image?.[0]?.src && (
                    <img
                      src={item.pagemap.cse_image[0].src}
                      alt={item.title}
                      className="w-full h-48 object-cover mb-2 rounded"
                    />
                  )}
                  <h3 className="font-medium text-base mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.snippet}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={e => { e.preventDefault(); handleLike(item.link); }}
                      className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                      <Heart className={`h-5 w-5 ${likedItems.has(item.link) ? "text-meta-pink fill-meta-pink" : "text-gray-600"}`} />
                    </button>
                    <button
                      onClick={e => { e.preventDefault(); handleSave(item.link); }}
                      className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                      <Bookmark className={`h-5 w-5 ${savedItems.has(item.link) ? "text-meta-pink fill-meta-pink" : "text-gray-600"}`} />
                    </button>
                    <button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
                      <Share2 className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-10 mt-4">
        {loadingMore && (
          <div className="text-center">
            <p className="text-gray-500">Loading more inspiration...</p>
          </div>
        )}
      </div>
    </div>
  );
} 