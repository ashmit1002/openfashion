"use client"
import { useAuth } from '@/contexts/AuthContext'
import { Crown } from 'lucide-react'

export default function PremiumBanner() {
  const { user } = useAuth();
  if (user?.subscription_status !== 'premium') return null;
  return (
    <div className="w-full bg-white text-center py-2 font-bold text-lg shadow-md z-50 border-b-4 border-pink-300">
      <span className="text-meta-pink" style={{ color: '#ec4899' }}>
        <Crown className="inline-block mr-1 mb-1 h-6 w-6 text-meta-pink align-middle" />
        You are a <span className="underline">Premium</span> member! Enjoy unlimited features.
      </span>
    </div>
  );
} 