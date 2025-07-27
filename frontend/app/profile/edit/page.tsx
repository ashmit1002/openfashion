'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import api, { setAuthToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
  })
  const [usernameData, setUsernameData] = useState({
    username: '',
    isAvailable: null as boolean | null,
    message: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        bio: user.bio || '',
      })
      setUsernameData({
        username: user.username || '',
        isAvailable: null,
        message: '',
      })
    }
  }, [user])

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === user?.username) {
      setUsernameData(prev => ({ ...prev, isAvailable: null, message: '' }))
      return
    }

    setUsernameChecking(true)
    try {
      const token = localStorage.getItem('token')
      if (token) setAuthToken(token)
      const response = await api.get(`/users/user/username/check/${username}`)
      setUsernameData(prev => ({
        ...prev,
        isAvailable: response.data.available,
        message: response.data.reason,
      }))
    } catch (error) {
      setUsernameData(prev => ({
        ...prev,
        isAvailable: false,
        message: 'Error checking username availability',
      }))
    } finally {
      setUsernameChecking(false)
    }
  }

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const username = e.target.value
    setUsernameData(prev => ({ ...prev, username }))
    
    // Debounce username availability check
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(username)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameData.isAvailable) return

    setUsernameLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (token) setAuthToken(token)
      await api.put('/users/user/username', { username: usernameData.username })
      toast.success('Username updated successfully')
      await refreshUser() // Refresh user data to get updated username
      setUsernameData(prev => ({ ...prev, isAvailable: null, message: '' }))
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update username')
    } finally {
      setUsernameLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (token) setAuthToken(token)
      await api.put('/users/user/profile', formData)
      toast.success('Profile updated successfully')
      router.push(`/profile/${user?.username}`)
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Please log in to edit your profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Username Change Section */}
      <Card>
        <CardHeader>
          <CardTitle>Change Username</CardTitle>
          <CardDescription>Update your username (3-30 characters, letters, numbers, and underscores only)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <div className="relative">
                <Input
                  id="username"
                  value={usernameData.username}
                  onChange={handleUsernameChange}
                  placeholder="Enter new username"
                  className={`pr-10 ${
                    usernameData.isAvailable === true ? 'border-green-500' : 
                    usernameData.isAvailable === false ? 'border-red-500' : ''
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameChecking ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : usernameData.isAvailable === true ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : usernameData.isAvailable === false ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              </div>
              {usernameData.message && (
                <p className={`text-sm ${
                  usernameData.isAvailable === true ? 'text-green-600' : 
                  usernameData.isAvailable === false ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {usernameData.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={usernameLoading || !usernameData.isAvailable || usernameData.username === user.username}
              className="w-full bg-meta-pink hover:bg-meta-pink/90 text-white"
            >
              {usernameLoading ? 'Updating...' : 'Update Username'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Profile Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="display_name" className="text-sm font-medium">
                Display Name
              </label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="Your display name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">
                Bio
              </label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/profile/${user.username}`)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-meta-pink hover:bg-meta-pink/90 text-white"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 