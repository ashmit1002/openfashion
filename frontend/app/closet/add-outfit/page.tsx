"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import CropperModal from "@/components/ui/CropperModal";

interface OutfitComponentInput {
  name: string
  category: string
  notes?: string
  link?: string
  imageFile?: File | null
  imagePreview?: string | null
  position?: { x: number; y: number } // keep for backward compatibility
  region?: { x: number; y: number; width: number; height: number }
}

export default function AddOutfitPage() {
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [components, setComponents] = useState<OutfitComponentInput[]>([])
  const [tagForm, setTagForm] = useState<{ x: number; y: number } | null>(null)
  const [tagInput, setTagInput] = useState<{ name: string; category: string; notes: string; link: string; imageFile: File | null; imagePreview: string | null }>({ name: "", category: "", notes: "", link: "", imageFile: null, imagePreview: null })
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [showRegions, setShowRegions] = useState(true)
  const [showCropper, setShowCropper] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);

  // Add region to OutfitComponentInput
  interface OutfitComponentInput {
    name: string
    category: string
    notes?: string
    link?: string
    imageFile?: File | null
    imagePreview?: string | null
    position?: { x: number; y: number } // keep for backward compatibility
    region?: { x: number; y: number; width: number; height: number }
  }

  // Add region selection state
  const [regionStart, setRegionStart] = useState<{ x: number; y: number } | null>(null)
  const [regionCurrent, setRegionCurrent] = useState<{ x: number; y: number } | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawImage(URL.createObjectURL(file));
      setShowCropper(true);
    }
  }

  // Handle click on image to add a tag
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!imagePreview || !imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTagForm({ x, y })
    setTagInput({ name: "", category: "", notes: "", link: "", imageFile: null, imagePreview: null })
  }

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

  // Add tag to components
  const handleAddTag = async () => {
    if (!tagForm) return;
    let imageUrl = null;
    let imageFile = null;
    if (imagePreview) {
      const { url, file } = await cropAndUploadRegion(imagePreview, tagForm);
      imageUrl = url;
      imageFile = file;
    }
    setComponents([
      ...components,
      { ...tagInput, region: tagForm, imagePreview: imageUrl, imageFile }
    ]);
    setTagForm(null);
    setTagInput({ name: "", category: "", notes: "", link: "", imageFile: null, imagePreview: null });
  }

  // Remove a tag
  const handleRemoveTag = (idx: number) => {
    setComponents(components.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image) return
    setLoading(true)
    try {
      // 1. Upload outfit post (image + caption)
      const formData = new FormData()
      formData.append("image", image)
      formData.append("caption", caption)
      const res = await api.post("/closet/outfit/create", formData, { headers: { "Content-Type": "multipart/form-data" } })
      const postId = res.data.post._id
      // 2. Add components with positions
      for (const comp of components) {
        await api.post(`/closet/outfit/${postId}/add-component`, comp)
      }
      router.push("/closet")
    } catch (err) {
      alert("Failed to create outfit post.")
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Create New Outfit Post</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image and Tag Form Side by Side */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Image upload and tagging */}
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
                  {/* Render markers for each tag */}
                  {components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="absolute z-10"
                      style={{
                        left: `${comp.position?.x * 100}%`,
                        top: `${comp.position?.y * 100}%`,
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "auto"
                      }}
                      title={`${comp.name} (${comp.category})`}
                    >
                      <span className="w-4 h-4 bg-meta-pink rounded-full border-2 border-white block shadow-lg"></span>
                      <button
                        type="button"
                        className="text-xs text-red-500 mt-1"
                        onClick={e => { e.stopPropagation(); handleRemoveTag(idx) }}
                      >Remove</button>
                    </div>
                  ))}
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
                <h2 className="text-lg font-semibold mb-2">Add Component</h2>
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
                  {/* Show imagePreview (for new), image_url (for saved), or cropped region thumbnail */}
                  {comp.imagePreview && (
                    <img src={comp.imagePreview} alt="Component" className="w-12 h-12 object-cover rounded" />
                  )}
                  {!comp.imagePreview && comp.image_url && (
                    <img src={comp.image_url} alt="Component" className="w-12 h-12 object-cover rounded" />
                  )}
                  {comp.region && imagePreview && !comp.imagePreview && !comp.image_url && (
                    <div
                      className="w-12 h-12 rounded bg-gray-200 overflow-hidden border border-meta-pink"
                      style={{
                        backgroundImage: `url(${imagePreview})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: `${-comp.region.x * 100}% ${-comp.region.y * 100}%`,
                        backgroundSize: `${100 / comp.region.width}% ${100 / comp.region.height}%`,
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{comp.name} <span className="text-gray-500">({comp.category})</span></div>
                    {comp.notes && <div className="text-gray-400 text-sm">{comp.notes}</div>}
                    {comp.link && <a href={comp.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline break-all">{comp.link}</a>}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTag(idx)} className="text-meta-pink">Remove</Button>
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full bg-meta-pink text-white py-3 rounded-xl text-lg font-bold shadow-lg hover:bg-meta-pink/90" disabled={loading}>
            {loading ? "Posting..." : "Post Outfit"}
          </Button>
        </form>
        {/* Place the button below the image area, right-aligned */}
        <div className="flex justify-end mt-2 mb-6">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowRegions(v => !v)}>
            {showRegions ? 'Hide Regions' : 'Show Regions'}
          </Button>
        </div>
      </div>
      {/* Cropper Modal for main image */}
      <CropperModal
        image={rawImage}
        open={showCropper}
        aspect={3 / 4}
        onClose={() => setShowCropper(false)}
        onCropComplete={(croppedBlob, croppedUrl) => {
          setImagePreview(croppedUrl);
          setImage(new File([croppedBlob], "cropped.png", { type: "image/png" }));
        }}
      />
    </div>
  )
} 