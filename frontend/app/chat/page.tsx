'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send, Sparkles, User, ArrowLeft, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { startStyleChat, sendChatMessage, getStyleChatProfile } from '@/lib/api'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  message: string
  timestamp: Date
  suggestions?: string[]
  nextQuestions?: string[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [styleProfile, setStyleProfile] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const router = useRouter()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize chat when component mounts
  useEffect(() => {
    if (user && !isInitialized) {
      initializeChat()
      loadStyleProfile()
    }
  }, [user, isInitialized])

  const initializeChat = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const response = await startStyleChat()
      const { message, suggestions, next_questions } = response

      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        message,
        timestamp: new Date(),
        suggestions,
        nextQuestions: next_questions
      }

      setMessages([botMessage])
      setIsInitialized(true)
    } catch (error: any) {
      console.error('Failed to initialize chat:', error)
      
      if (error.response?.status === 401) {
        toast.error('Please log in to use the chat')
        router.push('/login')
        return
      }
      
      toast.error('Failed to start chat')
      
      // Fallback message
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        message: "Hi! I'm your personal style assistant. I'd love to help you discover your unique style! What's your biggest style challenge right now?",
        timestamp: new Date(),
        suggestions: ["Tell me about your lifestyle", "Share your style goals"],
        nextQuestions: ["What's your biggest style challenge?", "How would you describe your current style?"]
      }
      setMessages([fallbackMessage])
      setIsInitialized(true)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStyleProfile = async () => {
    try {
      const profile = await getStyleChatProfile()
      setStyleProfile(profile)
    } catch (error: any) {
      console.error('Failed to load style profile:', error)
      // Don't show error for profile loading, it's optional
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await sendChatMessage(inputMessage, {})
      const { response: botResponse, suggestions, next_questions } = response

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: botResponse,
        timestamp: new Date(),
        suggestions,
        nextQuestions: next_questions
      }

      setMessages(prev => [...prev, botMessage])
      
      // Reload style profile after each message
      await loadStyleProfile()
    } catch (error: any) {
      console.error('Failed to send message:', error)
      
      if (error.response?.status === 401) {
        toast.error('Please log in to use the chat')
        router.push('/login')
        return
      }
      
      toast.error('Failed to send message')
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
  }

  const handleQuestionClick = (question: string) => {
    setInputMessage(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Please log in to chat</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to use the style assistant.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-meta-pink text-white px-6 py-2 rounded-full hover:bg-meta-pink/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-meta-pink rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Style Expert</h1>
                  <p className="text-sm text-gray-500">Your personal fashion consultant</p>
                </div>
              </div>
            </div>
            
            {styleProfile && (
              <button
                onClick={() => router.push('/preferences')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="View Style Profile"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-meta-pink text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      
                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-gray-500 font-medium">Quick reply:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.suggestions.slice(0, 2).map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Next Questions */}
                      {message.nextQuestions && message.nextQuestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-gray-500 font-medium">You can ask:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.nextQuestions.slice(0, 1).map((question, index) => (
                              <button
                                key={index}
                                onClick={() => handleQuestionClick(question)}
                                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
                              >
                                {question}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 border-t border-gray-100">
                <div className="flex space-x-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about your style, preferences, or challenges..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-meta-pink focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="w-12 h-12 bg-meta-pink text-white rounded-full flex items-center justify-center hover:bg-meta-pink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Style Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Your Style Profile</h3>
              
              {styleProfile ? (
                <div className="space-y-4">
                  {styleProfile.existing_profile?.style_summary && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Style Summary</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {styleProfile.existing_profile.style_summary}
                      </p>
                    </div>
                  )}
                  
                  {styleProfile.chat_insights?.total_interactions && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Chat Insights</h4>
                      <div className="text-sm text-gray-600">
                        <p>Total interactions: {styleProfile.chat_insights.total_interactions}</p>
                      </div>
                    </div>
                  )}
                  
                  {styleProfile.recommendations && styleProfile.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {styleProfile.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-meta-pink mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    Start chatting to build your style profile!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 