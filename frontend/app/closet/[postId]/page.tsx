"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"

interface OutfitComponent {
  name: string
  category: string
  notes?: string
  image_url?: string
  link?: string
  region?: { x: number; y: number; width: number; height: number }
}

interface OutfitPost {
  _id: string
  user_id: string
  image_url: string
  caption?: string
  timestamp: string
  components: OutfitComponent[]
}

export default function OutfitPostDetail() {
  const { postId } = useParams() as { postId: string }
  const [post, setPost] = useState<OutfitPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [showRegions, setShowRegions] = useState(true)

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/closet/outfit/${postId}`)
        setPost(res.data)
      } catch (err) {
        setPost(null)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [postId])

  const handleDelete = async () => {
    if (!post) return
    setDeleting(true)
    try {
      await api.delete(`/closet/outfit/${post._id}`)
      router.push("/closet")
    } catch (err) {
      alert("Failed to delete post.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : !post ? (
        <div className="text-center text-red-400">Outfit post not found.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Outfit Image */}
            <div className="relative w-full md:w-[520px] h-[650px] bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-meta-pink flex items-center justify-center mx-auto mb-4">
              <img src={post.image_url} alt={post.caption || "Outfit post"} className="object-cover w-full h-full" />
              {showRegions && post.components.map((comp, idx) => comp.region && (
                <div
                  key={idx}
                  className={`absolute z-10 border-2 ${hoveredIdx === idx ? 'border-blue-600 bg-blue-400/30' : 'border-meta-pink bg-meta-pink/20'} rounded`}
                  style={{
                    left: `${comp.region.x * 100}%`,
                    top: `${comp.region.y * 100}%`,
                    width: `${comp.region.width * 100}%`,
                    height: `${comp.region.height * 100}%`,
                    pointerEvents: "auto"
                  }}
                  title={`${comp.name} (${comp.category})`}
                />
              ))}
            </div>
            {/* Tagged Components */}
            <div className="w-full md:w-[340px] bg-gray-50 rounded-xl shadow-lg border border-meta-pink p-6 flex flex-col gap-4 sticky top-8">
              <h2 className="text-lg font-semibold mb-2">Tagged Components</h2>
              {user && user.email === post.user_id && (
                <div className="flex gap-2 mb-4">
                  <Button onClick={() => router.push(`/closet/${post._id}/edit`)} className="bg-blue-500 text-white" size="sm">Edit</Button>
                  <Button onClick={handleDelete} className="bg-red-500 text-white" size="sm" disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              )}
              {post.components.length === 0 ? (
                <div className="text-gray-400">No components tagged yet.</div>
              ) : (
                <div className="space-y-4">
                  {post.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm gap-4 border border-gray-200"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      {/* Always show image_url if present */}
                      {comp.image_url ? (
                        <img src={comp.image_url} alt="Component" className="w-12 h-12 object-cover rounded border border-gray-200 bg-white" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-200 border border-gray-200 flex items-center justify-center text-xs text-gray-400">No Image</div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold">{comp.name} <span className="text-gray-500">({comp.category})</span></div>
                        {comp.notes && <div className="text-gray-400 text-sm">{comp.notes}</div>}
                        {comp.link && <a href={comp.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline break-all">{comp.link}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-xl font-bold mb-1 text-center mt-8">{post.caption}</div>
          <div className="text-gray-400 text-xs mb-2 text-center">{new Date(post.timestamp).toLocaleString()}</div>
          {user && user.email === post.user_id && (
            <div className="flex justify-center mt-2">
              <Button onClick={handleDelete} className="bg-red-500 text-white" disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Post"}
              </Button>
            </div>
          )}
          {/* Place the button below the image area, right-aligned */}
          <div className="flex justify-end mt-2 mb-6">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowRegions(v => !v)}>
              {showRegions ? 'Hide Regions' : 'Show Regions'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 