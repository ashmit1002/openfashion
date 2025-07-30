"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import api, { setAuthToken } from "../../lib/api"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Trash2, ExternalLink, Edit2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { MasonryGrid } from "@/components/ui/MasonryGrid"
import CropperModal from "@/components/ui/CropperModal"

interface ClothingItem {
  _id: string
  name: string
  thumbnail: string
  price: string
  link: string
  category: string
}

interface ComponentGroup {
  name: string
  image_url: string
  clothing_items: ClothingItem[]
}

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

// New interfaces for outfit posts
interface OutfitComponent {
  name: string
  category: string
  position?: { x: number; y: number }
  closet_item_link?: string
  notes?: string
}

interface OutfitPost {
  _id: string
  user_id: string
  image_url: string
  caption?: string
  timestamp: string
  components: OutfitComponent[]
}

// Wishlist item interface
interface WishlistItem {
  _id: string;
  title: string;
  category: string;
  price: number;
  link: string;
  thumbnail: string;
  likes: number;
  saves: number;
  tags: string[];
}

export default function ClosetPage() {
  const [components, setComponents] = useState<ComponentGroup[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Profile state
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ display_name: '', avatar_url: '', bio: '' })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cropping state
  const [showCropper, setShowCropper] = useState(false)
  const [cropperImage, setCropperImage] = useState<string | null>(null)

  // Tab state
  type ClosetTab = 'outfits' | 'closet' | 'wishlist';
  const [tab, setTab] = useState<ClosetTab>('outfits')
  const [outfitPosts, setOutfitPosts] = useState<OutfitPost[]>([])
  const [loadingOutfits, setLoadingOutfits] = useState(true)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Fetch closet
  const fetchCloset = async () => {
    const token = localStorage.getItem("token")
    if (!token) return router.push("/login")
    setAuthToken(token)
    setLoading(true)
    try {
      const res = await api.get("/closet/")
      setComponents(res.data.closet || [])
    } catch (err) {
      console.error("Failed to fetch closet:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch profile
  const fetchProfile = async () => {
    if (!user) return
    try {
      const response = await api.get(`/users/user/${user.username}`)
      setProfile(response.data)
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  // Fetch outfit posts
  const fetchOutfitPosts = async () => {
    if (!user) return
    setLoadingOutfits(true)
    try {
      const res = await api.get(`/closet/outfit/user/${user.username}`)
      setOutfitPosts(res.data.outfit_posts || [])
    } catch (err) {
      console.error("Failed to fetch outfit posts:", err)
    } finally {
      setLoadingOutfits(false)
    }
  }

  // Fetch wishlist items
  const fetchWishlistItems = async () => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');
    setAuthToken(token);
    setLoadingWishlist(true);
    try {
      const response = await api.get('/wishlist/');
      setWishlistItems(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoadingWishlist(false);
    }
  };

  useEffect(() => {
    // Refresh user data to ensure profile picture is loaded
    refreshUser()
    fetchCloset()
    fetchProfile()
    fetchOutfitPosts()
    // eslint-disable-next-line
  }, [user, refreshUser])

  // Fetch wishlist items when tab changes to wishlist
  useEffect(() => {
    if (tab === 'wishlist') {
      fetchWishlistItems();
    }
    // eslint-disable-next-line
  }, [tab]);

  const getAllItems = (): ClothingItem[] => {
    return components.flatMap(group =>
      selectedCategory === "All" || group.name === selectedCategory
        ? group.clothing_items.map(item => ({ ...item, category: group.name }))
        : []
    )
  }

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("token")
    if (!token) return router.push("/login")
    try {
      await api.delete(`/closet/delete?id=${id}`)
      fetchCloset()
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  // Profile edit logic
  const handleEdit = () => {
    setEditData({
      display_name: profile?.display_name || '',
      avatar_url: profile?.avatar_url || '',
      bio: profile?.bio || '',
    });
    setAvatarPreview(profile?.avatar_url || null);
    setEditMode(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob, croppedUrl: string) => {
    setAvatarPreview(croppedUrl);
    setEditData(prev => ({ ...prev, avatar_url: croppedUrl }));
    setShowCropper(false);
    setCropperImage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/users/user/profile', {
        display_name: editData.display_name,
        avatar_url: editData.avatar_url,
        bio: editData.bio
      });
      toast.success("Profile updated!", { style: { background: "#e9fbe9", color: "#1a7f37" } })
      setEditMode(false);
      fetchProfile();
      // Refresh user data in AuthContext so changes are reflected everywhere
      await refreshUser();
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditData({
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
      });
      setAvatarPreview(profile.avatar_url || null);
    }
    setEditMode(false);
  };

  const allCategories = ["All", ...new Set(components.map(group => group.name))]

  // In ClosetPage component, add a function to delete an outfit post
  const handleDeleteOutfitPost = async (postId: string) => {
    try {
      await api.delete(`/closet/outfit/${postId}`)
      fetchOutfitPosts()
    } catch (err) {
      alert("Failed to delete post.")
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Section */}
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl mx-auto mb-10">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full border-4 border-meta-pink bg-gray-100 flex items-center justify-center text-5xl font-bold text-meta-pink mb-4 overflow-hidden relative">
            {avatarPreview || profile?.avatar_url ? (
              <img src={avatarPreview || profile?.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              (profile?.display_name?.[0] || profile?.username?.[0] || "A").toUpperCase()
            )}
            {editMode && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  className="absolute bottom-2 right-2 bg-meta-pink text-white rounded-full p-2 shadow hover:bg-meta-pink/90"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change avatar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652l-1.688 1.687m-2.651-2.651a4.5 4.5 0 11-6.364 6.364 4.5 4.5 0 016.364-6.364zm-9.193 9.193a4.5 4.5 0 016.364 6.364 4.5 4.5 0 01-6.364-6.364z" />
                  </svg>
                </button>
              </>
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
          {/* Show bio as plain text unless in edit mode */}
          {!editMode && profile?.bio && (
            <div className="text-gray-600 text-center text-base whitespace-pre-line mb-4">{profile.bio}</div>
          )}
          {/* Only show the form in edit mode */}
          {editMode && (
            <form className="w-full max-w-lg space-y-4" onSubmit={handleSave}>
              <div className="flex gap-4">
                <input
                  className="flex-1 rounded-lg border border-gray-200 focus:border-meta-pink focus:ring-meta-pink px-3 py-2"
                  placeholder="Display Name"
                  value={editData.display_name}
                  onChange={e => setEditData({ ...editData, display_name: e.target.value })}
                  disabled={!editMode}
                />
              </div>
              <textarea
                className="w-full rounded-lg border border-gray-200 focus:border-meta-pink focus:ring-meta-pink px-3 py-2 min-h-[60px]"
                placeholder="Bio"
                value={editData.bio}
                onChange={e => setEditData({ ...editData, bio: e.target.value })}
                disabled={!editMode}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCancel} className="border-gray-300">Cancel</Button>
                <Button type="submit" className="bg-meta-pink text-white hover:bg-meta-pink/90">Save</Button>
              </div>
            </form>
          )}
          {/* Edit Profile button only if not in edit mode */}
          {!editMode && (
            <Button type="button" className="bg-meta-pink text-white hover:bg-meta-pink/90 mt-2" onClick={handleEdit}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Closet Section */}
      <div className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded-full font-semibold ${tab === 'outfits' ? 'bg-meta-pink text-white' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setTab('outfits')}
        >
          Outfit Posts
        </button>
        <button
          className={`px-4 py-2 rounded-full font-semibold ${tab === 'closet' ? 'bg-meta-pink text-white' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setTab('closet')}
        >
          Closet Items
        </button>
        <button
          className={`px-4 py-2 rounded-full font-semibold ${tab === 'wishlist' ? 'bg-meta-pink text-white' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setTab('wishlist')}
        >
          Wishlist
        </button>
        {tab === 'outfits' && (
          <Button
            className="ml-auto bg-meta-pink hover:bg-meta-pink/90 text-white px-6 py-2 rounded-full shadow-md"
            onClick={() => router.push('/closet/add-outfit')}
          >
            + New Outfit Post
          </Button>
        )}
      </div>
      {tab === 'outfits' ? (
        loadingOutfits ? (
          <p className="text-gray-400 text-lg">Loading outfit posts...</p>
        ) : (
          <div className="[column-count:1] sm:[column-count:2] lg:[column-count:3] xl:[column-count:4] [column-gap:2.5rem]">
            {outfitPosts.map(post => (
              <div
                key={post._id}
                className="mb-10 break-inside-avoid rounded-3xl shadow-xl bg-white overflow-hidden group relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                style={{ minHeight: 320 }}
              >
                <div className="relative w-full aspect-[3/4] bg-gray-100 cursor-pointer"
                  onClick={() => router.push(`/closet/${post._id}`)}
                >
                  <img
                    src={post.image_url || "/placeholder.svg"}
                    alt={post.caption || "Outfit post"}
                    className="object-cover rounded-3xl w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex flex-col gap-1"
                    style={{
                      background: 'rgba(255,255,255,0.35)',
                      backdropFilter: 'blur(12px)',
                      borderBottomLeftRadius: '1.5rem',
                      borderBottomRightRadius: '1.5rem',
                    }}
                  >
                    <div className="text-gray-900 font-bold text-lg truncate drop-shadow-sm">{post.caption}</div>
                  </div>
                  {/* Overlay edit/delete buttons for owner */}
                  {user && user.email === post.user_id && (
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <button
                        onClick={e => { e.stopPropagation(); router.push(`/closet/${post._id}/edit`) }}
                        className="bg-white/80 hover:bg-blue-600 text-gray-700 hover:text-white rounded-full p-2 shadow-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteOutfitPost(post._id) }}
                        className="bg-white/80 hover:bg-red-600 text-gray-700 hover:text-white rounded-full p-2 shadow-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        tab === 'closet' ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-12">
            {/* Left Column: Pinterest-style Masonry Grid, now more airy and modern */}
            <div>
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-extrabold tracking-tight">Your Closet</h1>
                <Button
                  className="bg-meta-pink hover:bg-meta-pink/90 text-white px-6 py-2 rounded-full shadow-md"
                  onClick={() => router.push("/add-item")}
                >
                  + Add Item
                </Button>
              </div>
              {loading ? (
                <p className="text-gray-400 text-lg">Loading your closet...</p>
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
                      {/* Actions: hidden until hover */}
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
                        <button
                          onClick={() => router.push(`/edit-item?id=${encodeURIComponent(item._id)}&title=${encodeURIComponent(item.name)}&category=${encodeURIComponent(item.category)}&price=${encodeURIComponent(item.price)}&link=${encodeURIComponent(item.link)}&thumbnail=${encodeURIComponent(item.thumbnail)}`)}
                          className="bg-white/80 hover:bg-blue-600 text-gray-700 hover:text-white rounded-full p-2 shadow-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="bg-white/80 hover:bg-red-600 text-gray-700 hover:text-white rounded-full p-2 shadow-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
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
        ) : (
          tab === 'wishlist' && (
            loadingWishlist ? (
              <p className="text-gray-400 text-lg">Loading wishlist...</p>
            ) : wishlistItems.length === 0 ? (
              <p>Your wishlist is empty. Start adding items you love!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {wishlistItems.map((item) => (
                  <div key={item._id} className="overflow-hidden rounded-3xl shadow-xl bg-white">
                    <div className="relative aspect-square">
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover rounded-t-3xl"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.category}</p>
                      <p className="font-medium mt-1">${item.price}</p>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {item.likes} likes · {item.saves} saves
                        </div>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Item →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )
        )
      )}
      {showCropper && cropperImage && (
        <CropperModal
          image={cropperImage}
          aspect={1}
          open={showCropper}
          onClose={() => setShowCropper(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  )
}
