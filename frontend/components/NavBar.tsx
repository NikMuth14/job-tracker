"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Table2, ScanLine, PlusCircle } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Table2 },
  { href: "/scan", label: "Scan Gmail", icon: ScanLine },
  { href: "/add", label: "Add", icon: PlusCircle },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="text-indigo-400 font-bold text-lg tracking-tight">
          🎯 Job Tracker
        </span>
        <span className="text-gray-400 text-sm hidden md:block">
          Your daily application dashboard
        </span>
      </header>

      {/* Bottom nav for mobile (iOS PWA style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex md:hidden z-50">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors ${
                active ? "text-indigo-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Top nav for desktop */}
      <nav className="hidden md:flex bg-gray-900 border-b border-gray-800 px-6 gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 ${
                active
                  ? "text-indigo-400 border-indigo-400"
                  : "text-gray-400 border-transparent hover:text-gray-200"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
