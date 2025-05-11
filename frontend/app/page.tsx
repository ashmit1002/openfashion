'use client'

import { useState } from 'react'
import ImageUploader from '../components/ui/ImageUploader'
import AnalyzedImage from '../components/ui/AnalyzedImage'
import ComponentTabs from '../components/ui/ComponentsTab'

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

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
          Fashion Analyzer
        </h1>
        <ImageUploader onAnalysisComplete={handleAnalysisComplete} />
        {analysisResult && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="lg:sticky lg:top-8">
              <AnalyzedImage imageData={analysisResult.annotated_image_base64} />
            </div>
            <ComponentTabs components={analysisResult.components} />
          </div>
        )}
      </div>
    </main>
  )
}

