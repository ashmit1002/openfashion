'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/wishlist/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }
      
      const data = await response.json();
      setIsInWishlist(Array.isArray(data) && data.some((wishlistItem: any) => wishlistItem.link === item.link));
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
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to save items to your wishlist');
        return;
      }

      if (isInWishlist) {
        // Find the item ID first
        const response = await fetch('/api/wishlist/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch wishlist');
        }
        
        const items = await response.json();
        const wishlistItem = items.find((i: any) => i.link === item.link);
        
        if (wishlistItem) {
          await fetch('/api/wishlist/delete', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              link: item.link,
              category: item.category
            })
          });
          setIsInWishlist(false);
          toast.success('Removed from wishlist');
        }
      } else {
        // Create FormData for the request
        const formData = new FormData();
        formData.append('name', item.title);
        formData.append('category', item.category);
        formData.append('price', item.price.toString());
        formData.append('link', item.link);
        
        // Convert thumbnail URL to File object
        try {
          const thumbnailResponse = await fetch(item.thumbnail);
          if (!thumbnailResponse.ok) throw new Error('Failed to fetch thumbnail');
          const thumbnailBlob = await thumbnailResponse.blob();
          const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
          formData.append('thumbnail', thumbnailFile);

          const response = await fetch('/api/wishlist/add', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error('Failed to add to wishlist');
          }

          setIsInWishlist(true);
          toast.success('Added to wishlist');
        } catch (error) {
          console.error('Error processing thumbnail:', error);
          toast.error('Failed to process image');
          return;
        }
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