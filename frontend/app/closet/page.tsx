"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // Using next/navigation for App Router
import api, { setAuthToken } from "../lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, ShoppingBag, Tag, ExternalLink, Trash2, Pencil, Search, Filter, Loader2 } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"

interface ClothingItem {
  name: string
  thumbnail: string
  price: string
  link: string
}

interface ComponentGroup {
  name: string
  image_url: string
  clothing_items: ClothingItem[]
}

export default function ClosetPage() {
  const [components, setComponents] = useState<ComponentGroup[]>([])
  const [filteredComponents, setFilteredComponents] = useState<ComponentGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
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
      setFilteredComponents(res.data.closet || [])
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

  useEffect(() => {
    if (searchTerm) {
      const filtered = components
        .map((group) => {
          // Filter items within each group
          const filteredItems = group.clothing_items.filter(
            (item) =>
              item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              group.name.toLowerCase().includes(searchTerm.toLowerCase()),
          )

          // Return the group with filtered items
          return {
            ...group,
            clothing_items: filteredItems,
          }
        })
        .filter((group) => group.clothing_items.length > 0) // Only keep groups with matching items

      setFilteredComponents(filtered)
    } else {
      setFilteredComponents(components)
    }
  }, [searchTerm, components])

  const handleDelete = async (link: string, category: string, itemName = "this item") => {
    const token = localStorage.getItem("token")
    if (!token) {
      return router.push("/login")
    }

    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return
    }

    setAuthToken(token)
    setDeleteLoading(`${category}-${link}`)

    try {
      await api.delete("/closet/delete", {
        params: { link, category },
      })
      await fetchCloset() // refresh
    } catch (err) {
      console.error("Delete failed:", err)
      alert("Failed to delete item")
    } finally {
      setDeleteLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Closet</h1>
          <p className="text-gray-600 mt-1">Manage and browse your saved fashion items</p>
        </div>
        <Button
          onClick={() => router.push("/add-item")}
          className="bg-meta-pink hover:bg-meta-pink/90 text-white shadow-sm"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search your closet..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-meta-pink animate-spin mb-4" />
          <p className="text-gray-600">Loading your closet...</p>
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-red-500 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => fetchCloset()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : components.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Your closet is empty</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Upload an outfit to analyze and save items to your closet, or add items manually.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push("/")} className="bg-meta-pink hover:bg-meta-pink/90 text-white">
                <ShoppingBag className="mr-2 h-4 w-4" /> Analyze an Outfit
              </Button>
              <Button onClick={() => router.push("/add-item")} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredComponents.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matching items found</h3>
            <p className="text-gray-600 mb-4">We couldn't find any items matching "{searchTerm}"</p>
            <Button onClick={() => setSearchTerm("")} variant="outline">
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComponents.map((group, index) => (
              <Card
                key={index}
                className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
              >
                <div className="relative h-48 bg-gray-100 overflow-hidden group">
                  {group.image_url ? (
                    <>
                      <Image
                        src={group.image_url || "/placeholder.svg"}
                        alt={group.name || "Category Image"}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-200">
                      <Tag className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center rounded-full bg-meta-pink px-2.5 py-0.5 text-xs font-semibold text-white">
                      {group.clothing_items.length} {group.clothing_items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold">{group.name}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="divide-y divide-gray-100">
                    {group.clothing_items.map((item, i) => (
                      <li key={i} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                            {item.thumbnail ? (
                              <Image
                                src={item.thumbnail || "/placeholder.svg"}
                                alt={item.name || "Clothing Item"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Tag className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium truncate" title={item.name}>
                              {item.name || "Unnamed Item"}
                            </p>
                            <p className="text-xs font-semibold text-meta-pink">
                              {item.price || "Price not available"}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-full text-gray-500 hover:text-meta-pink hover:bg-gray-100"
                              title="View product"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() =>
                                router.push(
                                  `/edit-item?title=${encodeURIComponent(item.name || "")}&category=${encodeURIComponent(
                                    group.name,
                                  )}&price=${encodeURIComponent(item.price || "")}&link=${encodeURIComponent(
                                    item.link || "",
                                  )}&thumbnail=${encodeURIComponent(item.thumbnail || "")}`,
                                )
                              }
                              className="p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.link, group.name, item.name)}
                              className="p-1.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-gray-100"
                              title="Delete"
                              disabled={deleteLoading === `${group.name}-${item.link}`}
                            >
                              {deleteLoading === `${group.name}-${item.link}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-0 pb-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-600 hover:text-meta-pink"
                    onClick={() => router.push(`/category/${encodeURIComponent(group.name)}`)}
                  >
                    View All
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {components.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm mb-2">
                Showing {filteredComponents.reduce((acc, group) => acc + group.clothing_items.length, 0)} items across{" "}
                {filteredComponents.length} categories
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
