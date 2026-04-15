"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Network, Settings, LogOut } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/tunnels", label: "Tunnels", icon: "🌐" },
    { href: "/exit-agents", label: "Exit Agents", icon: "🔌" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-white shadow-lg">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Network className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-bold">IP-Relay</h1>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                pathname === item.href
                  ? "bg-primary text-white"
                  : "text-slate-300 hover:bg-slate-700"
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-secondary">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-semibold text-white">{user.firstName}</p>
              <p className="text-slate-400 text-xs">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
            <UserButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-8">{children}</div>
      </main>
    </div>
  );
}
