"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Image from "next/image"
import { Heart, ExternalLink, Tag } from "lucide-react"

interface ClothingItem {
  title: string
  thumbnail: string
  price: string
  link: string
}

interface Component {
  name: string
  dominant_color: string
  clothing_items: ClothingItem[]
}

interface ComponentTabsProps {
  components: Component[]
}

export default function ComponentTabs({ components }: ComponentTabsProps) {
  const uniqueComponents = useMemo(() => {
    const uniqueNames = new Set<string>()
    return components.filter((component) => {
      if (uniqueNames.has(component.name)) {
        return false
      }
      uniqueNames.add(component.name)
      return true
    })
  }, [components])

  const [activeTab, setActiveTab] = useState(uniqueComponents[0]?.name || "")
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const tabsRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: "0px",
    width: "0px",
  })

  const toggleLike = (itemId: string) => {
    const newLikedItems = new Set(likedItems)
    if (newLikedItems.has(itemId)) {
      newLikedItems.delete(itemId)
    } else {
      newLikedItems.add(itemId)
    }
    setLikedItems(newLikedItems)
  }

  useEffect(() => {
    if (tabsRef.current) {
      const activeTabElement = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`)
      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement as HTMLElement
        setIndicatorStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        })
      }
    }
  }, [activeTab])

  return (
    <div className="meta-card animate-fade-in">
      <div className="relative border-b border-gray-200">
        <div className="flex overflow-x-auto scrollbar-hide" ref={tabsRef}>
          {uniqueComponents.map((component) => (
            <button
              key={component.name}
              data-tab={component.name}
              onClick={() => setActiveTab(component.name)}
              className={`px-4 py-3 font-medium text-center whitespace-nowrap transition-colors ${
                activeTab === component.name ? "text-meta-pink" : "text-meta-text-secondary"
              }`}
            >
              {component.name}
            </button>
          ))}
        </div>
        <div
          className="absolute bottom-0 h-0.5 bg-meta-pink transition-all duration-300 ease-in-out"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        ></div>
      </div>

      <div className="p-4">
        {uniqueComponents.map(
          (component) =>
            activeTab === component.name && (
              <div key={component.name} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {components
                  .filter((comp) => comp.name === component.name)
                  .flatMap((comp, compIndex) =>
                    comp.clothing_items.map((item, itemIndex) => {
                      const itemId = `${compIndex}-${itemIndex}-${item.title}`
                      const isLiked = likedItems.has(itemId)

                      return (
                        <div
                          key={itemId}
                          className="bg-white rounded-meta shadow-sm overflow-hidden border border-gray-100 hover:shadow-meta-hover transition-all duration-200"
                        >
                          <div className="relative aspect-square">
                            <Image
                              src={item.thumbnail || "/placeholder.svg"}
                              alt={item.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              style={{ objectFit: "cover" }}
                              className="rounded-t-sm"
                            />
                            <button
                              onClick={() => toggleLike(itemId)}
                              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
                              aria-label={isLiked ? "Unlike" : "Like"}
                            >
                              <Heart
                                className={`h-4 w-4 transition-colors ${isLiked ? "text-meta-pink fill-meta-pink" : "text-gray-600"}`}
                              />
                            </button>
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-xs truncate" title={item.title}>
                              {item.title}
                            </h4>
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center">
                                <Tag className="h-3 w-3 text-meta-pink mr-1" />
                                <span className="text-meta-pink font-semibold text-sm">{item.price}</span>
                              </div>
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                aria-label="View product"
                              >
                                <ExternalLink className="h-3 w-3 text-gray-600" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )
                    }),
                  )}
              </div>
            ),
        )}
      </div>
    </div>
  )
}
