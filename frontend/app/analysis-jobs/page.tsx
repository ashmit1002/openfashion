"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, AlertTriangle, Eye } from "lucide-react"
import { toast } from "sonner"

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

export default function AnalysisJobsPage() {
  const [jobs, setJobs] = useState<JobStatus[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("You must be logged in to view analysis jobs.")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/jobs?limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      } else {
        toast.error("Failed to fetch analysis jobs.")
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
      toast.error("Error fetching analysis jobs.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Queued"
      case "processing":
        return "Processing"
      case "completed":
        return "Completed"
      case "failed":
        return "Failed"
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const viewResults = (job: JobStatus) => {
    if (job.status === "completed" && job.result) {
      // Store the result in localStorage and redirect to home page
      localStorage.setItem("pendingAnalysisResult", JSON.stringify(job.result))
      window.location.href = "/"
    } else {
      toast.error("No results available for this job.")
    }
  }

  // Add job removal logic
  const removeJob = async (job_id: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("You must be logged in to remove jobs.")
        return
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/job/${job_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        toast.success("Job removed from history.")
        setJobs(jobs.filter(job => job.job_id !== job_id))
      } else {
        const data = await response.json()
        toast.error(data.detail || "Failed to remove job.")
      }
    } catch (error) {
      toast.error("Error removing job.")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-meta-pink"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis History</h1>
          <p className="text-gray-600">View your recent image analysis jobs and results.</p>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis jobs yet</h3>
            <p className="text-gray-600 mb-6">Start by uploading an image for analysis on the home page.</p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Home
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.job_id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {getStatusText(job.status)}
                        </span>
                        {job.status === "completed" && job.result && (
                          <span className="text-sm text-gray-500">
                            ({job.result.components?.length || 0} items found)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {formatDate(job.created_at)}
                      </div>
                      {job.error && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {job.error}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {job.status === "completed" && job.result && (
                      <Button
                        size="sm"
                        onClick={() => viewResults(job)}
                        className="flex items-center space-x-1 bg-meta-pink text-white hover:bg-meta-pink/90"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Results</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchJobs()}
                    >
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeJob(job.job_id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 