"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"

interface User {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await api.get(`/users/users/search?query=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="max-w-md mx-auto px-4 py-6 sm:px-6">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search users..."
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-meta-pink text-base mb-4"
        autoFocus
      />
      {isLoading && <div className="text-center text-gray-400 py-4">Loading...</div>}
      <div className="space-y-2">
        {results.map(user => (
          <button
            key={user.id}
            className="flex items-center w-full p-3 rounded-lg bg-white shadow hover:bg-meta-pink/10 transition-colors gap-3"
            onClick={() => router.push(`/profile/${user.username}`)}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-meta-pink font-bold">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <div className="flex flex-col items-start">
              <span className="font-medium text-gray-900">{user.display_name || user.username}</span>
              <span className="text-xs text-gray-500">@{user.username}</span>
            </div>
          </button>
        ))}
        {!isLoading && query && results.length === 0 && (
          <div className="text-center text-gray-400 py-4">No users found</div>
        )}
      </div>
    </div>
  );
} 