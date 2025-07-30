"use client"

import { useState, useEffect } from "react"
import { Camera, Image as ImageIcon, Upload } from "lucide-react"
import { useMobileDetection, useIOSDetection } from "@/lib/hooks"

interface MobileImageUploadProps {
  onImageSelect: (file: File) => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
  showPreview?: boolean
  previewUrl?: string | null
  onPreviewClick?: () => void
}

export default function MobileImageUpload({
  onImageSelect,
  disabled = false,
  className = "",
  children,
  showPreview = false,
  previewUrl = null,
  onPreviewClick
}: MobileImageUploadProps) {
  const isMobile = useMobileDetection()
  const isIOS = useIOSDetection()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0])
    }
  }

  if (showPreview && previewUrl) {
    return (
      <div 
        className={`relative ${className}`}
        onClick={onPreviewClick}
      >
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full h-full object-cover rounded-md cursor-pointer"
        />
      </div>
    )
  }

  if (isMobile) {
    if (isIOS) {
      // For iOS Safari, use a single input without capture attribute
      // This will show both camera and photo library options in the native picker
      return (
        <label className={`meta-button cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
          <Camera className="h-4 w-4" />
          Take Photo or Choose from Library
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </label>
      )
    } else {
      // For Android and other mobile devices, provide separate options
      return (
        <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
          <label className="meta-button cursor-pointer flex items-center justify-center gap-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
            <Camera className="h-4 w-4" />
            Take Photo
            <input
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={disabled}
            />
          </label>
          <label className="meta-button cursor-pointer flex items-center justify-center gap-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
            <ImageIcon className="h-4 w-4" />
            Choose Photo
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={disabled}
            />
          </label>
        </div>
      )
    }
  }

  // Desktop fallback
  return (
    <label className={`meta-button cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
      <Upload className="h-4 w-4" />
      {children || "Upload Image"}
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </label>
  )
} 