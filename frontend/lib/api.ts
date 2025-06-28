// lib/api.ts
import axios from "axios"
import { v4 as uuidv4 } from "uuid"

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
})

// Add request interceptor to automatically include auth token
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

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token')
      // You could also redirect to login here if needed
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
  userId: string,
  metadata: Record<string, any> = {}
) => {
  try {
    await api.post("/style/interactions/track", {
      id: uuidv4(),
      user_id: userId,
      interaction_type: interactionType,
      item_id: uuidv4(),
      metadata,
    })
  } catch (err) {
    console.error("Failed to track interaction:", err)
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
export const fetchGoogleShoppingLightResults = async (query: string, numResults: number = 10) => {
  try {
    const response = await api.get(`/users/shopping/light/search?query=${encodeURIComponent(query)}&num_results=${numResults}`)
    return response.data
  } catch (error) {
    console.error('Error fetching Google Shopping Light results:', error)
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

export default api
