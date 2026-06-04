"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Fish,
  Package,
  Users,
  DollarSign,
  LayoutDashboard,
  Image,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/species", label: "Species", icon: Fish },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/pricing", label: "Custom Pricing", icon: DollarSign },
  { href: "/admin/gallery", label: "Gallery", icon: Image },
];

export default function AdminLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <nav className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/ina-logo.svg"
            alt="INA Ornamental"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-lg font-black text-sky-800">Admin</span>
        </Link>
      </div>

      <div className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-sky-50 text-sky-800"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 mb-2 truncate">{user.email}</p>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-600"
        >
          <LogOut className="size-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-slate-200 fixed inset-y-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="w-64 bg-white h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-500"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex-1" />
          <Link href="/" className="text-sm text-slate-500 hover:text-sky-700">
            View Site →
          </Link>
        </header>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
