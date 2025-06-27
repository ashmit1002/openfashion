// lib/api.ts
import axios from "axios"
import { v4 as uuidv4 } from "uuid"

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
})

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

export default api
