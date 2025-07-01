"use client"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api, { setAuthToken } from "../../lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, ArrowLeft } from "lucide-react"

function EditItemPageInner() {
  const router = useRouter()
  const params = useSearchParams()

  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [link, setLink] = useState("")
  const [thumbnail, setThumbnail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (params) {
      setName(params.get("title") || "")
      setCategory(params.get("category") || "")
      setPrice(params.get("price") || "")
      setLink(params.get("link") || "")
      setThumbnail(params.get("thumbnail") || "")
    }
  }, [params])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) return router.push("/login")

    setAuthToken(token)
    setLoading(true)

    try {
      await api.put("/closet/update", {
        name,
        category,
        price,
        link,
        thumbnail
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.push("/closet")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item Name" required />
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" required />
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" required />
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Product Link" required />
            <Input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="Thumbnail URL" required />
            <Button type="submit" className="w-full bg-meta-pink hover:bg-meta-pink/90" disabled={loading}>
              {loading ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
            </Button>
            {message && <p className="text-sm text-center mt-2">{message}</p>}
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