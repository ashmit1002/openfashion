"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/lib/api"
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

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

export default function ProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ display_name: '', avatar_url: '', bio: '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/user/${username}`)
      setProfile(response.data)
      if (user) {
        setIsFollowing(user.following.includes(username as string))
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line
  }, [username, user])

  const handleFollow = async () => {
    if (!user) return
    try {
        await api.post(`/users/user/follow/${username}`)
      setIsFollowing(true)
      setProfile(prev => prev ? { ...prev, followers: [...prev.followers, user.email] } : null)
    } catch (error) {
      console.error("Error following user:", error)
    }
  }

  const handleUnfollow = async () => {
    if (!user) return
    try {
      await api.post(`/users/user/unfollow/${username}`)
      setIsFollowing(false)
      setProfile(prev => prev ? { ...prev, followers: prev.followers.filter(f => f !== user.email) } : null)
    } catch (error) {
      console.error("Error unfollowing user:", error)
    }
  }

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
        setAvatarPreview(reader.result as string);
        setEditData(prev => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.put('/users/user/profile', editData);
      toast.success("Profile updated!", { style: { background: "#e9fbe9", color: "#1a7f37" } })
      setEditMode(false);
      fetchProfile();
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

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!profile) {
    return <div className="p-8 text-center">Profile not found</div>
  }

  const isOwnProfile = user && user.username === profile.username;

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md relative flex flex-col gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center text-5xl font-bold text-meta-pink mb-2 overflow-hidden relative transition-all duration-200">
            {avatarPreview || profile.avatar_url ? (
              <img src={avatarPreview || profile.avatar_url} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              (profile.display_name?.[0] || profile.username[0] || "A").toUpperCase()
            )}
            {editMode && isOwnProfile && (
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
          <div className="text-xl font-bold text-gray-900 text-center">{profile.display_name || profile.username}</div>
          <div className="text-gray-500 text-center text-sm mb-1">@{profile.username}</div>
        </div>
        {/* Divider */}
        <div className="border-t border-gray-100 my-2" />
        {/* Stats */}
        <div className="flex justify-center gap-8 text-center">
            <div>
              <span className="font-semibold text-gray-900">{profile.followers.length}</span>
              <span className="text-gray-500"> Followers</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">{profile.following.length}</span>
              <span className="text-gray-500"> Following</span>
            </div>
          </div>
        {/* Bio */}
        {profile.bio && !editMode && (
          <div className="text-gray-600 text-center text-base whitespace-pre-line">{profile.bio}</div>
        )}
        {/* Actions */}
        <div className={`flex ${isOwnProfile ? 'justify-end' : 'flex-col gap-2 sm:flex-row sm:justify-center'} gap-2 mt-2`}>
          {!isOwnProfile && (
            <Button
              onClick={() => isFollowing ? handleUnfollow() : handleFollow()}
              className={isFollowing ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-meta-pink text-white hover:bg-meta-pink/90"}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
          <Button
            onClick={() => router.push(`/profile/${profile.username}/closet`)}
            className="bg-meta-pink text-white hover:bg-meta-pink/90"
          >
            View Closet
          </Button>
          {isOwnProfile && !editMode && (
            <Button
              type="button"
              className="bg-gray-100 text-meta-pink hover:bg-meta-pink/10 border border-meta-pink"
              onClick={handleEdit}
            >
              Edit Profile
            </Button>
          )}
        </div>
        {/* Edit Form (only for own profile and in edit mode) */}
        {isOwnProfile && editMode && (
          <form className="w-full space-y-4 mt-2" onSubmit={handleSave}>
            <div className="flex flex-col gap-2">
              <input
                className="rounded-lg border border-gray-200 focus:border-meta-pink focus:ring-meta-pink px-3 py-2"
                placeholder="Display Name"
                value={editData.display_name}
                onChange={e => setEditData({ ...editData, display_name: e.target.value })}
                disabled={!editMode}
              />
              <input
                className="rounded-lg border border-gray-200 focus:border-meta-pink focus:ring-meta-pink px-3 py-2"
                placeholder="Avatar URL"
                value={editData.avatar_url}
                onChange={e => setEditData({ ...editData, avatar_url: e.target.value })}
                disabled={!editMode}
              />
            <textarea
                className="rounded-lg border border-gray-200 focus:border-meta-pink focus:ring-meta-pink px-3 py-2 min-h-[60px]"
              placeholder="Bio"
              value={editData.bio}
              onChange={e => setEditData({ ...editData, bio: e.target.value })}
              disabled={!editMode}
              rows={3}
            />
            </div>
            <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleCancel} className="border-gray-300">Cancel</Button>
                  <Button type="submit" className="bg-meta-pink text-white hover:bg-meta-pink/90">Save</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
} 