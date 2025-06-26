"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Image from "next/image"
import { Heart, ExternalLink, Tag } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import api, { setAuthToken } from "@/lib/api"

interface ClothingItem {
  title: string
  thumbnail: string
  price: string
  link: string
}

interface Component {
  name: string
  original_image_url: string
  bg_removed_url: string
  dominant_color: string
  clothing_items: ClothingItem[]
}

interface ComponentsTabProps {
  components: Component[]
}

export default function ComponentTabs({ components }: ComponentsTabProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  const handleLike = async (item: ClothingItem) => {
    if (!user) {
      toast.error("Please log in to save items")
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      toast.error("Please log in to save items")
      return
    }
    setAuthToken(token)

    const itemId = `${item.title}-${item.link}`
    const newLikedItems = new Set(likedItems)
    
    if (likedItems.has(itemId)) {
      newLikedItems.delete(itemId)
    } else {
      newLikedItems.add(itemId)
    }
    
    setLikedItems(newLikedItems)
    
    try {
      if (likedItems.has(itemId)) {
        // Find the item ID first
        const response = await api.get('/wishlist/')
        const items = response.data
        const wishlistItem = items.find((i: any) => i.link === item.link)
        
        if (wishlistItem) {
          await api.delete('/wishlist/delete', {
            params: {
              link: item.link,
              category: components[activeTab].name
            }
          })
          toast.success('Removed from wishlist')
        }
      } else {
        // Create FormData for the request
        const formData = new FormData()
        formData.append('name', item.title)
        formData.append('category', components[activeTab].name)
        formData.append('price', item.price)
        formData.append('link', item.link)
        
        // Convert thumbnail URL to File object
        try {
          const thumbnailResponse = await fetch(item.thumbnail)
          if (!thumbnailResponse.ok) throw new Error('Failed to fetch thumbnail')
          const thumbnailBlob = await thumbnailResponse.blob()
          const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' })
          formData.append('thumbnail', thumbnailFile)

          const response = await fetch('/api/wishlist/add', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          })

          if (!response.ok) {
            throw new Error('Failed to add to wishlist')
          }

          toast.success('Added to wishlist')
        } catch (error) {
          console.error('Error processing thumbnail:', error)
          toast.error('Failed to process image')
          setLikedItems(likedItems)
          return
        }
      }
    } catch (error) {
      console.error("Failed to save item:", error)
      toast.error("Failed to save item")
      // Revert the liked state if the operation failed
      setLikedItems(likedItems)
    }
  }

  return (
    <div className="space-y-6 h-full">
      {/* Tabs - Fixed at top */}
      <div className="flex space-x-2 overflow-x-auto pb-2 sticky top-0 bg-white z-10">
        {components.map((component, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === index
                ? "bg-meta-pink text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {component.name}
          </button>
        ))}
      </div>

      {/* Active Component Content - Scrollable container */}
      {components[activeTab] && (
        <div className="space-y-6 h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {/* Component Preview - Fixed height */}
          <div className="grid grid-cols-2 gap-4 h-[300px]">
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <Image
                src={components[activeTab].original_image_url}
                alt={components[activeTab].name}
                fill
                className="object-cover"
              />
            </div>
            {components[activeTab].bg_removed_url && (
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={components[activeTab].bg_removed_url}
                  alt={`${components[activeTab].name} (no background)`}
                  fill
                  className="object-contain bg-gray-50"
                />
              </div>
            )}
          </div>

          {/* Color Information */}
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-full border border-gray-200"
              style={{ backgroundColor: components[activeTab].dominant_color }}
            />
            <span className="text-sm text-gray-600">
              Dominant Color: {components[activeTab].dominant_color}
            </span>
          </div>

          {/* Similar Items - Scrollable grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Similar Items</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {components[activeTab].clothing_items.map((item, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleLike(item)}
                        className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
                      >
                        <Heart
                          className={`h-5 w-5 ${
                            likedItems.has(`${item.title}-${item.link}`)
                              ? "text-meta-pink fill-meta-pink"
                              : "text-gray-600"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">{item.title}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-meta-pink font-semibold">{item.price}</span>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-meta-pink transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
