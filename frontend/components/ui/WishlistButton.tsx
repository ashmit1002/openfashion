'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { trackInteraction } from '@/lib/api';

interface WishlistButtonProps {
  item: {
    title: string;
    category: string;
    price: number;
    link: string;
    thumbnail: string;
    tags?: string[];
  };
  className?: string;
}

export function WishlistButton({ item, className = '' }: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if item is in wishlist on component mount
    checkWishlistStatus();
  }, []);

  const checkWishlistStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/wishlist');
      const data = await response.json();
      setIsInWishlist(data.some((wishlistItem: any) => wishlistItem.link === item.link));
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to save items to your wishlist');
      return;
    }

    try {
      if (isInWishlist) {
        const response = await fetch('/api/wishlist');
        const items = await response.json();
        const wishlistItem = items.find((i: any) => i.link === item.link);

        if (wishlistItem) {
          await fetch(`/api/wishlist/${wishlistItem._id}`, {
            method: 'DELETE',
          });
          setIsInWishlist(false);
          toast.success('Removed from wishlist');
          await trackInteraction('wishlist_remove', user.id, { link: item.link });
        }
      } else {
        await fetch('/api/wishlist/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...item,
            user_id: user.id,
            source: 'User Save'
          }),
        });
        setIsInWishlist(true);
        toast.success('Added to wishlist');
        await trackInteraction('wishlist_add', user.id, { link: item.link });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`w-6 h-6 ${isInWishlist ? 'fill-current text-red-500' : ''}`}
      />
    </button>
  );
} 