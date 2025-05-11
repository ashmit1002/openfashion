"use client"

import Image from "next/image"
import { Share2, Download, Heart } from "lucide-react"
import { useState } from "react"

interface AnalyzedImageProps {
  imageData: string
}

export default function AnalyzedImage({ imageData }: AnalyzedImageProps) {
  const [liked, setLiked] = useState(false)

  return (
    <div className="meta-card animate-fade-in">
      <div className="relative">
        <div className="relative aspect-square w-full overflow-hidden">
          <Image
            src={`data:image/jpeg;base64,${imageData}`}
            alt="Analyzed Image"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "contain" }}
            priority
            className="rounded-t-meta"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Analyzed Outfit</h2>
          <div className="flex space-x-2">
            <button className="meta-icon-button" onClick={() => setLiked(!liked)} aria-label="Like">
              <Heart
                className={`h-5 w-5 transition-colors ${liked ? "text-meta-pink fill-meta-pink" : "text-gray-600"}`}
              />
            </button>
            <button className="meta-icon-button" aria-label="Share">
              <Share2 className="h-5 w-5 text-gray-600" />
            </button>
            <button className="meta-icon-button" aria-label="Download">
              <Download className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center">
          <div className="bg-meta-pink/10 px-3 py-1 rounded-full text-xs font-medium text-meta-pink">100% Match</div>
          <span className="text-xs text-meta-text-secondary ml-2">Items detected and matched</span>
        </div>

        <p className="mt-3 text-sm text-meta-text-secondary">
          AI-powered fashion analysis to help you find similar items and styles.
        </p>
      </div>
    </div>
  )
}
