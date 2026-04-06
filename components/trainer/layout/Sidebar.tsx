"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Profile } from "@/types/trainer";

const navItems = [
  { href: "/trainer/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/trainer/vocab", label: "Vocabulary", icon: "📚" },
  { href: "/trainer/coach", label: "Coach Q&A", icon: "🎓" },
  { href: "/trainer/listen", label: "Listening", icon: "🎧" },
  { href: "/trainer/video", label: "Video", icon: "🎬" },
  { href: "/trainer/progress", label: "Progress", icon: "📊" },
];

interface SidebarProps {
  profile: Profile | null;
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface border-r border-border z-40">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♠️</span>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">
              Poker English
            </h1>
            <p className="text-xs text-muted">Trainer</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-gray-400 hover:text-white hover:bg-surface-2"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {profile?.role === "admin" && (
          <Link
            href="/trainer/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/trainer/admin"
                ? "bg-accent/10 text-accent border border-accent/20"
                : "text-gray-400 hover:text-white hover:bg-surface-2"
            }`}
          >
            <span className="text-base">⚙️</span>
            Admin
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        {profile && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
              {profile.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.name}</p>
              <p className="text-xs text-muted capitalize">{profile.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left text-sm text-muted hover:text-white px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
