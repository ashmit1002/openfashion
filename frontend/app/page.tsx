'use client'

import { useState, useEffect } from 'react'
import ImageUploader from '../components/ui/ImageUploader'
import AnalyzedImage from '../components/ui/AnalyzedImage'
import ComponentTabs from '../components/ui/ComponentsTab'
import { SearchBar } from '@/components/ui/SearchBar'
import { motion } from 'framer-motion'
import { fetchSerpApiShoppingResults } from '@/lib/api'

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
  similar_queries?: string[]
  original_image_url: string
  bg_removed_url: string
}

interface AnalysisResult {
  annotated_image_base64: string
  components: Component[]
}

interface ShoppingResults {
  [query: string]: any[]
}

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isUploaderOpen, setIsUploaderOpen] = useState(false)
  const [shoppingResults, setShoppingResults] = useState<ShoppingResults>({})
  const [shoppingLoading, setShoppingLoading] = useState(false)

  // Check for pending analysis results on page load
  useEffect(() => {
    const pendingResult = localStorage.getItem("pendingAnalysisResult")
    if (pendingResult) {
      try {
        const result = JSON.parse(pendingResult)
        setAnalysisResult(result)
        localStorage.removeItem("pendingAnalysisResult")
      } catch (error) {
        console.error("Error parsing pending analysis result:", error)
        localStorage.removeItem("pendingAnalysisResult")
      }
    }
  }, [])

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result)
    setIsUploaderOpen(false)
  }

  // Fetch Google Shopping results when analysis is complete
  useEffect(() => {
    if (!analysisResult) return

    const fetchShoppingResults = async () => {
      setShoppingLoading(true)
      const results: ShoppingResults = {}
      
      // Get all similar queries from all components
      const allQueries = analysisResult.components
        .flatMap(component => component.similar_queries || [])
        .filter(Boolean)

      console.log('[Google Shopping] Starting fetch for queries:', allQueries)

      await Promise.all(
        allQueries.map(async (query) => {
          try {
            console.log(`[Google Shopping] Fetching results for query: ${query}`)
            results[query] = await fetchSerpApiShoppingResults(query)
            console.log(`[Google Shopping] Results for "${query}":`, results[query])
          } catch (err) {
            console.error(`[Google Shopping] Error fetching results for "${query}":`, err)
            results[query] = []
          }
        })
      )

      setShoppingResults(results)
      setShoppingLoading(false)
      console.log('[Google Shopping] Final shoppingResults state:', results)
    }

    fetchShoppingResults()
  }, [analysisResult])

  return (
    <main className="min-h-screen bg-white">
      {/* <SearchBar /> */}
      
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

            {/* Google Shopping Results */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Google Shopping Results</h2>
              <p className="text-gray-600 mb-4">Similar items found using AI-generated search queries</p>
              
              {shoppingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meta-pink mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading shopping results...</p>
                </div>
              ) : Object.keys(shoppingResults).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.values(shoppingResults)
                    .flat()
                    .filter((product: any) => product.title || product.link)
                    .map((product: any, idx: number) => (
                      <a
                        key={product.link || product.title || idx}
                        href={product.link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded shadow p-4 block hover:shadow-lg transition-shadow border border-gray-200"
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
                        {product.source && (
                          <div className="text-xs text-gray-500 mb-2">{product.source}</div>
                        )}
                        {product.rating && (
                          <div className="text-xs text-gray-600">
                            ⭐ {product.rating} {product.reviews && `(${product.reviews} reviews)`}
                          </div>
                        )}
                      </a>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No shopping results available.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

