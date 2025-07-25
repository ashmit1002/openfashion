"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, User2, Shirt, MessageCircle, Clock, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/closet", icon: Shirt, label: "Closet" },
  { href: "/wishlist", icon: Heart, label: "Wishlist" },
  { href: "/profile/search", icon: Search, label: "Search" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Add chat and analysis jobs items if user is logged in
  const allNavItems = user ? [
    ...navItems, 
    { href: "/fashion-search", icon: Sparkles, label: "Search" },
    { href: "/chat", icon: MessageCircle, label: "Chat" },
    { href: "/analysis-jobs", icon: Clock, label: "History" }
  ] : navItems;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex justify-around items-center h-16 md:hidden shadow-t">
      {allNavItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active ? "text-meta-pink" : "text-gray-500 hover:text-meta-pink"}`}
          >
            <Icon className="w-7 h-7 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
} 