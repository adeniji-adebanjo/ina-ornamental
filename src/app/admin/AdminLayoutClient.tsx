"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Fish,
  Package,
  Users,
  DollarSign,
  LayoutDashboard,
  Image as ImageIcon,
  LogOut,
  Menu,
  Settings,
  Upload,
  Newspaper,
  Clock,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/species", label: "Species", icon: Fish },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/pricing", label: "Custom Pricing", icon: DollarSign },
  { href: "/admin/location-pricing", label: "Location Pricing", icon: Upload },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// After this long with no interaction, warn the admin (rather than signing
// them out immediately) and give them a grace period to stay signed in.
const IDLE_WARN_MS = 40 * 60 * 1000; // 40 minutes
const LOGOUT_COUNTDOWN_S = 60; // grace period before auto sign-out

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
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [countdown, setCountdown] = useState(LOGOUT_COUNTDOWN_S);
  const lastActivityRef = useRef(0);
  const warningRef = useRef(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const performIdleLogout = useCallback(async () => {
    warningRef.current = false;
    setShowIdleWarning(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const staySignedIn = useCallback(() => {
    warningRef.current = false;
    setShowIdleWarning(false);
    lastActivityRef.current = Date.now();
  }, []);

  // Idle detection. A lightweight activity listener stamps a timestamp; a short
  // interval does the actual idle check, so frequent events stay cheap. Once
  // idle past the threshold we show a warning overlay instead of signing out.
  useEffect(() => {
    const bump = () => {
      // Ignore activity while the warning is up — the admin must acknowledge it.
      if (!warningRef.current) lastActivityRef.current = Date.now();
    };
    bump(); // stamp initial activity on mount
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const interval = setInterval(() => {
      if (warningRef.current) return;
      if (Date.now() - lastActivityRef.current >= IDLE_WARN_MS) {
        warningRef.current = true;
        setCountdown(LOGOUT_COUNTDOWN_S);
        setShowIdleWarning(true);
      }
    }, 10_000);

    return () => {
      clearInterval(interval);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, []);

  // Run the grace-period countdown while the warning is showing. A local
  // counter drives the interval so no setState happens in the effect body.
  useEffect(() => {
    if (!showIdleWarning) return;
    let remaining = LOGOUT_COUNTDOWN_S;
    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        setCountdown(0);
        performIdleLogout();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showIdleWarning, performIdleLogout]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <nav className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-mark.svg"
            alt="INÁ Ornamental Fish"
            width={36}
            height={36}
            className="rounded-lg object-contain"
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
      {/* Sheet provides Esc-to-close, focus trap, focus return and scroll lock */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="data-[side=left]:w-64 p-0 gap-0 lg:hidden"
        >
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      {/* Main content — min-w-0 lets this flex child shrink instead of being
          stretched horizontally by wide content (e.g. the species list rows). */}
      <main className="flex-1 lg:ml-64 min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
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

      {/* Idle warning — gives a grace period before auto sign-out */}
      {showIdleWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-900/10">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Clock className="size-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Are you still there?
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              You&apos;ve been inactive for a while. For security, you&apos;ll be
              signed out in{" "}
              <span className="font-semibold text-slate-900">{countdown}s</span>.
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={performIdleLogout}
                className="flex-1 rounded-xl"
              >
                Log out now
              </Button>
              <Button
                onClick={staySignedIn}
                className="flex-1 rounded-xl"
                autoFocus
              >
                Stay signed in
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
