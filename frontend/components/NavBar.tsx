"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Table2, ScanLine, PlusCircle } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Apps", icon: Table2 },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/add", label: "Add", icon: PlusCircle },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar — glass header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] px-5 py-3.5 flex items-center justify-between"
        style={{ background: "rgba(9, 9, 11, 0.8)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <span className="text-white text-sm font-bold">JT</span>
          </div>
          <span className="gradient-text font-bold text-lg tracking-tight">
            Job Tracker
          </span>
        </Link>
        {/* Desktop nav inline */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-white/[0.08] text-white shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon size={16} className={active ? "text-indigo-400" : ""} />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Bottom nav for mobile (iOS PWA style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden pb-safe"
        style={{ background: "rgba(9, 9, 11, 0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2.5 text-[11px] gap-1 transition-all duration-200 ${
                active ? "text-indigo-400" : "text-zinc-500"
              }`}
            >
              <div className={`p-1 rounded-lg transition-all duration-200 ${active ? "bg-indigo-500/10" : ""}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              </div>
              <span className={active ? "font-semibold" : "font-medium"}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
