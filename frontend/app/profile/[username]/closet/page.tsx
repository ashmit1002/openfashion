"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/lib/api"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { ExternalLink, Edit2, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  username: string
  name?: string
  display_name?: string
  avatar_url?: string
  bio?: string
  followers: string[]
  following: string[]
}

interface ClothingItem {
  name: string
  category: string
  price: string
  link: string
  thumbnail: string
}

interface ComponentGroup {
  name: string
  image_url: string
  clothing_items: ClothingItem[]
}

export default function UserClosetPage() {
  const [components, setComponents] = useState<ComponentGroup[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<User | null>(null)
  const router = useRouter()
  const params = useParams()
  const username = params.username as string
  const { user } = useAuth()

  // Fetch user's closet
  const fetchUserCloset = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/closet/user/${username}`)
      setComponents(res.data.closet || [])
    } catch (err) {
      console.error("Failed to fetch user's closet:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await api.get(`/users/user/${username}`)
      setProfile(response.data)
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  useEffect(() => {
    fetchUserCloset()
    fetchUserProfile()
  }, [username])

  const getAllItems = (): ClothingItem[] => {
    return components.flatMap(group =>
      selectedCategory === "All" || group.name === selectedCategory
        ? group.clothing_items.map(item => ({ ...item, category: group.name }))
        : []
    )
  }

  const allCategories = ["All", ...new Set(components.map(group => group.name))]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Section */}
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl mx-auto mb-10">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full border-4 border-meta-pink bg-gray-100 flex items-center justify-center text-5xl font-bold text-meta-pink mb-4 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              (profile?.display_name?.[0] || profile?.username?.[0] || "A").toUpperCase()
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">{profile?.display_name || profile?.username}</div>
          <div className="text-gray-500 mb-2">@{profile?.username}</div>
          <div className="flex gap-8 mb-6 text-center">
            <div>
              <span className="font-semibold text-gray-900">{profile?.followers.length || 0}</span>
              <span className="text-gray-500"> Followers</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">{profile?.following.length || 0}</span>
              <span className="text-gray-500"> Following</span>
            </div>
          </div>
          {profile?.bio && (
            <p className="text-gray-600 text-center max-w-md">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Closet Section */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-12">
        {/* Left Column: Pinterest-style Masonry Grid */}
        <div>
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight">{profile?.display_name || profile?.username}'s Closet</h1>
          </div>
          {loading ? (
            <p className="text-gray-400 text-lg">Loading closet...</p>
          ) : (
            <div className="[column-count:1] sm:[column-count:2] lg:[column-count:3] xl:[column-count:4] [column-gap:2.5rem]">
              {getAllItems().map((item, index) => (
                <div
                  key={index}
                  className="mb-10 break-inside-avoid rounded-3xl shadow-xl bg-white overflow-hidden group relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                  style={{ minHeight: 320 }}
                >
                  <div className="relative w-full aspect-[3/4] bg-gray-100">
                    <Image
                      src={item.thumbnail || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover rounded-3xl"
                    />
                    <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex flex-col gap-1"
                      style={{
                        background: 'rgba(255,255,255,0.35)',
                        backdropFilter: 'blur(12px)',
                        borderBottomLeftRadius: '1.5rem',
                        borderBottomRightRadius: '1.5rem',
                      }}
                    >
                      <div className="text-gray-900 font-bold text-lg truncate drop-shadow-sm">{item.name}</div>
                      <div className="text-meta-pink font-extrabold text-base drop-shadow-sm">{item.price}</div>
                    </div>
                  </div>
                  {/* Actions: View product only */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/80 hover:bg-meta-pink text-gray-700 hover:text-white rounded-full p-2 shadow-md transition-colors"
                      title="View product"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Filters */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
          <div className="space-y-2">
            {allCategories.map((cat, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(cat)}
                className={`block text-left w-full text-sm px-4 py-2 rounded-md ${
                  selectedCategory === cat
                    ? "bg-meta-pink text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}