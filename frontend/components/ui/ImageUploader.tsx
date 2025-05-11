"use client"

import { useState } from "react"
import { Upload, Camera, X } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface AnalysisResult {
  annotated_image_base64: string
  components: Array<{
    name: string
    dominant_color: string
    clothing_items: Array<{
      title: string
      thumbnail: string
      price: string
      link: string
    }>
  }>
}

interface ImageUploaderProps {
  onAnalysisComplete: (result: AnalysisResult) => void
}

export default function ImageUploader({ onAnalysisComplete }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  const handleUpload = async (file: File) => {
    if (!file) return

    const token = localStorage.getItem("token")
    if (!token) {
      alert("You must be logged in to upload.")
      return
    }

    const formData = new FormData()
    formData.append("image", file)
    formData.append("is_owner", isOwner.toString())

    setIsUploading(true)

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data: AnalysisResult = await response.json()
      onAnalysisComplete(data)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error uploading image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setSelectedFile(file)
      createPreview(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      createPreview(file)
    }
  }

  const createPreview = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFile) {
      handleUpload(selectedFile)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  return (
    <div className="meta-card animate-slide-up">
      <form onSubmit={handleSubmit} onDragEnter={handleDrag} className="w-full">
        {!previewUrl ? (
          <div
            className={`border-2 ${
              dragActive ? "border-meta-pink bg-meta-pink/5" : "border-dashed border-gray-300"
            } rounded-meta p-8 text-center transition-all duration-300`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="h-7 w-7 text-meta-pink" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Upload your outfit</h3>
                <p className="text-meta-text-secondary text-sm">Take a photo or upload an image to analyze</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <label className="meta-button cursor-pointer flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Upload
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Switch id="is-you" checked={isOwner} onCheckedChange={setIsOwner} disabled={isUploading} />
                <Label htmlFor="is-you">Is this you?</Label>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={previewUrl || "/placeholder.svg"}
              alt="Preview"
              className="w-full max-h-[400px] object-contain rounded-t-meta"
            />
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={resetForm}
                className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 bg-white space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="is-you" checked={isOwner} onCheckedChange={setIsOwner} disabled={isUploading} />
                <Label htmlFor="is-you">Is this you?</Label>
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className="meta-button w-full text-center flex justify-center items-center"
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Analyzing...
                  </div>
                ) : (
                  "Analyze Outfit"
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
