"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/trainer/dashboard", label: "Home", icon: "🏠" },
  { href: "/trainer/vocab", label: "Vocab", icon: "📚" },
  { href: "/trainer/coach", label: "Coach", icon: "🎓" },
  { href: "/trainer/listen", label: "Listen", icon: "🎧" },
  { href: "/trainer/video", label: "Video", icon: "🎬" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
