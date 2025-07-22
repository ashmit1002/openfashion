"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"

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
];

// Add a helper to crop and upload the region
async function cropAndUploadRegion(imageUrl: string, region: { x: number; y: number; width: number; height: number }): Promise<{ url: string, file: File }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const sx = region.x * img.width;
      const sy = region.y * img.height;
      const sw = region.width * img.width;
      const sh = region.height * img.height;
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      canvas.toBlob(async (blob) => {
        if (!blob) return reject('Failed to crop');
        const file = new File([blob], 'cropped.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/upload/upload-thumbnail', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        resolve({ url: res.data.url, file });
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

export default function EditOutfitPage() {
  const { postId } = useParams() as { postId: string }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [components, setComponents] = useState<any[]>([])
  const [tagForm, setTagForm] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [tagInput, setTagInput] = useState<{ name: string; category: string; notes: string; link: string; imageFile: File | null; imagePreview: string | null; image_url: string | null }>({ name: "", category: "", notes: "", link: "", imageFile: null, imagePreview: null, image_url: null })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Add region to OutfitComponentInput
  const [regionStart, setRegionStart] = useState<{ x: number; y: number } | null>(null)
  const [regionCurrent, setRegionCurrent] = useState<{ x: number; y: number } | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [showRegions, setShowRegions] = useState(true)
  const [editIdx, setEditIdx] = useState<number | null>(null);

  // Mouse events for region selection
  const handleImageMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!imagePreview || !imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setRegionStart({ x, y })
    setRegionCurrent({ x, y })
  }
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!regionStart || !imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setRegionCurrent({ x, y })
  }
  const handleImageMouseUp = () => {
    if (!regionStart || !regionCurrent) return
    // Calculate region
    const x = Math.min(regionStart.x, regionCurrent.x)
    const y = Math.min(regionStart.y, regionCurrent.y)
    const width = Math.abs(regionCurrent.x - regionStart.x)
    const height = Math.abs(regionCurrent.y - regionStart.y)
    setTagForm({ x, y, width, height })
    setRegionStart(null)
    setRegionCurrent(null)
  }

  // Load post data
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/closet/outfit/${postId}`)
        const post = res.data
        setCaption(post.caption || "")
        setImagePreview(post.image_url)
        setComponents(post.components.map((c: any) => ({
          ...c,
          imageFile: null,
          imagePreview: c.image_url || null
        })))
      } catch (err) {
        alert("Failed to load post.")
        router.push("/closet")
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [postId, router])

  // Image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Tagging logic
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!imagePreview || !imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTagForm({ x, y, width: 0, height: 0 })
    setTagInput({ name: "", category: "", notes: "", link: "", imageFile: null, imagePreview: null, image_url: null })
  }

  // In the tag form, update handleAddTag to always set image_url and use it for display
  const handleAddTag = async () => {
    if (!tagForm) return;
    let imageUrl = tagInput.image_url || null;
    let imageFile = null;
    if (tagInput.imageFile) {
      const formData = new FormData();
      formData.append("file", tagInput.imageFile);
      const res = await api.post("/upload/upload-thumbnail", formData, { headers: { "Content-Type": "multipart/form-data" } });
      imageUrl = res.data.url;
      imageFile = tagInput.imageFile;
    } else if (tagInput.imagePreview && !imageUrl) {
      imageUrl = tagInput.imagePreview;
    }
    const updatedComponent = {
      ...tagInput,
      region: tagForm,
      image_url: imageUrl,
      imageFile: imageFile,
      imagePreview: imageUrl
    };
    if (editIdx !== null) {
      // Update in place
      setComponents(components.map((c, i) => (i === editIdx ? updatedComponent : c)));
      setEditIdx(null);
    } else {
      // Add new
      setComponents([
        ...components,
        updatedComponent
      ]);
    }
    setTagForm(null);
    setTagInput({ name: "", category: "", notes: "", link: "", imageFile: null, imagePreview: null, image_url: null });
  };

  const handleRemoveTag = (idx: number) => {
    setComponents(components.filter((_, i) => i !== idx))
  }

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Upload new image if changed, get URL
      let imageUrl = imagePreview;
      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        const res = await api.post("/upload/upload-thumbnail", formData, { headers: { "Content-Type": "multipart/form-data" } });
        imageUrl = res.data.url;
      }
      // 2. For each component, upload new image if needed and set image_url
      const updatedComponents = await Promise.all(components.map(async (comp) => {
        if (comp.imageFile) {
          const formData = new FormData();
          formData.append("file", comp.imageFile);
          const res = await api.post("/upload/upload-thumbnail", formData, { headers: { "Content-Type": "multipart/form-data" } });
          return { ...comp, image_url: res.data.url };
        }
        return comp;
      }));
      // 3. Update post with new image_url and caption
      await api.put(`/closet/outfit/${postId}`, { caption, image_url: imageUrl });
      // 4. Replace all components at once
      await api.put(`/closet/outfit/${postId}/replace-components`, updatedComponents);
      router.push(`/closet/${postId}`);
    } catch (err) {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Edit Outfit Post</h1>
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-8">
            {/* Place the button below the image area, right-aligned */}
            <div className="flex justify-end mt-2 mb-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowRegions(v => !v)}>
                {showRegions ? 'Hide Regions' : 'Show Regions'}
              </Button>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Image and tagging */}
              <div
                ref={imageContainerRef}
                className="relative w-full md:w-[520px] h-[650px] bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-meta-pink flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow mx-auto mb-4"
                onMouseDown={imagePreview ? handleImageMouseDown : undefined}
                onMouseMove={imagePreview && regionStart ? handleImageMouseMove : undefined}
                onMouseUp={imagePreview && regionStart ? handleImageMouseUp : undefined}
                onClick={!imagePreview ? () => fileInputRef.current?.click() : undefined}
                style={{ cursor: imagePreview ? (regionStart ? "crosshair" : "crosshair") : "pointer" }}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                    {/* Render region overlays for each tag */}
                    {showRegions && components.map((comp, idx) => comp.region && (
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
                    {/* Render region being drawn */}
                    {regionStart && regionCurrent && (
                      <div
                        className="absolute z-20 border-2 border-blue-500 bg-blue-300/20 rounded"
                        style={{
                          left: `${Math.min(regionStart.x, regionCurrent.x) * 100}%`,
                          top: `${Math.min(regionStart.y, regionCurrent.y) * 100}%`,
                          width: `${Math.abs(regionCurrent.x - regionStart.x) * 100}%`,
                          height: `${Math.abs(regionCurrent.y - regionStart.y) * 100}%`
                        }}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 text-lg">Click to upload image</span>
                )}
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageChange} />
              </div>
              {/* Tag form on the right */}
              {tagForm && (
                <div className="w-full md:w-[340px] bg-gray-50 rounded-xl shadow-lg border border-meta-pink p-6 flex flex-col gap-2 sticky top-8">
                  <h2 className="text-lg font-semibold mb-2">Edit Component</h2>
                  <input
                    type="text"
                    className="rounded border px-2 py-1"
                    placeholder="Component name"
                    value={tagInput.name}
                    onChange={e => setTagInput({ ...tagInput, name: e.target.value })}
                    required
                  />
                  <select
                    className="rounded border px-2 py-1"
                    value={tagInput.category}
                    onChange={e => setTagInput({ ...tagInput, category: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select category</option>
                    {CATEGORY_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="rounded border px-2 py-1"
                    placeholder="Notes (optional)"
                    value={tagInput.notes}
                    onChange={e => setTagInput({ ...tagInput, notes: e.target.value })}
                  />
                  <input
                    type="text"
                    className="rounded border px-2 py-1"
                    placeholder="Link (optional)"
                    value={tagInput.link}
                    onChange={e => setTagInput({ ...tagInput, link: e.target.value })}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="rounded border px-2 py-1"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setTagInput({
                        ...tagInput,
                        imageFile: file,
                        imagePreview: file ? URL.createObjectURL(file) : null
                      });
                    }}
                  />
                  {tagInput.imagePreview && (
                    <img src={tagInput.imagePreview} alt="Component preview" className="w-16 h-16 object-cover rounded mt-2" />
                  )}
                  <div className="flex gap-2 mt-1">
                    <Button type="button" size="sm" className="bg-meta-pink text-white" onClick={handleAddTag}>Add</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setTagForm(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
            {/* Caption input */}
            <input
              type="text"
              className="w-full mt-4 rounded-lg border border-gray-200 focus:border-meta-pink focus:ring-meta-pink px-3 py-2"
              placeholder="Add a caption (optional)"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              maxLength={120}
            />
            {/* List of tagged components */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Tagged Components</h2>
              <div className="space-y-2">
                {components.map((comp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center bg-gray-50 rounded-lg px-4 py-2 shadow-sm gap-4"
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
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      setEditIdx(idx);
                      setTagInput({
                        name: comp.name,
                        category: comp.category,
                        notes: comp.notes || "",
                        link: comp.link || "",
                        imageFile: null,
                        imagePreview: comp.image_url || null,
                        image_url: comp.image_url || null
                      });
                      setTagForm(comp.region || null);
                    }} className="mr-2">Edit</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTag(idx)} className="text-meta-pink">Remove</Button>
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full bg-meta-pink text-white py-3 rounded-xl text-lg font-bold shadow-lg hover:bg-meta-pink/90" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
} 