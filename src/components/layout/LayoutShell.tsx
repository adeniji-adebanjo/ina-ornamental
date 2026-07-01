"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";

const EXCLUDED_PREFIXES = ["/admin", "/login", "/orders/"];

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hide = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
  // The public order builder has its own sticky bottom bar on mobile, so skip
  // the floating button there to avoid overlap.
  const showScrollTop = !hide && !pathname.startsWith("/order");

  return (
    <>
      {!hide && <Header />}
      <main className="flex-1">{children}</main>
      {!hide && <Footer />}
      {showScrollTop && <ScrollToTop />}
    </>
  );
}
