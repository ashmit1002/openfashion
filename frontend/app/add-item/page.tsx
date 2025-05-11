"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import api, { setAuthToken } from "../lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft } from "lucide-react"

export default function AddItemPage() {
  const [item, setItem] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [link, setLink] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
    }
  }, [router])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

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
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

      setSuccess("Item successfully added to your closet!")
      setItem("")
      setCategory("")
      setPrice("")
      setLink("")
      setThumbnailFile(null)

      setTimeout(() => {
        router.push("/closet")
      }, 2000)
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to add item. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.push("/closet")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Closet
      </Button>

      <Card className="shadow-meta">
        <CardHeader>
          <CardTitle className="text-2xl">Add New Item</CardTitle>
          <CardDescription>Add a new fashion item to your closet</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm">
              {success}
            </div>
          )}
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="item" className="text-sm font-medium">Item Name</label>
              <Input id="item" value={item} onChange={(e) => setItem(e.target.value)} placeholder="Blue Denim Jacket" required disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">Category</label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Outerwear" required disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">Price</label>
              <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$49.99" required disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <label htmlFor="link" className="text-sm font-medium">Product Link</label>
              <Input id="link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com/product" required disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <label htmlFor="thumbnail" className="text-sm font-medium">Upload Thumbnail</label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full bg-meta-pink hover:bg-meta-pink/90" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center">Saving...</span>
              ) : (
                <span className="flex items-center justify-center">
                  <Save className="mr-2 h-4 w-4" /> Save to Closet
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
