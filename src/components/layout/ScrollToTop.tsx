"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Floating "scroll to top" button. Appears once the page is scrolled a bit and
 * smooth-scrolls back to the top. Rendered on the public site via LayoutShell.
 */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cnVisible(visible)}
    >
      <ArrowUp className="size-5" />
    </button>
  );
}

function cnVisible(visible: boolean) {
  return [
    "fixed bottom-6 right-4 sm:right-6 z-40 flex size-11 items-center justify-center",
    "rounded-full bg-sky-800 text-white shadow-lg ring-1 ring-black/5",
    "transition-all duration-300 hover:bg-sky-900 hover:-translate-y-0.5",
    visible
      ? "opacity-100 translate-y-0"
      : "pointer-events-none opacity-0 translate-y-3",
  ].join(" ");
}
