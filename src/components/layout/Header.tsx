"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Menu,
  MessageCircle,
  Home,
  Fish,
  Image as ImageIcon,
  Newspaper,
  Info,
  Mail,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/catalogue", label: "Catalogue", icon: Fish },
  { href: "/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
];

export default function Header() {
  const { cart } = useStore();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md"
          : "bg-white shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo-mark.svg"
              alt="INÁ Ornamental Fish logo"
              width={96}
              height={96}
              className="w-10 h-10 md:w-12 md:h-12 object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-700 hover:text-sky-700 font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-sky-700 after:transition-all hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/order"
              title="Quote Cart"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "relative",
              )}
            >
              <ShoppingCart className="size-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 size-5 justify-center rounded-full px-0 text-[10px] bg-emerald-600 text-white border-0">
                  {itemCount}
                </Badge>
              )}
            </Link>
            <a
              href="https://wa.me/2348168850307"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "rounded-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2",
              )}
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </div>

          {/* Mobile menu button & cart */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/order"
              title="Quote Cart"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "relative",
              )}
            >
              <ShoppingCart className="size-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 size-5 justify-center rounded-full px-0 text-[10px] bg-emerald-600 text-white border-0">
                  {itemCount}
                </Badge>
              )}
            </Link>

            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Open menu" />
                }
              >
                <Menu className="size-6" />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[17rem] p-0 bg-white flex flex-col"
              >
                {/* Branded header */}
                <div className="flex items-center gap-2 px-5 pt-5 pb-4">
                  <Image
                    src="/logo-mark.svg"
                    alt="INÁ Ornamental Fish"
                    width={36}
                    height={36}
                    className="size-9 object-contain"
                  />
                  <SheetTitle className="text-base font-black text-sky-900 leading-tight">
                    INÁ Ornamental
                  </SheetTitle>
                </div>
                <SheetDescription className="sr-only">
                  Site navigation
                </SheetDescription>
                <Separator />

                <nav className="flex-1 overflow-y-auto flex flex-col gap-1 px-3 py-3">
                  {navLinks.map((link) => {
                    const active = isActive(link.href);
                    return (
                      <SheetClose
                        key={link.href}
                        render={<Link href={link.href} />}
                      >
                        <span
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-[15px] transition-colors",
                            active
                              ? "bg-sky-50 text-sky-800"
                              : "text-slate-700 hover:bg-slate-50 hover:text-sky-700",
                          )}
                        >
                          <link.icon className="size-5 shrink-0" />
                          {link.label}
                          {active && (
                            <span className="ml-auto size-1.5 rounded-full bg-sky-600" />
                          )}
                        </span>
                      </SheetClose>
                    );
                  })}

                  <Separator className="my-2" />

                  {/* Cart / order */}
                  <SheetClose render={<Link href="/order" />}>
                    <span className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-[15px] text-slate-700 hover:bg-slate-50 hover:text-sky-700 transition-colors">
                      <ShoppingCart className="size-5 shrink-0" />
                      Your Order
                      {itemCount > 0 ? (
                        <Badge className="ml-auto rounded-full bg-emerald-600 text-white border-0">
                          {itemCount}
                        </Badge>
                      ) : (
                        <ChevronRight className="ml-auto size-4 text-slate-300" />
                      )}
                    </span>
                  </SheetClose>
                </nav>

                <div className="px-4 pb-5 pt-2 border-t border-slate-100">
                  <a
                    href="https://wa.me/2348168850307"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2",
                    )}
                  >
                    <MessageCircle className="size-5" />
                    Chat on WhatsApp
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
