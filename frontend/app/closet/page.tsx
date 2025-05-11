"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api, { setAuthToken } from "../lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, ShoppingBag, Tag, ExternalLink, Trash2, Pencil } from "lucide-react"
import Image from "next/image"

interface ClothingItem {
  name: string;
  thumbnail: string;
  price: string;
  link: string;
}

interface ComponentGroup {
  name: string
  image_url: string
  clothing_items: ClothingItem[]
}

export default function ClosetPage() {
  const [components, setComponents] = useState<ComponentGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  const fetchCloset = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    setAuthToken(token)
    setLoading(true)
    try {
      const res = await api.get("/closet/")
      setComponents(res.data.closet || [])
    } catch (err) {
      console.error("Failed to fetch closet:", err)
      setError("Failed to fetch closet data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCloset()
  }, [])

  const handleDelete = async (link: string, category: string) => {
    const token = localStorage.getItem("token")
    if (!token) {
      return router.push("/login")
    }
    setAuthToken(token)

    try {
      await api.delete("/closet/delete", {
        params: { link, category },
      })
      await fetchCloset() // refresh
    } catch (err) {
      console.error("Delete failed:", err)
      alert("Failed to delete item")
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Closet</h1>
          <p className="text-gray-600 mt-1">Manage and browse your saved fashion items</p>
        </div>
        <Button onClick={() => router.push("/add-item")} className="bg-meta-pink hover:bg-meta-pink/90">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : components.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400" />
            <h3 className="text-xl font-medium text-gray-900">Your closet is empty</h3>
            <p className="text-gray-600 mt-1 mb-6">Upload an outfit to analyze and save items to your closet</p>
            <Button onClick={() => router.push("/")} className="bg-meta-pink hover:bg-meta-pink/90">
              Analyze an Outfit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {components.map((group, index) => (
            <Card key={index} className="overflow-hidden shadow-meta hover:shadow-meta-hover transition-shadow duration-200">
              <div className="relative h-48 bg-gray-100">
                {group.image_url ? (
                  <Image
                  src={group.image_url}
                  alt={group.name || "Category Image"}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 hover:scale-105"
                />                
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <Tag className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <span className="bg-meta-pink/10 text-meta-pink text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {group.clothing_items.length} items
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {group.clothing_items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
                      <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden border border-gray-200">
                      <Image
                        src={item.thumbnail}
                        alt={item.name || "Clothing Item"}
                        layout="fill"
                        objectFit="cover"
                      />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium truncate" title={item.name}>{item.name}</p>
                        <p className="text-xs text-meta-pink">{item.price}</p>
                      </div>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-meta-pink"
                        title="View product"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(item.link, group.name)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(
                          `/edit-item?title=${encodeURIComponent(item.name)}&category=${encodeURIComponent(group.name)}&price=${encodeURIComponent(item.price)}&link=${encodeURIComponent(item.link)}&thumbnail=${encodeURIComponent(item.thumbnail)}`
                        )}
                        className="text-gray-500 hover:text-gray-800"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}