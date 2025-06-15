"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api, { setAuthToken } from "../../lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft } from "lucide-react"
import Image from "next/image"

const CATEGORY_OPTIONS = [
  "Top",
  "Bottom",
  "Outerwear",
  "Footwear",
  "Accessory",
  "Bag",
  "Dress",
  "Suit",
  "Hat"
]

export default function AddItemPage() {
  const [item, setItem] = useState("")
  const [category, setCategory] = useState("Top")
  const [price, setPrice] = useState("")
  const [link, setLink] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) router.push("/login")
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onload = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) return router.push("/login")

    setIsLoading(true)
    setError("")
    setSuccess("")
    setAuthToken(token)

    try {
      const formData = new FormData()
      formData.append("name", item)
      formData.append("category", category)
      formData.append("price", price)
      formData.append("link", link)
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile)
      }

      await api.post("/closet/add", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      setSuccess("Item successfully added!")
      setItem("")
      setCategory("Top")
      setPrice("")
      setLink("")
      setThumbnailFile(null)
      setPreviewUrl(null)

      setTimeout(() => router.push("/closet"), 2000)
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to add item. Please try again.")
    } finally {
      setIsLoading(false)
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
            {previewUrl ? (
              <Image src={previewUrl} alt="Preview" fill className="object-cover rounded-md" />
            ) : (
              <label className="text-center text-gray-500 text-sm px-4 cursor-pointer">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-lg">➕</span>
                <p>Choose a file or drag and drop it here</p>
                <p className="text-xs mt-2">.jpg under 20MB</p>
              </label>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleAdd} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <div>
              <label className="text-sm font-medium">Item Name</label>
              <Input value={item} onChange={(e) => setItem(e.target.value)} required disabled={isLoading} />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                disabled={isLoading}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Price</label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} required disabled={isLoading} />
            </div>

            <div>
              <label className="text-sm font-medium">Product Link</label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} required disabled={isLoading} />
            </div>

            <Button type="submit" className="w-full bg-meta-pink hover:bg-meta-pink/90" disabled={isLoading}>
              {isLoading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save to Closet</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
