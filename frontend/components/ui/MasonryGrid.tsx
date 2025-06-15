'use client';

import { useEffect, useState } from 'react';
import { WishlistButton } from './WishlistButton';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface MasonryGridProps {
  items: Array<{
    id: string;
    image: string;
    title: string;
    price?: string;
    link?: string;
    category?: string;
  }>;
}

export function MasonryGrid({ items }: MasonryGridProps) {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth < 640) setColumns(1);
      else if (window.innerWidth < 768) setColumns(2);
      else if (window.innerWidth < 1024) setColumns(3);
      else setColumns(4);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const columnItems = Array.from({ length: columns }, (_, i) => 
    items.filter((_, index) => index % columns === i)
  );

  return (
    <div className="flex gap-4">
      {columnItems.map((column, columnIndex) => (
        <div key={columnIndex} className="flex-1 space-y-4">
          {column.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="relative group rounded-xl overflow-hidden bg-white shadow-sm"
            >
              <div className="relative aspect-[3/4]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                <WishlistButton
                  item={{
                    title: item.title,
                    category: item.category || '',
                    price: parseFloat(item.price || '0'),
                    link: item.link || '',
                    thumbnail: item.image,
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                {item.price && (
                  <p className="text-sm text-gray-600 mt-1">${item.price}</p>
                )}
                {item.link && (
                  <Link
                    href={item.link}
                    target="_blank"
                    className="text-sm text-blue-600 hover:underline mt-2 block"
                  >
                    Learn more →
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
} 