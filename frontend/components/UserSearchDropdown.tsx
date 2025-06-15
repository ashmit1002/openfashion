import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export default function UserSearchDropdown() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await api.get(`/users/users/search?query=${encodeURIComponent(query)}`);
        setResults(res.data);
        setIsOpen(true);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Find People..."
        className="px-3 py-2 rounded-full text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-meta-pink w-64 transition-all pr-10"
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
      />
      {/* Clear (X) button */}
      {query && (
        <button
          type="button"
          onClick={() => { setQuery(""); setResults([]); setIsOpen(false); inputRef.current?.focus(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-meta-pink focus:outline-none"
          tabIndex={-1}
          aria-label="Clear search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {isOpen && results.length > 0 && (
        <div ref={dropdownRef} className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
          )}
          {results.map(user => (
            <button
              key={user.id}
              className="flex items-center w-full px-4 py-2 hover:bg-meta-pink/10 transition-colors text-left gap-3"
              onClick={() => {
                setIsOpen(false);
                setQuery("");
                router.push(`/profile/${user.username}`);
              }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-meta-pink font-bold">
                  {user.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">{user.display_name || user.username}</div>
                <div className="text-xs text-gray-500">@{user.username}</div>
              </div>
            </button>
          ))}
          {!isLoading && results.length === 0 && (
            <div className="p-4 text-center text-gray-400 text-sm">No users found</div>
          )}
        </div>
      )}
    </div>
  );
} 