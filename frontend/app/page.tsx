'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ImageUploader from '@/components/ui/ImageUploader'
import AnalyzedImage from '@/components/ui/AnalyzedImage'
import ComponentTabs from '@/components/ui/ComponentsTab'
import { useAuth } from '@/contexts/AuthContext'
import { fetchSerpApiShoppingResults } from '@/lib/api'
import { 
  Sparkles, 
  Search, 
  ShoppingBag, 
  MessageCircle, 
  Upload, 
  Zap, 
  Shield, 
  Star, 
  ArrowRight,
  CheckCircle,
  Camera,
  Palette,
  TrendingUp,
  Crown,
  Infinity
} from 'lucide-react'

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
  const { user } = useAuth()
  const router = useRouter()
  const uploadSectionRef = useRef<HTMLElement>(null)
  const [isUploaderOpen, setIsUploaderOpen] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [shoppingResults, setShoppingResults] = useState<ShoppingResults>({})
  const [shoppingLoading, setShoppingLoading] = useState(false)

  // Determine if user is premium
  const isPremium = user?.subscription_status === 'premium'
  const isLoggedIn = !!user

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

  // Fetch shopping results whenever analysisResult changes
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

  // Authentication check function
  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    action()
  }

  // Scroll to upload section
  const scrollToUploadSection = () => {
    uploadSectionRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result)
    setIsUploaderOpen(false)
    // Shopping results will be fetched automatically by the useEffect when analysisResult changes
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-meta-pink/5 via-white to-blue-50/30 py-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-meta-pink/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-meta-pink/10 text-meta-pink text-sm font-medium mb-6 border border-meta-pink/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Fashion Discovery
            </motion.div>
            
            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Discover Your Perfect
              <span className="text-meta-pink bg-gradient-to-r from-meta-pink to-pink-600 bg-clip-text text-transparent"> Style</span>
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Upload any clothing image and instantly find similar items, get personalized style recommendations, and organize your digital wardrobe with advanced AI
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <button
                onClick={() => requireAuth(() => {
                  scrollToUploadSection()
                  setIsUploaderOpen(true)
                })}
                className="group bg-meta-pink hover:bg-meta-pink/90 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center"
              >
                <Upload className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Start Analysis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => requireAuth(() => router.push('/explore'))}
                className="border-2 border-gray-300 hover:border-meta-pink text-gray-700 hover:text-meta-pink px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 flex items-center"
              >
                <Camera className="w-5 h-5 mr-2" />
                Explore Styles
              </button>
            </motion.div>
            
            {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
            >
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                {isPremium ? 'Unlimited uploads/week' : '3 free uploads/week'}
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-blue-500" />
                Privacy protected
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                Instant results
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Style Discovery
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform combines advanced image recognition with personalized recommendations to revolutionize your fashion journey
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="group text-center p-8 rounded-2xl bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-100 cursor-pointer"
              onClick={() => requireAuth(() => {
                scrollToUploadSection()
                setIsUploaderOpen(true)
              })}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-meta-pink/10 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-10 h-10 text-meta-pink" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">AI Image Analysis</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload any clothing photo and get detailed analysis of colors, patterns, style categories, and personalized recommendations
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group text-center p-8 rounded-2xl bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-100 cursor-pointer"
              onClick={() => requireAuth(() => router.push('/fashion-search'))}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Shopping Discovery</h3>
              <p className="text-gray-600 leading-relaxed">
                Find similar items across the web with AI-generated search queries and curated shopping results from top retailers
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group text-center p-8 rounded-2xl bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-lg border border-gray-100 cursor-pointer"
              onClick={() => requireAuth(() => router.push('/chat'))}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Style Chatbot</h3>
              <p className="text-gray-600 leading-relaxed">
                Get personalized style advice, outfit recommendations, and wardrobe organization tips from our AI assistant
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in just three simple steps
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center relative"
            >
              <div className="w-16 h-16 bg-meta-pink rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Upload Your Image</h3>
              <p className="text-gray-600">
                Simply drag and drop or click to upload any clothing photo from your device
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center relative"
            >
              <div className="w-16 h-16 bg-meta-pink rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">AI Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes colors, patterns, and style elements to understand your fashion preferences
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center relative"
            >
              <div className="w-16 h-16 bg-meta-pink rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Discover & Shop</h3>
              <p className="text-gray-600">
                Get personalized recommendations and find similar items to purchase online
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Only show if user is not premium */}
      {!isPremium && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Choose Your Plan
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Start with our free plan or unlock unlimited access with premium
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Basic Plan */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
                  <div className="text-4xl font-bold text-meta-pink mb-2">Free</div>
                  <p className="text-gray-600">Perfect for trying out our features</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>3 image uploads per week</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>3 fashion searches per week</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Basic AI analysis</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Style chatbot access</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => requireAuth(() => {
                    scrollToUploadSection()
                    setIsUploaderOpen(true)
                  })}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-full transition-colors"
                >
                  Get Started Free
          </button>
        </motion.div>

              {/* Premium Plan */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-gradient-to-br from-meta-pink to-pink-600 p-8 rounded-2xl shadow-lg border border-meta-pink/20 relative overflow-hidden"
              >
                {/* Popular badge */}
                <div className="absolute top-4 right-4 bg-white text-meta-pink px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  <Crown className="w-4 h-4 mr-1" />
                  Popular
                </div>
                
                <div className="text-center mb-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">Premium</h3>
                  <div className="text-4xl font-bold mb-2">$5.99<span className="text-lg">/month</span></div>
                  <p className="text-pink-100">Unlimited access to all features</p>
                </div>
                
                <ul className="space-y-4 mb-8 text-white">
                  <li className="flex items-center">
                    <Infinity className="w-5 h-5 text-white mr-3" />
                    <span>Unlimited image uploads</span>
                  </li>
                  <li className="flex items-center">
                    <Infinity className="w-5 h-5 text-white mr-3" />
                    <span>Unlimited fashion searches</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-white mr-3" />
                    <span>Advanced AI analysis</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-white mr-3" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-white mr-3" />
                    <span>Early access to new features</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => requireAuth(() => router.push('/premium'))}
                  className="w-full bg-white hover:bg-gray-100 text-meta-pink font-semibold py-3 px-6 rounded-full transition-colors"
                >
                  Upgrade to Premium
                </button>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Upload Section */}
      <section ref={uploadSectionRef} className="py-20 bg-gradient-to-br from-meta-pink/5 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Discover Your Style?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {isPremium 
                ? "You have unlimited access to all features" 
                : "Start with 3 free uploads and 3 fashion searches per week"
              }
            </p>
          </motion.div>
          
          {isUploaderOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <ImageUploader onAnalysisComplete={handleAnalysisComplete} />
            </motion.div>
          )}
          
          {!isUploaderOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <button
                onClick={() => requireAuth(() => setIsUploaderOpen(true))}
                className="group bg-meta-pink hover:bg-meta-pink/90 text-white px-10 py-5 rounded-full font-semibold text-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center mx-auto"
              >
                <Upload className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                Start Analysis
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-sm text-gray-500 mt-4">
                {isPremium 
                  ? "Unlimited uploads • Premium access" 
                  : "3 free uploads per week • No credit card required"
                }
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Results Section */}
        {analysisResult && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          </div>
        </section>
        )}
    </main>
  )
}

