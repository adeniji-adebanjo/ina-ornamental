"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const EXCLUDED_PREFIXES = ["/admin", "/login", "/orders/"];

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hide = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <>
      {!hide && <Header />}
      <main className="flex-1">{children}</main>
      {!hide && <Footer />}
    </>
  );
}
