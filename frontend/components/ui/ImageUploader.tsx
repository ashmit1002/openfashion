"use client"

import { useState, useEffect } from "react"
import { Upload, Camera, X, Crown, AlertCircle, Clock, CheckCircle, AlertTriangle, Image as ImageIcon } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import CropperModal from './CropperModal'
import { trackImageUpload, trackAnalysisComplete, trackError } from "@/lib/analytics"
import { useMobileDetection, useIOSDetection } from "@/lib/hooks"

interface AnalysisResult {
  annotated_image_base64: string
  components: Array<{
    name: string
    dominant_color: string
    original_image_url: string
    bg_removed_url: string
    clothing_items: Array<{
      title: string
      thumbnail: string
      price: string
      link: string
    }>
    similar_queries?: string[]
  }>
}

interface JobStatus {
  job_id: string
  status: "pending" | "processing" | "completed" | "failed"
  result?: AnalysisResult
  error?: string
  created_at: string
  updated_at: string
}

interface ImageUploaderProps {
  onAnalysisComplete: (result: AnalysisResult) => void
}

export default function ImageUploader({ onAnalysisComplete }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { user, refreshUser } = useAuth()
  const [showCropper, setShowCropper] = useState(false)
  const [cropperImage, setCropperImage] = useState<string | null>(null)
  const [aspect, setAspect] = useState<number>(3/4)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const isMobile = useMobileDetection()
  const isIOS = useIOSDetection()
  
  const aspectOptions = [
    { label: '1:1', value: 1 },
    { label: '3:4', value: 3/4 },
    { label: '4:3', value: 4/3 },
    { label: '16:9', value: 16/9 },
  ]

  // Poll for job status
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (currentJobId && !isPolling) {
      setIsPolling(true)
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem("token")
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/job/${currentJobId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          // Handle token refresh if needed
          if (response.status === 401) {
            try {
              const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('token', refreshData.access_token);
                
                // Retry the job status check with the new token
                const retryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/job/${currentJobId}`, {
                  headers: {
                    Authorization: `Bearer ${refreshData.access_token}`,
                  },
                });
                
                if (retryResponse.ok) {
                  const job: JobStatus = await retryResponse.json();
                  setJobStatus(job);
                  
                  if (job.status === "completed" && job.result) {
                    setIsPolling(false);
                    setCurrentJobId(null);
                    
                    // Track analysis completion
                    trackAnalysisComplete(job.result.components.length, user?.subscription_status === 'premium');
                    
                    onAnalysisComplete(job.result);
                    await refreshUser?.();
                    
                    // Show success message
                    if (user && user.subscription_status === 'free') {
                      toast.success("Analysis complete!", {
                        description: `${user.weekly_uploads_used + 1}/3 uploads used this week.`,
                      });
                    } else {
                      toast.success("Analysis complete!");
                    }
                  } else if (job.status === "failed") {
                    setIsPolling(false);
                    setCurrentJobId(null);
                    trackError('analysis_failed', job.error || 'Unknown error');
                    toast.error("Analysis failed", {
                      description: job.error || "Please try again."
                    });
                  }
                }
                return;
              } else {
                // Refresh failed, stop polling
                setIsPolling(false);
                setCurrentJobId(null);
                return;
              }
            } catch (refreshError) {
              // Refresh failed, stop polling
              setIsPolling(false);
              setCurrentJobId(null);
              return;
            }
          }
          
          if (response.ok) {
            const job: JobStatus = await response.json()
            setJobStatus(job)
            
            if (job.status === "completed" && job.result) {
              setIsPolling(false)
              setCurrentJobId(null)
              
              // Track analysis completion
              trackAnalysisComplete(job.result.components.length, user?.subscription_status === 'premium')
              
              onAnalysisComplete(job.result)
              await refreshUser?.()
              
              // Show success message
              if (user && user.subscription_status === 'free') {
                toast.success("Analysis complete!", {
                  description: `${user.weekly_uploads_used + 1}/3 uploads used this week.`,
                })
              } else {
                toast.success("Analysis complete!")
              }
            } else if (job.status === "failed") {
              setIsPolling(false)
              setCurrentJobId(null)
              trackError('analysis_failed', job.error || 'Unknown error')
              toast.error("Analysis failed", {
                description: job.error || "Please try again."
              })
            }
          }
        } catch (error) {
          console.error("Error polling job status:", error)
        }
      }, 2000) // Poll every 2 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [currentJobId, isPolling, onAnalysisComplete, refreshUser, user])

  const handleUpload = async (file: File) => {
    if (!file) return

    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("You must be logged in to upload.")
      return
    }

    const formData = new FormData()
    formData.append("image", file)

    setIsUploading(true)

    try {
      // Track image upload
      trackImageUpload('clothing', user?.subscription_status === 'premium')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Handle token refresh if needed
      if (response.status === 401) {
        try {
          const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('token', refreshData.access_token);
            
            // Retry the upload with the new token
            const retryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/`, {
              method: "POST",
              body: formData,
              headers: {
                Authorization: `Bearer ${refreshData.access_token}`,
              },
            });
            
            if (!retryResponse.ok) {
              const errorData = await retryResponse.json();
              if (retryResponse.status === 403) {
                // Upload limit reached
                toast.error("Upload limit reached!", {
                  description: "Upgrade to Premium for unlimited uploads.",
                  action: {
                    label: "Upgrade",
                    onClick: () => window.location.href = "/premium"
                  }
                })
                return
              }
              throw new Error(errorData.detail?.message || "Upload failed")
            }
            
            const data = await retryResponse.json();
            setCurrentJobId(data.job_id);
            setJobStatus({
              job_id: data.job_id,
              status: "pending",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            toast.success("Image uploaded!", {
              description: "Analysis in progress. Results will appear in the Analysis History tab. You can leave this page and return later."
            });
            return;
          } else {
            // Refresh failed, redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403) {
          // Upload limit reached
          toast.error("Upload limit reached!", {
            description: "Upgrade to Premium for unlimited uploads.",
            action: {
              label: "Upgrade",
              onClick: () => window.location.href = "/premium"
            }
          })
          return
        }
        throw new Error(errorData.detail?.message || "Upload failed")
      }

      const data = await response.json()
      setCurrentJobId(data.job_id)
      setJobStatus({
        job_id: data.job_id,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      toast.success("Image uploaded!", {
        description: "Analysis in progress. Results will appear in the Analysis History tab. You can leave this page and return later."
      })
      
    } catch (error) {
      console.error("Error uploading image:", error)
      trackError('upload_failed', error instanceof Error ? error.message : 'Unknown error')
      toast.error("Error uploading image. Please try again.")
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
      const reader = new FileReader()
      reader.onload = () => {
        setCropperImage(reader.result as string)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedBlob: Blob, croppedUrl: string) => {
    setSelectedFile(new File([croppedBlob], 'cropped-image.png', { type: 'image/png' }))
    setPreviewUrl(croppedUrl)
    setShowCropper(false)
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
    setCurrentJobId(null)
    setJobStatus(null)
    setIsPolling(false)
  }

  const isPremium = user?.subscription_status === 'premium'
  const uploadsRemaining = user ? 3 - user.weekly_uploads_used : 0

  const getStatusIcon = () => {
    if (!jobStatus) return null
    
    switch (jobStatus.status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "processing":
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "failed":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    if (!jobStatus) return ""
    
    switch (jobStatus.status) {
      case "pending":
        return "Queued for analysis..."
      case "processing":
        return "Analyzing your image..."
      case "completed":
        return "Analysis complete!"
      case "failed":
        return "Analysis failed"
      default:
        return ""
    }
  }

  return (
    <div className="meta-card animate-slide-up">
      {/* Cropper Modal */}
      {showCropper && cropperImage && (
        <CropperModal
          image={cropperImage}
          aspect={aspect}
          open={showCropper}
          onClose={() => setShowCropper(false)}
          onCropComplete={handleCropComplete}
        />
      )}
      {/* Aspect Ratio Selector */}
      {showCropper && (
        <div className="flex justify-center gap-2 mb-4">
          {aspectOptions.map(opt => (
            <button
              key={opt.label}
              className={`px-3 py-1 rounded-full border ${aspect === opt.value ? 'bg-meta-pink text-white' : 'bg-white text-meta-pink border-meta-pink'}`}
              onClick={() => setAspect(opt.value)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {/* Upload Limit Warning for Free Users */}
      {!isPremium && user && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Free Plan Upload Limit
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                You have {uploadsRemaining} uploads remaining this week. 
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-yellow-800 underline ml-1"
                  onClick={() => window.location.href = "/premium"}
                >
                  Upgrade to Premium
                </Button> for unlimited uploads.
              </p>
            </div>
          </div>
        </div>
      )}

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
                <p className="text-meta-text-secondary text-sm">
                  {isMobile ? "Take a photo or choose from your camera roll" : "Take a photo or upload an image to analyze"}
                </p>
              </div>
              
              {/* Mobile-specific upload options */}
              {isMobile ? (
                <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full max-w-xs">
                  {isIOS ? (
                    // For iOS Safari, use a single input without capture attribute
                    <label className="meta-button cursor-pointer flex items-center justify-center gap-2 flex-1">
                      <Camera className="h-4 w-4" />
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </label>
                  ) : (
                    // For Android and other mobile devices, provide separate options
                    <>
                      <label className="meta-button cursor-pointer flex items-center justify-center gap-2 flex-1">
                        <Camera className="h-4 w-4" />
                        Take Photo
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                      </label>
                      <label className="meta-button cursor-pointer flex items-center justify-center gap-2 flex-1">
                        <ImageIcon className="h-4 w-4" />
                        Choose Photo
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                      </label>
                    </>
                  )}
                </div>
              ) : (
                /* Desktop upload option */
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <label className="meta-button cursor-pointer flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Upload
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              )}
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
              <div className="flex items-center gap-2 text-meta-text-secondary text-sm">
                {getStatusIcon()}
                <span>{getStatusText()}</span>
              </div>
              <button
                type="submit"
                disabled={isUploading || (jobStatus?.status === "processing")}
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
                    Uploading...
                  </div>
                ) : jobStatus && jobStatus.status === "processing" ? (
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
