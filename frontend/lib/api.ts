// lib/api.ts
import axios from "axios"
import { v4 as uuidv4 } from "uuid"

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common["Authorization"]
  }
}

export const trackInteraction = async (
  interactionType: string,
  itemId: string,
  metadata: any = {}
) => {
  try {
    await api.post("/users/interactions", {
      interaction_type: interactionType,
      item_id: itemId,
      metadata,
    })
  } catch (error) {
    console.error("Failed to track interaction:", error)
  }
}

/**
 * Fetches Google Shopping results from the backend for a given query.
 * @param query The search query string.
 * @param numResults Number of results to fetch (default 10).
 * @returns An array of shopping results from the backend.
 */
export async function fetchSerpApiShoppingResults(query: string, numResults: number = 10) {
  const url = `/users/shopping/search?query=${encodeURIComponent(query)}&num_results=${numResults}`;
  const response = await api.get(url);
  return response.data;
}

/**
 * Fetches Google Shopping Light results from the backend for a given query.
 * This is faster than regular Google Shopping and provides essential product data.
 * @param query The search query string.
 * @param numResults Number of results to fetch (default 10).
 * @returns An array of shopping light results from the backend.
 */
export const fetchGoogleShoppingLightResults = async (query: string) => {
  try {
    const response = await api.get(`/search/google-shopping-light?query=${query}`)
    return response.data
  } catch (error) {
    console.error('Error fetching Google Shopping results:', error)
    return []
  }
}

/**
 * Starts a new style chat conversation.
 * @returns Promise with initial chat response
 */
export const startStyleChat = async () => {
  try {
    const response = await api.get('/users/chat/style/start')
    return response.data
  } catch (error) {
    console.error('Error starting style chat:', error)
    throw error
  }
}

/**
 * Sends a message to the style chatbot.
 * @param message - The user's message
 * @param context - Additional context (optional)
 * @returns Promise with bot response
 */
export const sendChatMessage = async (message: string, context: any = {}) => {
  try {
    const response = await api.post('/users/chat/style', {
      message,
      context
    })
    return response.data
  } catch (error) {
    console.error('Error sending chat message:', error)
    throw error
  }
}

/**
 * Gets the user's style profile from chat interactions.
 * @returns Promise with style profile data
 */
export const getStyleChatProfile = async () => {
  try {
    const response = await api.get('/users/chat/style/profile')
    return response.data
  } catch (error) {
    console.error('Error getting style chat profile:', error)
    throw error
  }
}

// Auth endpoints
export const auth = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, username: string) => 
    api.post('/auth/register', { email, password, username }),
  me: () => api.get('/auth/me'),
}

// Upload endpoints
export const upload = {
  analyze: (formData: FormData) => 
    api.post('/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  thumbnail: (formData: FormData) => 
    api.post('/upload/upload-thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
}

// Closet endpoints
export const closet = {
  getAll: () => api.get('/closet/'),
  addItem: (item: any) => api.post('/closet/', item),
  deleteItem: (itemId: string) => api.delete(`/closet/${itemId}`),
  getUserCloset: (username: string) => api.get(`/closet/user/${username}`),
}

// Wishlist endpoints
export const wishlist = {
  getAll: () => api.get('/wishlist/'),
  addItem: (item: any) => api.post('/wishlist/', item),
  deleteItem: (itemId: string) => api.delete(`/wishlist/${itemId}`),
}

// User endpoints
export const users = {
  getByUsername: (username: string) => api.get(`/users/user/${username}`),
  updateProfile: (data: any) => api.put('/users/user/profile', data),
  follow: (username: string) => api.post(`/users/user/follow/${username}`),
  unfollow: (username: string) => api.post(`/users/user/unfollow/${username}`),
  search: (query: string) => api.get(`/users/users/search?query=${query}`),
}

// Subscription endpoints
export const subscription = {
  getTiers: () => api.get('/subscription/tiers'),
  createCustomer: () => api.post('/subscription/create-customer'),
  createSubscription: (data: { price_id: string; customer_id: string }) => 
    api.post('/subscription/create-subscription', data),
  createCheckoutSession: (data: any) => api.post('/subscription/create-checkout-session', data),
  cancelSubscription: (subscriptionId?: string) => {
    if (subscriptionId) {
      return api.post('/subscription/cancel-subscription', { subscription_id: subscriptionId })
    } else {
      return api.post('/subscription/cancel-subscription')
    }
  },
  checkUploadLimit: () => api.get('/subscription/upload-limit'),
}

// Style quiz endpoints
export const styleQuiz = {
  getQuestions: () => api.get('/style/quiz/questions'),
  submitResponse: (data: any) => api.post('/style/quiz/response', data),
  getRecommendations: () => api.get('/style/recommendations'),
}

// Search endpoints
export const search = {
  googleShopping: (query: string) => api.get(`/search/google-shopping?query=${query}`),
}

export default api
