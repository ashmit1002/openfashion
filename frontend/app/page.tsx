'use client'

import { useState } from 'react'
import ImageUploader from '../components/ui/ImageUploader'
import AnalyzedImage from '../components/ui/AnalyzedImage'
import ComponentTabs from '../components/ui/ComponentsTab'
import { MasonryGrid } from '@/components/ui/MasonryGrid'
import { SearchBar } from '@/components/ui/SearchBar'
import { motion } from 'framer-motion'

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

interface AnalysisResult {
  annotated_image_base64: string
  components: Component[]
}

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isUploaderOpen, setIsUploaderOpen] = useState(false)

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result)
    setIsUploaderOpen(false)
  }

  // Transform components into items for MasonryGrid
  const gridItems = analysisResult?.components.flatMap((component) =>
    component.clothing_items.map((item, index) => ({
      id: `${component.name}-${index}`,
      image: item.thumbnail,
      title: item.title,
      price: item.price,
      link: item.link,
      category: component.name,
    }))
  ) || []

  return (
    <main className="min-h-screen bg-white">
      <SearchBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Your Style
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Upload an image to find similar fashion items
          </p>
          <button
            onClick={() => setIsUploaderOpen(true)}
            className="bg-meta-pink hover:bg-meta-pink/90 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Upload Image
          </button>
        </motion.div>

        {isUploaderOpen && (
          <div className="mb-12">
            <ImageUploader onAnalysisComplete={handleAnalysisComplete} />
          </div>
        )}

        {analysisResult && (
          <div className="space-y-12">
            <div className="bg-gray-50 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold mb-6">Analysis Results</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="lg:sticky lg:top-8">
                  <AnalyzedImage imageData={analysisResult.annotated_image_base64} />
                </div>
                <ComponentTabs components={analysisResult.components} />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-6">Similar Items</h2>
              <MasonryGrid items={gridItems} />
            </div>
          </div>
        )}


      </div>
    </main>
  )
}

