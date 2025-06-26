"use client";

import { useEffect, useState } from "react";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { trackInteraction } from "@/lib/api";
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
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const RESULTS_PER_PAGE = 20;

  // Intersection Observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && !searching && searchQueries.length > 0) {
      setCurrentPage(prev => prev + 1);
    }
  }, [inView, searching, searchQueries]);

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
      } catch (err: any) {
        console.error("Error fetching search queries:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchQueries();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQueries.length === 0 || searching) return;

      setSearching(true);
      setError(null);

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY;
      const cx = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_CX;

      if (!apiKey || !cx) {
        setError("Google Custom Search API key or CX is not configured.");
        setSearching(false);
        return;
      }

      try {
        const query = searchQueries[0];
        const startIndex = currentPage * RESULTS_PER_PAGE + 1;

        const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&start=${startIndex}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `Error fetching search results: ${response.status}`);
        }

        const data = await response.json();
        setSearchResults(prevResults => [...prevResults, ...(data.items || [])]);
      } catch (err: any) {
        console.error("Error fetching search results:", err);
        setError(err.message);
      } finally {
        setSearching(false);
      }
    };

    performSearch();
  }, [searchQueries, currentPage]);

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
      await trackInteraction("like", user.id, { link: itemId });
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
      await trackInteraction("wishlist", user.id, { link: itemId });
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
      {searchResults.length > 0 ? (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {searchResults.map((item, index) => (
            <motion.div
              key={item.link}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="break-inside-avoid relative group"
            >
              <div className="relative rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                {item.pagemap?.cse_image?.[0]?.src && (
                  <div className="relative aspect-[3/4]">
                    <img
                      src={item.pagemap.cse_image[0].src}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleLike(item.link)}
                          className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              likedItems.has(item.link)
                                ? "text-meta-pink fill-meta-pink"
                                : "text-gray-600"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleSave(item.link)}
                          className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
                        >
                          <Bookmark
                            className={`h-5 w-5 ${
                              savedItems.has(item.link)
                                ? "text-meta-pink fill-meta-pink"
                                : "text-gray-600"
                            }`}
                          />
                        </button>
                        <button className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors">
                          <Share2 className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{item.snippet}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">No recommendations yet</h2>
          <p className="text-gray-600">Complete the style quiz to get personalized fashion inspiration.</p>
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-10 mt-4">
        {searching && (
          <div className="text-center">
            <p className="text-gray-500">Loading more inspiration...</p>
          </div>
        )}
      </div>
    </div>
  );
} 