"use client"

import Image from "next/image"
import { ExternalLink, Heart, MessageCircle, Send, Bookmark } from "lucide-react"
import { useState } from "react"

interface ClothingItem {
  thumbnail: string
  price: string
  link: string
}

interface Component {
  name: string
  dominant_color: string
  clothing_items: ClothingItem[]
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
              onClick={() => setLiked(!liked)}
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
          </div>
        ))}
      </div>
    </div>
  )
}
