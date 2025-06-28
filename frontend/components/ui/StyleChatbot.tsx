'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import api, { setAuthToken } from '@/lib/api'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  message: string
  timestamp: Date
  suggestions?: string[]
  nextQuestions?: string[]
}

interface StyleChatbotProps {
  className?: string
}

export default function StyleChatbot({ className = '' }: StyleChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Initialize chat when opened for the first time
  useEffect(() => {
    if (isOpen && !isInitialized && user) {
      initializeChat()
    }
  }, [isOpen, isInitialized, user])

  const initializeChat = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      const response = await api.get('/users/chat/style/start')
      const { message, suggestions, next_questions } = response.data

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
      setHasInteracted(true)
    } catch (error: any) {
      console.error('Failed to initialize chat:', error)
      
      if (error.response?.status === 401) {
        toast.error('Please log in to use the chat')
        setIsOpen(false)
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
      setHasInteracted(true)
    } finally {
      setIsLoading(false)
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
    setHasInteracted(true)

    try {
      const response = await api.post('/users/chat/style', {
        message: inputMessage,
        context: {}
      })

      const { response: botResponse, suggestions, next_questions } = response.data

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: botResponse,
        timestamp: new Date(),
        suggestions,
        nextQuestions: next_questions
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error: any) {
      console.error('Failed to send message:', error)
      
      if (error.response?.status === 401) {
        toast.error('Please log in to use the chat')
        setIsOpen(false)
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

  // Don't show chatbot if user is not logged in
  if (!user) {
    return null
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-96 h-[500px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-meta-pink to-pink-500 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-meta-pink" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Style Expert</h3>
                  <p className="text-white/80 text-xs">Your personal fashion consultant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
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
                              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition-colors"
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
                              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition-colors"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your style..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-meta-pink focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="w-10 h-10 bg-meta-pink text-white rounded-full flex items-center justify-center hover:bg-meta-pink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-14 h-14 bg-meta-pink text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6" />
        
        {/* Notification badge for new users */}
        {!hasInteracted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-xs font-bold">!</span>
          </motion.div>
        )}
      </motion.button>
    </div>
  )
} 