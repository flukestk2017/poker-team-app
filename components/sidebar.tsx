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
    <aside className="w-56 flex flex-col shrink-0" style={{ background: '#F5F0E8', borderRight: '1px solid #DDD5C8' }}>
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid #DDD5C8' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#8B6F47' }}>
            <span className="text-xs font-bold" style={{ color: '#FAF8F5' }}>DK</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: '#2C2825' }}>DEKpocarr</span>
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
              )}
              style={
                isActive
                  ? { background: '#EDE5D8', color: '#2C2825', fontWeight: 500 }
                  : { color: '#8C7B6B' }
              }
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = '#EDE5D8'
                  ;(e.currentTarget as HTMLElement).style.color = '#2C2825'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = '#8C7B6B'
                }
              }}
            >
              <span className="w-4 text-center text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid #DDD5C8' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E8E0D5' }}>
            <span className="text-xs font-medium" style={{ color: '#5C4A32' }}>
              {user.displayName?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#2C2825' }}>{user.displayName}</p>
            <p className="text-xs capitalize" style={{ color: '#8C7B6B' }}>{user.role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left text-xs transition-colors py-1"
          style={{ color: '#8C7B6B' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#2C2825')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#8C7B6B')}
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
