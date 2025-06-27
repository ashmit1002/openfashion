'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { setAuthToken } from '@/lib/api';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { WishlistButton } from '@/components/ui/WishlistButton';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface WishlistItem {
  _id: string;
  title: string;
  category: string;
  price: number;
  link: string;
  thumbnail: string;
  likes: number;
  saves: number;
  tags: string[];
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchWishlistItems = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthToken(token);
    setLoading(true);
    try {
      const response = await api.get('/wishlist/');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthToken(token);
    
    try {
      // First verify the item exists in our state
      const itemToRemove = items.find(item => item._id === itemId);
      if (!itemToRemove) {
        toast.error('Item not found');
        return;
      }

      // Make the API call to delete using the item's link and category
      await api.delete('/wishlist/delete', {
        params: {
          link: itemToRemove.link,
          category: itemToRemove.category
        }
      });
      
      // Refresh the wishlist items from the server
      await fetchWishlistItems();
      toast.success('Item removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item from wishlist');
    }
  };

  useEffect(() => {
    fetchWishlistItems();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Wishlist</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">My Wishlist</h1>
      
      {items.length === 0 ? (
        <p>Your wishlist is empty. Start adding items you love!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item._id} className="overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => removeFromWishlist(item._id)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.category}</p>
                <p className="font-medium mt-1">${item.price}</p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {item.likes} likes · {item.saves} saves
                  </div>
                  <Link
                    href={item.link}
                    target="_blank"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Item →
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 