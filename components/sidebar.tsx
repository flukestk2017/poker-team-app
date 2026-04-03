"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/tasks", label: "Daily Tasks", icon: "✓" },
  { href: "/calendar", label: "Calendar", icon: "▦" },
  { href: "/journal", label: "Journal", icon: "✎" },
  { href: "/handtags", label: "Hand Tags", icon: "#" },
  { href: "/feed", label: "Team Feed", icon: "◎" },
  { href: "/settings", label: "Settings", icon: "⚙" },
]

interface SidebarProps {
  user: {
    displayName?: string
    role?: string
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex flex-col border-r border-gray-100 bg-white shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">PT</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">Poker Team</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="w-4 text-center text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-gray-600">
              {user.displayName?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
            <p className="text-xs text-gray-400 capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
