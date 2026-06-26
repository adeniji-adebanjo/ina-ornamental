"use client";

import Link from "next/link";
import Image from "next/image";
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
import { ShoppingCart, Menu, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { cart } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
              <SheetContent side="right" className="w-72 p-0 bg-white">
                <SheetTitle className="px-5 pt-5 text-lg font-bold text-slate-900">
                  Menu
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Site navigation
                </SheetDescription>
                <Separator className="my-2" />
                <nav className="flex flex-col gap-1 px-3 py-2">
                  {navLinks.map((link) => (
                    <SheetClose
                      key={link.href}
                      render={<Link href={link.href} />}
                    >
                      <span className="block px-3 py-2.5 text-slate-800 hover:bg-sky-50 hover:text-sky-700 rounded-lg font-semibold text-base transition-colors">
                        {link.label}
                      </span>
                    </SheetClose>
                  ))}
                </nav>
                <Separator className="my-2" />
                <div className="px-4 pb-5">
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
