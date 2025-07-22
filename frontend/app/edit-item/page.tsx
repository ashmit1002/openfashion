"use client"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api, { setAuthToken } from "../../lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import Image from "next/image"

function EditItemPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { user } = useAuth();

  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [link, setLink] = useState("")
  const [thumbnail, setThumbnail] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (params) {
      setId(params.get("id") || "")
      setName(params.get("title") || "")
      setCategory(params.get("category") || "")
      setPrice(params.get("price") || "")
      setLink(params.get("link") || "")
      setThumbnail(params.get("thumbnail") || "")
      setPreviewUrl(params.get("thumbnail") || "")
    }
  }, [params])

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) return router.push("/login")
    if (!user) return router.push("/login")

    setAuthToken(token)
    setLoading(true)

    try {
      let thumbnailUrl = thumbnail
      if (thumbnailFile) {
        const formData = new FormData()
        formData.append("thumbnail", thumbnailFile)
        const res = await api.post("/upload/upload-thumbnail", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
        thumbnailUrl = res.data.url
      }
      await api.put("/closet/update", {
        id,
        user_id: user.email,
        name,
        category,
        price,
        link,
        thumbnail: thumbnailUrl
      })

      setMessage("Item updated!")
      setTimeout(() => router.push("/closet"), 1500)
    } catch (err) {
      console.error(err)
      setMessage("Failed to update item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.push("/closet")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Closet
      </Button>

      <Card className="shadow-meta">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
          {/* Upload Box */}
          <div className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50 relative">
            <label className="text-center text-gray-500 text-sm px-4 cursor-pointer w-full h-full flex flex-col items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
              {previewUrl ? (
                <Image src={previewUrl} alt="Preview" fill className="object-cover rounded-md" />
              ) : (
                <>
                  <span className="text-lg">➕</span>
                  <p>Choose a file or drag and drop it here</p>
                  <p className="text-xs mt-2">.jpg under 20MB</p>
                </>
              )}
            </label>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdate} className="space-y-4">
            {message && <p className={`text-sm text-center mt-2 ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>{message}</p>}

            <div>
              <label className="text-sm font-medium">Item Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                disabled={loading}
              >
                {[
                  "Top",
                  "Bottom",
                  "Outerwear",
                  "Footwear",
                  "Accessory",
                  "Bag",
                  "Dress",
                  "Suit",
                  "Hat"
                ].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Price</label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} required disabled={loading} />
            </div>

            <div>
              <label className="text-sm font-medium">Product Link</label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} required disabled={loading} />
            </div>

            <Button type="submit" className="w-full bg-meta-pink hover:bg-meta-pink/90" disabled={loading}>
              {loading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EditItemPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditItemPageInner />
    </Suspense>
  )
}