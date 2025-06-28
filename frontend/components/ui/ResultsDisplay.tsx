"use client"

import Image from "next/image"
import { ExternalLink, Heart, MessageCircle, Send, Bookmark } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import api, { setAuthToken, trackInteraction, fetchSerpApiShoppingResults } from "@/lib/api"

interface ClothingItem {
  thumbnail: string
  price: string
  link: string
  title?: string
  category?: string
}

interface Component {
  name: string
  dominant_color: string
  clothing_items: ClothingItem[]
  similar_items?: any[]
  similar_queries?: string[]
}

interface ResultsData {
  annotated_image_base64: string
  components: Component[]
}

interface ResultsDisplayProps {
  results: ResultsData | null
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const { user } = useAuth()
  const [similarItemsByComponent, setSimilarItemsByComponent] = useState<{ [idx: number]: any[][] }>({})
  const [loadingSimilar, setLoadingSimilar] = useState<{ [idx: number]: boolean }>({})

  useEffect(() => {
    // Check if item is in wishlist on component mount
    console.log('Component mounted, user:', user)
    checkWishlistStatus()
  }, [user])

  useEffect(() => {
    if (!results) return;
    // For each component, fetch shopping results for each similar query
    console.log('[SerpAPI] Starting fetch for similar items', results.components);
    console.log('[SerpAPI] Full results data:', results);
    
    results.components.forEach((component, idx) => {
      console.log(`[SerpAPI] Component ${idx} "${component.name}":`, component);
      console.log(`[SerpAPI] Component ${idx} similar_queries:`, component.similar_queries);
      
      if (!component.similar_queries || component.similar_queries.length === 0) {
        console.log(`[SerpAPI] No similar queries for component "${component.name}"`);
        return;
      }
      console.log(`[SerpAPI] Fetching similar items for component "${component.name}" with queries:`, component.similar_queries);
      setLoadingSimilar(prev => ({ ...prev, [idx]: true }))
      Promise.all(
        component.similar_queries.map(async (query: string) => {
          try {
            console.log(`[SerpAPI] Fetching shopping results for query: ${query}`);
            const results = await fetchSerpApiShoppingResults(query, 4);
            console.log(`[SerpAPI] Results for "${query}":`, results);
            console.log(`[SerpAPI] Number of results for "${query}":`, results.length);
            return results;
          } catch (err: any) {
            console.error(`[SerpAPI] Error fetching results for "${query}":`, err);
            console.error(`[SerpAPI] Error details:`, err.response?.data || err.message);
            return [];
          }
        })
      ).then((allResults) => {
        console.log(`[SerpAPI] All results for component "${component.name}":`, allResults);
        console.log(`[SerpAPI] Total result arrays for component "${component.name}":`, allResults.length);
        console.log(`[SerpAPI] Non-empty result arrays:`, allResults.filter(arr => arr.length > 0).length);
        setSimilarItemsByComponent(prev => ({ ...prev, [idx]: allResults }))
        setLoadingSimilar(prev => ({ ...prev, [idx]: false }))
      }).catch((error) => {
        console.error(`[SerpAPI] Error in Promise.all for component "${component.name}":`, error);
        setLoadingSimilar(prev => ({ ...prev, [idx]: false }))
      })
    })
  }, [results])

  const checkWishlistStatus = async () => {
    console.log('Checking wishlist status, user:', user)
    if (!user) return
    
    try {
      const token = localStorage.getItem('token')
      console.log('Token:', token)
      if (token) setAuthToken(token)
      const response = await api.get('/api/wishlist/')
      const data = response.data
      setLiked(data.some((wishlistItem: any) => wishlistItem.link === window.location.href))
    } catch (error) {
      console.error('Error checking wishlist status:', error)
    }
  }

  const handleLike = async () => {
    console.log('Like button clicked, user:', user)
    if (!user) {
      console.log('No user found, showing error toast')
      toast.error('Please login to save items to your wishlist')
      return
    }

    try {
      const token = localStorage.getItem('token')
      console.log('Token for like action:', token)
      if (token) setAuthToken(token)

      const item = {
        title: "Analyzed Outfit",
        category: "Fashion Analysis",
        price: 0,
        link: window.location.href,
        thumbnail: `data:image/jpeg;base64,${results?.annotated_image_base64}`,
        tags: results?.components.map(c => c.name) || []
      }

      console.log('Attempting to', liked ? 'remove from' : 'add to', 'wishlist')
      if (!liked) {
        const response = await api.post('/api/wishlist/add', {
          ...item,
          user_id: user.id,
          source: 'Analysis Result'
        })
        console.log('Add to wishlist response:', response)
        toast.success('Added to wishlist', {
          style: {
            backgroundColor: '#4ade80',
            color: 'white',
          },
        })
      } else {
        // Find the item ID first
        const response = await api.get('/api/wishlist/')
        const items = response.data
        const wishlistItem = items.find((i: any) => i.link === item.link)
        
        if (wishlistItem) {
          const deleteResponse = await api.delete(`/api/wishlist/${wishlistItem._id}`)
          console.log('Delete from wishlist response:', deleteResponse)
          toast.success('Removed from wishlist')
        }
      }
      setLiked(!liked)
      await trackInteraction('wishlist', user.email, { link: item.link })
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      toast.error('Failed to update wishlist')
    }
  }

  if (!results) {
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="meta-card">
        {/* Instagram-like header */}
        <div className="flex items-center p-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-meta-pink to-yellow-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-meta-pink">SL</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="font-semibold text-sm">stylelens</p>
            <p className="text-xs text-meta-text-secondary">Fashion Analyzer</p>
          </div>
        </div>

        {/* Image container */}
        <div className="relative border-y border-gray-100">
          <Image
            src={`data:image/jpeg;base64,${results.annotated_image_base64}`}
            alt="Annotated Image"
            width={800}
            height={600}
            className="w-full h-auto"
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center p-4">
          <div className="flex space-x-4">
            <button
              className="meta-icon-button"
              onClick={handleLike}
              aria-label={liked ? "Unlike" : "Like"}
            >
              <Heart
                className={`h-6 w-6 transition-colors ${liked ? "text-meta-pink fill-meta-pink" : "text-meta-dark"}`}
              />
            </button>
            <button className="meta-icon-button" aria-label="Comment">
              <MessageCircle className="h-6 w-6 text-meta-dark" />
            </button>
            <button className="meta-icon-button" aria-label="Share">
              <Send className="h-6 w-6 text-meta-dark" />
            </button>
          </div>
          <button className="meta-icon-button" onClick={() => setSaved(!saved)} aria-label={saved ? "Unsave" : "Save"}>
            <Bookmark
              className={`h-6 w-6 transition-colors ${saved ? "text-meta-pink fill-meta-pink" : "text-meta-dark"}`}
            />
          </button>
        </div>

        <div className="px-4 pb-4">
          <p className="text-sm font-semibold">Analyzed Outfit</p>
          <p className="text-sm text-meta-text-secondary mt-1">
            AI-powered fashion analysis to help you find similar items and styles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.components.map((component, index) => (
          <div key={index} className="meta-card">
            <div className="flex items-center p-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: component.dominant_color || "#D90166" }}
              >
                <span className="text-xs font-bold text-white">{component.name.charAt(0)}</span>
              </div>
              <div className="ml-3">
                <p className="font-semibold text-sm">{component.name}</p>
                <p className="text-xs text-meta-text-secondary">{component.dominant_color}</p>
              </div>
            </div>

            {component.clothing_items[0] && (
              <div className="p-4 pt-0">
                <div className="flex items-start space-x-4">
                  <div className="relative w-24 h-24 rounded-meta overflow-hidden flex-shrink-0 border border-gray-200">
                    <Image
                      src={component.clothing_items[0].thumbnail || "/placeholder.svg"}
                      alt={component.name}
                      fill
                      sizes="96px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-meta-text-primary">{component.clothing_items[0].price}</p>
                    <a
                      href={component.clothing_items[0].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-meta-pink text-sm mt-2 hover:underline"
                    >
                      Shop Now <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
            {/* Similar Items Section */}
            {component.similar_queries && component.similar_queries.length > 0 && (
              <div className="p-4 pt-0">
                <h4 className="font-semibold text-sm mb-2">Similar Items</h4>
                {loadingSimilar[index] ? (
                  <div className="text-xs text-gray-500 mb-2">Loading similar items...</div>
                ) : similarItemsByComponent[index] && similarItemsByComponent[index].length > 0 ? (
                  <div className="space-y-3">
                    {component.similar_queries.map((query: string, qIdx: number) => (
                      <div key={query}>
                        <div className="text-xs font-semibold text-gray-700 mb-1">{query}</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {similarItemsByComponent[index][qIdx]?.map((item: any, idx2: number) => (
                            <a
                              key={item.link || item.title || idx2}
                              href={item.link || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block bg-gray-50 rounded border border-gray-200 p-2 hover:shadow"
                            >
                              {item.thumbnail && (
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-full h-24 object-cover rounded mb-1"
                                />
                              )}
                              <div className="text-xs font-medium line-clamp-2 mb-1">{item.title}</div>
                              <div className="text-xs text-green-700">{item.price}</div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No similar items found.</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
